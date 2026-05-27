const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = require('node:fs').readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  module._compile(output.outputText, filename);
};

const { createSkyGridOnboarderHandler } = require('../src/aps/skygrid-onboarder-lambda.ts');

class MemoryStore {
  constructor() { this.map = new Map(); }
  async put(record) { this.map.set(record.onboarderId, record); }
  async getById(id) { return this.map.get(id) ?? null; }
  async queryByStatus(status) { return [...this.map.values()].filter((r) => r.onboardingStatus === status); }
  async updateStatus(id, onboardingStatus, updatedAt) {
    const rec = this.map.get(id); if (!rec) return null;
    const next = { ...rec, onboardingStatus, updatedAt }; this.map.set(id, next); return next;
  }
}

test('create writes record and masks refs', async () => {
  const handler = createSkyGridOnboarderHandler(new MemoryStore());
  const response = await handler({ action: 'create', payload: { onboarderId: 'ob_1', name: 'Node A', type: 'validator', networkInterest: 'mainnet', onboardingStatus: 'draft', rateBand: 'mid', payoutPreference: 'bank', proofRequired: true, preflightId: 'preflight_12345', settlementRef: 'settlement_9999', evidenceUrls: [] } });
  assert.equal(response.statusCode, 201);
  const body = JSON.parse(response.body);
  assert.equal(body.record.preflightId.endsWith('2345'), true);
  assert.equal(body.record.settlementRef.endsWith('9999'), true);
});

test('update_status enforces forward-only and proof gate for active_node', async () => {
  const store = new MemoryStore();
  const handler = createSkyGridOnboarderHandler(store);
  await handler({ action: 'create', payload: { onboarderId: 'ob_2', name: 'Node B', type: 'validator', networkInterest: 'testnet', onboardingStatus: 'submitted', rateBand: 'high', payoutPreference: 'ach', proofRequired: true, evidenceUrls: [] } });

  const blocked = await handler({ action: 'update_status', payload: { onboarderId: 'ob_2', onboardingStatus: 'active_node' } });
  assert.equal(blocked.statusCode, 409);
  assert.equal(JSON.parse(blocked.body).error, 'proof_missing');

  const backward = await handler({ action: 'update_status', payload: { onboarderId: 'ob_2', onboardingStatus: 'draft' } });
  assert.equal(backward.statusCode, 409);
});

test('get_by_status and validate_proof work', async () => {
  const store = new MemoryStore();
  const handler = createSkyGridOnboarderHandler(store);
  await handler({ action: 'create', payload: { onboarderId: 'ob_3', name: 'Node C', type: 'validator', networkInterest: 'mainnet', onboardingStatus: 'proof_pending', rateBand: 'low', payoutPreference: 'wire', proofRequired: true, evidenceUrls: ['https://example.com/evidence'] } });

  const byStatus = await handler({ action: 'get_by_status', payload: { onboardingStatus: 'proof_pending' } });
  assert.equal(byStatus.statusCode, 200);
  assert.equal(JSON.parse(byStatus.body).count, 1);

  const proof = await handler({ action: 'validate_proof', payload: { onboarderId: 'ob_3' } });
  assert.equal(JSON.parse(proof.body).proofStatus, 'proof_ready');
});
