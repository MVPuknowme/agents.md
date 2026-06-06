const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sandboxPayload,
  redactPacificHeartForAudit,
  validatePacificHeartPayload,
  buildSandboxAuditTrail,
  buildSkyGridHandoff,
  buildIncidentReplayEvidence,
} = require('../src/emergency/pacific-heart-ingest');

test('sandbox payload validates', () => {
  assert.deepEqual(validatePacificHeartPayload(sandboxPayload), { ok: true });
});

test('missing required field is rejected', () => {
  const payload = { ...sandboxPayload };
  delete payload.vitals;
  assert.equal(validatePacificHeartPayload(payload).ok, false);
});

test('buildSkyGridHandoff creates deterministic lane metadata', () => {
  const handoff = buildSkyGridHandoff(sandboxPayload);
  assert.equal(handoff.lane, 'skygrid-emergency-intake-sandbox');
  assert.equal(handoff.handoff.queue, 'skygrid.emergency.ingest');
  assert.equal(handoff.event.eventId, sandboxPayload.eventId);
});

test('audit redaction avoids raw patient, vital, and coordinate exposure', () => {
  const auditPayload = redactPacificHeartForAudit(sandboxPayload);

  assert.equal(auditPayload.eventId, sandboxPayload.eventId);
  assert.match(auditPayload.patientRef, /^sha256:[a-f0-9]{16}$/);
  assert.notEqual(auditPayload.patientRef, sandboxPayload.patientId);
  assert.deepEqual(auditPayload.vitalKeys, [
    'bloodPressureDiastolic',
    'bloodPressureSystolic',
    'heartRateBpm',
  ]);
  assert.equal('heartRateBpm' in auditPayload, false);
  assert.equal(auditPayload.location.precision, 'withheld_from_audit_log');
  assert.equal('lat' in auditPayload.location, false);
  assert.equal('lng' in auditPayload.location, false);
});

test('sandbox audit trail captures ingest normalization routing and dashboard stages', () => {
  const auditTrail = buildSandboxAuditTrail(sandboxPayload, {
    observedAt: '2026-05-29T00:00:00.000Z',
  });

  assert.deepEqual(
    auditTrail.map((event) => event.stage),
    ['ingest', 'normalization', 'routing', 'dashboard'],
  );
  assert.equal(auditTrail.every((event) => event.outcome === 'success'), true);
  assert.equal(auditTrail.every((event) => event.observedAt === '2026-05-29T00:00:00.000Z'), true);
});

test('invalid payload audit trail records rejection without raw payload logging', () => {
  const auditTrail = buildSandboxAuditTrail({ eventId: 'bad' });

  assert.equal(auditTrail.length, 1);
  assert.equal(auditTrail[0].stage, 'ingest');
  assert.equal(auditTrail[0].outcome, 'rejected');
  assert.equal(auditTrail[0].reason, 'missing_field:patientId');
  assert.equal(auditTrail[0].safePayload.patientRef, null);
});

test('incident replay evidence references sanitized audit sequence and production risks', () => {
  const auditTrail = buildSandboxAuditTrail(sandboxPayload, {
    observedAt: '2026-05-29T00:00:00.000Z',
  });
  const replay = buildIncidentReplayEvidence(sandboxPayload, { auditTrail });

  assert.match(replay.replayId, /^replay_[a-f0-9]{16}$/);
  assert.equal(replay.status, 'ready_for_sandbox_replay');
  assert.equal(replay.incidentRef.eventId, sandboxPayload.eventId);
  assert.notEqual(replay.incidentRef.patientRef, sandboxPayload.patientId);
  assert.deepEqual(
    replay.replaySequence.map((step) => step.stage),
    ['ingest', 'normalization', 'routing', 'dashboard'],
  );
  assert.equal(replay.evidenceReview.rawPhiIncluded, false);
  assert.ok(replay.evidenceReview.productionRisks.length >= 3);
});
