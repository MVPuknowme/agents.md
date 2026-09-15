const { createHash } = require("node:crypto");
const { selectAutoDrillResource } = require("./auto-drill-selector.ts");

const SUPPORTED_ACTIVATION_TYPES = [
  "compute_contribution",
  "compute_request",
  "storage_contribution",
  "storage_request",
  "network_failover",
  "solar_backed_node",
  "gas_fee_budget",
  "token_space_lease",
  "platform_resource_discovery",
  "edge_performance_lane",
  "warehouse_server_lane",
];

const SUPPORTED_LANES = [
  "base",
  "usdc",
  "x402",
  "allbridge",
  "helium",
  "ton",
  "cloudflare",
  "blockscout",
  "local_wifi",
  "lora",
  "azure",
  "railway",
  "vercel",
  "aws_lambda",
  "aws_dynamodb",
  "aws_s3",
  "community_compute",
  "device_compute",
  "solar_backup",
];

const DEFAULT_CANDIDATES = {
  compute_contribution: ["device_compute", "community_compute", "aws_lambda", "vercel"],
  compute_request: ["aws_lambda", "vercel", "cloudflare", "community_compute", "device_compute"],
  storage_contribution: ["aws_s3", "aws_dynamodb", "community_compute", "device_compute"],
  storage_request: ["aws_s3", "aws_dynamodb", "cloudflare", "vercel"],
  network_failover: ["cloudflare", "local_wifi", "helium", "lora", "vercel"],
  solar_backed_node: ["solar_backup", "device_compute", "community_compute"],
  gas_fee_budget: ["base", "usdc", "x402", "blockscout"],
  token_space_lease: ["base", "usdc", "ton", "blockscout"],
  platform_resource_discovery: ["cloudflare", "vercel", "aws_lambda", "aws_s3", "base", "blockscout"],
  edge_performance_lane: ["cloudflare", "vercel", "aws_lambda", "local_wifi"],
  warehouse_server_lane: ["aws_lambda", "aws_dynamodb", "aws_s3", "community_compute", "device_compute"],
};

const ACTIVATION_INTENTS = {
  compute_contribution: "provide_compute",
  compute_request: "request_compute",
  storage_contribution: "provide_storage",
  storage_request: "request_storage",
  network_failover: "request_failover",
  solar_backed_node: "onboard_node",
  gas_fee_budget: "validate_proof",
  token_space_lease: "find_platform_resource",
  platform_resource_discovery: "find_platform_resource",
  edge_performance_lane: "request_network",
  warehouse_server_lane: "provide_compute",
};

const COMPATIBILITY_TARGETS = ["airtable", "dynamodb", "linear", "postman", "proof-packet-records"];

function isActivationType(value) {
  return typeof value === "string" && SUPPORTED_ACTIVATION_TYPES.includes(value);
}

function isCandidateLane(value) {
  return typeof value === "string" && SUPPORTED_LANES.includes(value);
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function stableId(prefix, input) {
  const digest = createHash("sha256").update(stableStringify(input)).digest("hex").slice(0, 16);
  return `${prefix}_${digest}`;
}

function uniqueCandidates(candidates) {
  return [...new Set(candidates)].sort((left, right) => left.localeCompare(right));
}

function candidatePool(input) {
  const requested = input.candidates ?? input.candidateResourceLanes ?? [];
  const sanitizedRequested = uniqueCandidates(requested.filter(isCandidateLane));
  const fallback = DEFAULT_CANDIDATES[input.activationType];

  if (input.activationType === "solar_backed_node") {
    const solarCapable = sanitizedRequested.filter((lane) => lane === "solar_backup" || lane === "device_compute");
    return {
      lanes: solarCapable.length > 0 ? solarCapable : fallback,
      source: solarCapable.length > 0 ? "request_solar_capable" : "default",
    };
  }

  return {
    lanes: sanitizedRequested.length > 0 ? sanitizedRequested : fallback,
    source: sanitizedRequested.length > 0 ? "request" : "default",
  };
}

function leaseModelFor(type) {
  const models = {
    compute_contribution: {
      model: "contribution_credit",
      approvalRequired: true,
      executionField: false,
      notes: "Drafts a compute contribution lane without activating payouts or production workloads.",
    },
    compute_request: {
      model: "reserved_capacity",
      approvalRequired: true,
      executionField: false,
      notes: "Plans compute capacity reservation before any paid lease or deployment occurs.",
    },
    storage_contribution: {
      model: "contribution_credit",
      approvalRequired: true,
      executionField: false,
      notes: "Drafts a storage contribution lane with proof required before acceptance.",
    },
    storage_request: {
      model: "reserved_capacity",
      approvalRequired: true,
      executionField: false,
      notes: "Plans storage capacity and proof requirements before any paid lease starts.",
    },
    network_failover: {
      model: "failover_reserve",
      approvalRequired: true,
      executionField: false,
      notes: "Queues advisory failover reserve planning without switching live traffic.",
    },
    solar_backed_node: {
      model: "solar_device_reserve",
      approvalRequired: true,
      executionField: false,
      notes: "Prioritizes solar-backed and device-compute planning while active_node remains proof-gated.",
    },
    gas_fee_budget: {
      model: "gas_budget_plan",
      approvalRequired: true,
      executionField: false,
      notes: "Creates a gas budgeting estimate only; no wallet movement or spending is authorized.",
    },
    token_space_lease: {
      model: "token_space_plan",
      approvalRequired: true,
      executionField: false,
      notes: "Prepares token-space lease planning fields only; no paid lease is activated.",
    },
    platform_resource_discovery: {
      model: "discovery_shortlist",
      approvalRequired: true,
      executionField: false,
      notes: "Builds an approval-gated shortlist for platform resource matching.",
    },
    edge_performance_lane: {
      model: "reserved_capacity",
      approvalRequired: true,
      executionField: false,
      notes: "Drafts edge performance capacity planning without production traffic changes.",
    },
    warehouse_server_lane: {
      model: "reserved_capacity",
      approvalRequired: true,
      executionField: false,
      notes: "Plans warehouse/server lane capacity while infrastructure activation remains approval-gated.",
    },
  };

  return models[type];
}

function gasBudgetFor(type, score) {
  const estimatedUnits = type === "gas_fee_budget" || type === "token_space_lease" ? Math.max(21_000, Math.round(score * 1_000)) : 0;
  return {
    planningOnly: true,
    executionField: false,
    estimatedUnits,
    estimatedUsdMinor: estimatedUnits === 0 ? 0 : Math.round(estimatedUnits * 0.02),
    spendAuthorized: false,
    notes: "Estimate is for approval planning only and cannot spend funds, transfer tokens, or sign transactions.",
  };
}

function tokenSpacePlanFor(type, score) {
  const leaseRequested = type === "token_space_lease";
  return {
    planningOnly: true,
    executionField: false,
    leaseRequested,
    estimatedSlots: leaseRequested ? Math.max(1, Math.round(score / 20)) : 0,
    paidLeaseActivated: false,
    notes: "Lease fields are planning metadata only until a human approval and proof gate are present.",
  };
}

function riskLevelFor(score, type) {
  if (["gas_fee_budget", "token_space_lease", "network_failover"].includes(type)) {
    return score >= 82 ? "medium" : "high";
  }

  if (score >= 82) return "low";
  if (score >= 68) return "medium";
  return "high";
}

function proofRequirementsFor(type) {
  const baseRequirements = [
    { requirement: "human_approval", status: "required_before_execution" },
    { requirement: "onboarder_identity_proof", status: "required_before_execution" },
    { requirement: "resource_lane_score_receipt", status: "required_before_execution" },
  ];

  const typeSpecific = {
    compute_contribution: [
      { requirement: "compute_capacity_proof", status: "required_before_execution" },
      { requirement: "device_health_receipt", status: "required_before_execution" },
    ],
    compute_request: [
      { requirement: "compute_capacity_quote", status: "required_before_execution" },
      { requirement: "deployment_plan_review", status: "required_before_execution" },
    ],
    storage_contribution: [
      { requirement: "storage_capacity_proof", status: "required_before_execution" },
      { requirement: "retention_policy_review", status: "required_before_execution" },
    ],
    storage_request: [
      { requirement: "storage_capacity_quote", status: "required_before_execution" },
      { requirement: "data_handling_review", status: "required_before_execution" },
    ],
    solar_backed_node: [
      { requirement: "solar_backup_capacity_proof", status: "required_before_execution" },
      { requirement: "device_compute_health_proof", status: "required_before_execution" },
      { requirement: "active_node_gate_receipt", status: "required_before_execution" },
    ],
    gas_fee_budget: [
      { requirement: "gas_budget_approval_receipt", status: "required_before_execution" },
      { requirement: "no_wallet_signing_attestation", status: "required_before_execution" },
    ],
    token_space_lease: [
      { requirement: "lease_terms_review", status: "required_before_execution" },
      { requirement: "paid_lease_approval_receipt", status: "required_before_execution" },
    ],
    network_failover: [
      { requirement: "failover_health_manifest", status: "required_before_execution" },
      { requirement: "traffic_switch_approval", status: "required_before_execution" },
    ],
    platform_resource_discovery: [
      { requirement: "resource_inventory_receipt", status: "required_before_execution" },
    ],
    edge_performance_lane: [
      { requirement: "latency_measurement_receipt", status: "required_before_execution" },
      { requirement: "edge_capacity_review", status: "required_before_execution" },
    ],
    warehouse_server_lane: [
      { requirement: "warehouse_capacity_proof", status: "required_before_execution" },
      { requirement: "server_health_receipt", status: "required_before_execution" },
    ],
  };

  return [...baseRequirements, ...(typeSpecific[type] ?? [])];
}

function normalizeResourceActivationDraftInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("invalid_resource_activation_draft_request");
  }

  const activationType = input.activationType ?? input.requestedActivationType;
  const suppliedCandidates = input.candidates ?? input.candidateResourceLanes;

  if (
    typeof input.onboarderId !== "string" ||
    input.onboarderId.trim().length === 0 ||
    !isActivationType(activationType) ||
    (suppliedCandidates !== undefined &&
      (!Array.isArray(suppliedCandidates) || suppliedCandidates.some((lane) => !isCandidateLane(lane))))
  ) {
    throw new Error("invalid_resource_activation_draft_request");
  }

  const candidates = Array.isArray(suppliedCandidates) ? uniqueCandidates(suppliedCandidates) : undefined;

  return {
    onboarderId: input.onboarderId.trim(),
    activationType,
    requestedActivationType: activationType,
    candidates,
  };
}

function integrationRecordsFor(draft) {
  const common = {
    draftId: draft.draftId,
    onboarderId: draft.onboarderId,
    activationType: draft.activationType,
    status: draft.status,
    recommendedLane: draft.recommendedLane?.lane ?? null,
    riskLevel: draft.riskLevel,
    allowedToExecute: false,
    humanApprovalRequired: true,
  };

  return {
    airtable: {
      table: "Resource Activation Drafts",
      fields: common,
    },
    dynamodb: {
      partitionKey: `ONBOARDER#${draft.onboarderId}`,
      sortKey: `RESOURCE_ACTIVATION_DRAFT#${draft.draftId}`,
      item: common,
    },
    linear: {
      issueLabel: "resource-activation-draft",
      metadata: common,
    },
    postman: {
      endpoint: "/api/onboarding/resource-activation-draft",
      method: "POST",
      responseSchemaVersion: draft.schemaVersion,
    },
    proofPacket: {
      recordType: "resource_activation_draft",
      recordId: draft.draftId,
      fields: common,
    },
  };
}

function createResourceActivationDraft(input) {
  const normalized = normalizeResourceActivationDraftInput(input);
  const candidateSelection = candidatePool(normalized);
  const candidates = candidateSelection.lanes;
  const intent = ACTIVATION_INTENTS[normalized.activationType];
  const selectorResult = selectAutoDrillResource({ intent, candidates });
  const recommendation = selectorResult.recommendation;
  const score = typeof recommendation?.score === "number" ? recommendation.score : 0;
  const draftId = stableId("rad", {
    onboarderId: normalized.onboarderId,
    activationType: normalized.activationType,
    candidates,
    recommendedLane: recommendation?.lane ?? null,
  });

  const draft = {
    schemaVersion: "1.0",
    draftId,
    onboarderId: normalized.onboarderId,
    activationType: normalized.activationType,
    requestedActivationType: normalized.requestedActivationType ?? normalized.activationType,
    status: "draft_pending_approval",
    allowedToExecute: false,
    humanApprovalRequired: true,
    activeNodeStatus: "proof_gated",
    recommendedLane: recommendation,
    recommendedLeaseModel: leaseModelFor(normalized.activationType),
    gasBudgetEstimate: gasBudgetFor(normalized.activationType, score),
    tokenSpaceLeasePlan: tokenSpacePlanFor(normalized.activationType, score),
    riskLevel: riskLevelFor(score, normalized.activationType),
    proofRequirements: proofRequirementsFor(normalized.activationType),
    proofTrailDraft: {
      writeIntent: "proof_trail_draft_status",
      writeStatus: "draft_record_created",
      status: "draft_pending_approval",
      recordType: "resource_activation_draft",
      draftId,
      proofPacketCompatible: true,
      airtableCompatible: true,
      dynamodbCompatible: true,
      linearCompatible: true,
      postmanCompatible: true,
    },
    approvalQueue: {
      queue: "resource_activation_approval",
      status: "approval_required",
      allowedToExecute: false,
      nextAction: "human_review",
    },
    autoDrillSelector: {
      ...selectorResult,
      generatedAt: "deterministic-draft",
      candidateSource: candidateSelection.source,
    },
    compatibility: COMPATIBILITY_TARGETS,
    executionGuardrails: {
      advisoryOnly: true,
      allowedToExecute: false,
      spendFunds: false,
      transferTokens: false,
      signTransactions: false,
      activatePaidLeases: false,
      deployProductionInfrastructure: false,
      reason: "Resource activation drafts may recommend, estimate, and queue approval only. Human approval and proof gates are required before execution.",
    },
  };

  return {
    ...draft,
    integrationRecords: integrationRecordsFor(draft),
  };
}

module.exports = {
  SUPPORTED_ACTIVATION_TYPES,
  createResourceActivationDraft,
  normalizeResourceActivationDraftInput,
};
