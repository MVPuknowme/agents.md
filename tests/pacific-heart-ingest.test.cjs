const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sandboxPayload,
  validatePacificHeartPayload,
  buildSkyGridHandoff,
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
