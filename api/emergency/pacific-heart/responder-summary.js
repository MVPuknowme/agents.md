const {
  validatePacificHeartPayload,
  buildSkyGridHandoff,
  buildResponderSummaryFromHandoff,
  buildSandboxResponderSummary,
} = require('../../../src/emergency/pacific-heart-ingest');

module.exports = function handler(req, res) {
  if (req.method === 'GET') {
    const result = buildSandboxResponderSummary();

    if (!result.ok) {
      res.status(500).json({ accepted: false, error: result.error });
      return;
    }

    res.status(200).json({
      endpoint: '/api/emergency/pacific-heart/responder-summary',
      mode: 'sandbox',
      source: 'validated_sandbox_event',
      responderSummary: result.summary,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const payload = req.body;
  const validation = validatePacificHeartPayload(payload);

  if (!validation.ok) {
    res.status(400).json({ accepted: false, error: validation.error });
    return;
  }

  const handoffPacket = buildSkyGridHandoff(payload);
  const result = buildResponderSummaryFromHandoff(handoffPacket);

  if (!result.ok) {
    res.status(400).json({ accepted: false, error: result.error });
    return;
  }

  res.status(202).json({
    accepted: true,
    intakeId: `intake_${payload.eventId}`,
    receivedAt: new Date().toISOString(),
    responderSummary: result.summary,
  });
};
