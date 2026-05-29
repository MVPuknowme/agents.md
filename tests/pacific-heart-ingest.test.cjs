const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sandboxPayload,
  validatePacificHeartPayload,
  buildSkyGridHandoff,
  buildResponderSummaryFromHandoff,
  buildSandboxResponderSummary,
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

test('buildResponderSummaryFromHandoff exposes only responder-safe sandbox fields', () => {
  const handoff = buildSkyGridHandoff(sandboxPayload);
  const result = buildResponderSummaryFromHandoff(handoff);

  assert.equal(result.ok, true);
  assert.equal(result.summary.view, 'responder-pre-arrival-summary');
  assert.equal(result.summary.validation.sourceValidated, true);
  assert.equal(result.summary.validation.normalizedEventValidated, true);
  assert.equal(result.summary.event.eventId, sandboxPayload.eventId);
  assert.equal(result.summary.event.priority, 'high_pre_arrival_attention');
  assert.equal(result.summary.event.vitals.heartRateBpm, sandboxPayload.vitals.heartRateBpm);
  assert.equal(result.summary.privacy.patientIdentifierIncluded, false);
  assert.equal(result.summary.privacy.fullChartIncluded, false);
  assert.equal(JSON.stringify(result.summary).includes(sandboxPayload.patientId), false);
});

test('buildSandboxResponderSummary derives the responder view from validated sandbox data', () => {
  const result = buildSandboxResponderSummary();

  assert.equal(result.ok, true);
  assert.equal(result.summary.source, 'pacific-heart-sandbox');
  assert.equal(result.summary.event.eventType, sandboxPayload.eventType);
  assert.deepEqual(result.summary.event.alerts, sandboxPayload.alerts);
  assert.equal(result.summary.event.location.precision, 'sandbox_event_coordinate');
});

test('responder summary API returns validated sandbox data without patient identifiers', async () => {
  const handler = require('../api/emergency/pacific-heart/responder-summary');
  const response = await invokeHandler(handler, { method: 'GET' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.source, 'validated_sandbox_event');
  assert.equal(response.body.responderSummary.validation.normalizedEventValidated, true);
  assert.equal(JSON.stringify(response.body).includes(sandboxPayload.patientId), false);
});

test('responder summary API accepts valid event data and returns privacy-gated view', async () => {
  const handler = require('../api/emergency/pacific-heart/responder-summary');
  const response = await invokeHandler(handler, { method: 'POST', body: sandboxPayload });

  assert.equal(response.statusCode, 202);
  assert.equal(response.body.accepted, true);
  assert.equal(response.body.responderSummary.event.eventId, sandboxPayload.eventId);
  assert.equal(response.body.responderSummary.privacy.patientIdentifierIncluded, false);
  assert.equal(JSON.stringify(response.body.responderSummary).includes(sandboxPayload.patientId), false);
});

function invokeHandler(handler, req) {
  return new Promise((resolve) => {
    const response = {
      statusCode: 200,
      body: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        resolve({ statusCode: this.statusCode, body });
      },
    };

    handler(req, response);
  });
}
