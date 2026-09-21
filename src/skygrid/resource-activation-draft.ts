export const activationTypes = [
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
] as const;

export type ActivationType = (typeof activationTypes)[number];

export type ResourceLane = {
  laneId: string;
  laneType: string;
  capacityScore: number;
  latencyScore: number;
  reliabilityScore: number;
  renewableScore?: number;
  supportsSolarBackup?: boolean;
  supportsDeviceCompute?: boolean;
  region?: string;
};

type DraftRequest = {
  onboarderId: string;
  activationType: ActivationType;
  candidateLanes?: ResourceLane[];
};

const defaultCandidatesByType: Record<ActivationType, ResourceLane[]> = {
  compute_contribution: [
    { laneId: "edge-compute-a", laneType: "edge_compute", capacityScore: 88, latencyScore: 84, reliabilityScore: 91 },
    { laneId: "cloud-reserve-b", laneType: "cloud_reserve", capacityScore: 92, latencyScore: 73, reliabilityScore: 93 },
  ],
  compute_request: [
    { laneId: "edge-compute-a", laneType: "edge_compute", capacityScore: 86, latencyScore: 89, reliabilityScore: 90 },
    { laneId: "warehouse-lane-1", laneType: "warehouse_server", capacityScore: 93, latencyScore: 77, reliabilityScore: 88 },
  ],
  storage_contribution: [
    { laneId: "storage-mesh-a", laneType: "storage_mesh", capacityScore: 90, latencyScore: 75, reliabilityScore: 92 },
    { laneId: "cold-store-b", laneType: "cold_storage", capacityScore: 95, latencyScore: 60, reliabilityScore: 94 },
  ],
  storage_request: [
    { laneId: "storage-mesh-a", laneType: "storage_mesh", capacityScore: 88, latencyScore: 79, reliabilityScore: 90 },
    { laneId: "cloud-reserve-b", laneType: "cloud_reserve", capacityScore: 90, latencyScore: 74, reliabilityScore: 93 },
  ],
  network_failover: [
    { laneId: "network-failover-a", laneType: "failover", capacityScore: 84, latencyScore: 85, reliabilityScore: 96 },
    { laneId: "edge-compute-a", laneType: "edge_compute", capacityScore: 80, latencyScore: 88, reliabilityScore: 90 },
  ],
  solar_backed_node: [
    { laneId: "solar-backup-1", laneType: "solar_backup", capacityScore: 80, latencyScore: 70, reliabilityScore: 92, renewableScore: 98, supportsSolarBackup: true },
    { laneId: "device-compute-1", laneType: "device_compute", capacityScore: 76, latencyScore: 82, reliabilityScore: 86, renewableScore: 90, supportsDeviceCompute: true },
  ],
  gas_fee_budget: [{ laneId: "planning-gas-1", laneType: "planning", capacityScore: 70, latencyScore: 70, reliabilityScore: 88 }],
  token_space_lease: [{ laneId: "planning-lease-1", laneType: "planning", capacityScore: 74, latencyScore: 72, reliabilityScore: 87 }],
  platform_resource_discovery: [
    { laneId: "discover-edge-a", laneType: "edge_compute", capacityScore: 85, latencyScore: 86, reliabilityScore: 90 },
    { laneId: "discover-storage-a", laneType: "storage_mesh", capacityScore: 83, latencyScore: 78, reliabilityScore: 91 },
  ],
  edge_performance_lane: [
    { laneId: "edge-perf-a", laneType: "edge_compute", capacityScore: 87, latencyScore: 92, reliabilityScore: 89 },
    { laneId: "edge-perf-b", laneType: "edge_compute", capacityScore: 85, latencyScore: 90, reliabilityScore: 90 },
  ],
  warehouse_server_lane: [
    { laneId: "warehouse-lane-1", laneType: "warehouse_server", capacityScore: 94, latencyScore: 74, reliabilityScore: 92 },
    { laneId: "warehouse-lane-2", laneType: "warehouse_server", capacityScore: 91, latencyScore: 76, reliabilityScore: 90 },
  ],
};

const leaseModelByType: Record<ActivationType, string> = {
  compute_contribution: "shared_capacity_lease",
  compute_request: "burst_compute_lease",
  storage_contribution: "proof_storage_contribution",
  storage_request: "reserved_storage_lease",
  network_failover: "standby_failover_lease",
  solar_backed_node: "solar_resilience_lease",
  gas_fee_budget: "planning_only",
  token_space_lease: "planning_only",
  platform_resource_discovery: "discovery_pass",
  edge_performance_lane: "edge_latency_lease",
  warehouse_server_lane: "warehouse_capacity_lease",
};

function scoreLane(activationType: ActivationType, lane: ResourceLane): number {
  const base = lane.capacityScore * 0.4 + lane.latencyScore * 0.3 + lane.reliabilityScore * 0.3;
  const renewableBoost = activationType === "solar_backed_node" ? (lane.renewableScore ?? 0) * 0.2 : 0;
  const solarBoost = activationType === "solar_backed_node" && lane.supportsSolarBackup ? 8 : 0;
  const deviceBoost = activationType === "solar_backed_node" && lane.supportsDeviceCompute ? 5 : 0;
  return Math.round((base + renewableBoost + solarBoost + deviceBoost) * 100) / 100;
}

export function createResourceActivationDraft(input: DraftRequest) {
  const candidates = (input.candidateLanes && input.candidateLanes.length > 0)
    ? input.candidateLanes
    : defaultCandidatesByType[input.activationType];

  const scored = candidates
    .map((lane) => ({ lane, score: scoreLane(input.activationType, lane) }))
    .sort((a, b) => (b.score - a.score) || a.lane.laneId.localeCompare(b.lane.laneId));

  const recommended = scored[0];
  const riskLevel = recommended.score >= 90 ? "low" : recommended.score >= 80 ? "medium" : "elevated";

  return {
    onboarderId: input.onboarderId,
    activationType: input.activationType,
    allowedToExecute: false,
    draftStatus: "approval_queued",
    recommendedLane: recommended.lane,
    leaseModel: leaseModelByType[input.activationType],
    gasBudgetEstimate: {
      units: input.activationType === "gas_fee_budget" ? 150000 : 65000,
      token: "GAS",
      planningOnly: true,
    },
    tokenSpaceLeasePlan: {
      estimatedUnits: input.activationType === "token_space_lease" ? 1200 : 300,
      planningOnly: true,
    },
    riskLevel,
    proofRequirements: [
      "approval_ticket",
      "onboarder_signature",
      "resource_lane_snapshot",
      "cost_estimate_hash",
    ],
    proofTrail: {
      status: "draft_written",
      recordType: "resource_activation_draft",
      executionGate: "approval_required",
      scoredCandidates: scored.map((entry) => ({ laneId: entry.lane.laneId, score: entry.score })),
    },
  };
}
