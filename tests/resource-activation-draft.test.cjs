const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SUPPORTED_ACTIVATION_TYPES,
  createResourceActivationDraft,
} = require('../src/aps/resource-activation-draft.js');
const handler = require('../api/onboarding/resource-activation-draft.js');

function invokeHandler(body, method = 'POST') {
  const response = {
    statusCode: 0,
    payload: undefined,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  handler({ method, body }, response);
  return response;
}

test('resource activation draft returns deterministic recommendations for identical inputs', () => {
  const input = {
    onboarderId: 'onboarder_mvp_56',
    activationType: 'compute_request',
    candidates: ['aws_lambda', 'vercel', 'device_compute', 'community_compute'],
  };

  const first = createResourceActivationDraft(input);
  const second = createResourceActivationDraft(input);

  assert.deepEqual(first, second);
  assert.equal(first.allowedToExecute, false);
  assert.equal(first.executionGuardrails.allowedToExecute, false);
  assert.equal(first.status, 'draft_pending_approval');
  assert.equal(first.proofTrailDraft.status, 'draft_pending_approval');
  assert.equal(first.proofTrailDraft.writeStatus, 'draft_record_created');
});

test('candidate order and duplicates do not change a draft recommendation or identifier', () => {
  const first = createResourceActivationDraft({
    onboarderId: 'canonical_onboarder',
    activationType: 'compute_request',
    candidates: ['vercel', 'aws_lambda', 'vercel'],
  });
  const second = createResourceActivationDraft({
    onboarderId: 'canonical_onboarder',
    activationType: 'compute_request',
    candidates: ['aws_lambda', 'vercel'],
  });

  assert.equal(first.draftId, second.draftId);
  assert.deepEqual(first, second);
});

test('solar-backed node scenario prefers solar/device style lanes when candidates support them', () => {
  const draft = createResourceActivationDraft({
    onboarderId: 'solar_onboarder',
    activationType: 'solar_backed_node',
    candidates: ['aws_lambda', 'solar_backup', 'device_compute', 'vercel'],
  });

  const recommendedLane = draft.recommendedLane.lane;
  const scoredLanes = draft.autoDrillSelector.scoredLanes.map((entry) => entry.lane);

  assert.ok(['device_compute', 'solar_backup'].includes(recommendedLane));
  assert.deepEqual(scoredLanes.sort(), ['device_compute', 'solar_backup'].sort());
  assert.ok(draft.proofRequirements.some((entry) => entry.requirement === 'solar_backup_capacity_proof'));
  assert.equal(draft.activeNodeStatus, 'proof_gated');
});

test('gas budget and token-space lease fields are planning-only and approval gated', () => {
  const gasDraft = createResourceActivationDraft({
    onboarderId: 'gas_onboarder',
    activationType: 'gas_fee_budget',
    candidates: ['base', 'usdc', 'x402'],
  });
  const leaseDraft = createResourceActivationDraft({
    onboarderId: 'lease_onboarder',
    activationType: 'token_space_lease',
    candidates: ['base', 'ton', 'blockscout'],
  });

  assert.equal(gasDraft.gasBudgetEstimate.planningOnly, true);
  assert.equal(gasDraft.gasBudgetEstimate.spendAuthorized, false);
  assert.equal(gasDraft.executionGuardrails.signTransactions, false);
  assert.equal(leaseDraft.tokenSpaceLeasePlan.planningOnly, true);
  assert.equal(leaseDraft.tokenSpaceLeasePlan.paidLeaseActivated, false);
  assert.equal(leaseDraft.executionGuardrails.activatePaidLeases, false);
});

test('resource activation draft endpoint validates POST requests and returns compatible records', () => {
  const response = invokeHandler({
    onboarderId: 'endpoint_onboarder',
    activationType: 'edge_performance_lane',
    candidateResourceLanes: ['cloudflare', 'vercel', 'aws_lambda'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.allowedToExecute, false);
  assert.ok(response.payload.compatibility.includes('airtable'));
  assert.ok(response.payload.compatibility.includes('dynamodb'));
  assert.ok(response.payload.compatibility.includes('linear'));
  assert.ok(response.payload.compatibility.includes('postman'));
  assert.ok(response.payload.compatibility.includes('proof-packet-records'));
  assert.equal(response.payload.integrationRecords.airtable.fields.allowedToExecute, false);
  assert.equal(response.payload.integrationRecords.dynamodb.item.humanApprovalRequired, true);
  assert.equal(response.payload.integrationRecords.linear.metadata.status, 'draft_pending_approval');
  assert.equal(response.payload.integrationRecords.postman.method, 'POST');
  assert.equal(response.payload.integrationRecords.proofPacket.recordId, response.payload.draftId);
});

test('resource activation draft endpoint rejects invalid methods and payloads', () => {
  const methodResponse = invokeHandler({}, 'GET');
  const badPayloadResponse = invokeHandler({ onboarderId: 'missing_type' });

  assert.equal(methodResponse.statusCode, 405);
  assert.equal(methodResponse.headers.Allow, 'POST');
  assert.equal(badPayloadResponse.statusCode, 400);
});

test('all activation types remain approval gated and include type-specific proof', () => {
  for (const activationType of SUPPORTED_ACTIVATION_TYPES) {
    const draft = createResourceActivationDraft({
      onboarderId: `guardrail_${activationType}`,
      activationType,
    });

    assert.equal(draft.allowedToExecute, false);
    assert.equal(draft.humanApprovalRequired, true);
    assert.equal(draft.activeNodeStatus, 'proof_gated');
    assert.equal(draft.approvalQueue.allowedToExecute, false);
    assert.equal(draft.executionGuardrails.spendFunds, false);
    assert.equal(draft.executionGuardrails.transferTokens, false);
    assert.equal(draft.executionGuardrails.signTransactions, false);
    assert.equal(draft.executionGuardrails.activatePaidLeases, false);
    assert.equal(draft.executionGuardrails.deployProductionInfrastructure, false);
    assert.ok(draft.proofRequirements.length > 3);
  }
});

test('request approval flags cannot bypass no-execution guardrails', () => {
  const response = invokeHandler({
    onboarderId: 'untrusted_approval_input',
    activationType: 'token_space_lease',
    candidates: ['base'],
    allowedToExecute: true,
    approved: true,
    spendAuthorized: true,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.allowedToExecute, false);
  assert.equal(response.payload.gasBudgetEstimate.spendAuthorized, false);
  assert.equal(response.payload.tokenSpaceLeasePlan.paidLeaseActivated, false);
  assert.equal(response.payload.executionGuardrails.signTransactions, false);
});

test('invalid candidate lanes are rejected rather than silently replaced', () => {
  const response = invokeHandler({
    onboarderId: 'invalid_candidate_onboarder',
    activationType: 'compute_request',
    candidates: ['aws_lambda', 'credential_from_chat'],
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, 'invalid_request');
});
