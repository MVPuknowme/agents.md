const {
  sandboxPayload,
  validatePacificHeartPayload,
  buildIncidentReplayEvidence,
  buildSandboxAuditTrail,
  buildSkyGridHandoff,
} = require('../../../src/emergency/pacific-heart-ingest');

module.exports = function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      endpoint: '/api/emergency/pacific-heart/ingest',
      mode: 'sandbox',
      expectedRequestShape: sandboxPayload,
      response: {
        accepted: true,
        intakeId: 'string',
        handoff: 'skygrid.emergency.ingest',
        auditTrail: 'redacted stage events',
        replayEvidence: 'sandbox replay sequence',
      },
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
    const auditTrail = buildSandboxAuditTrail(payload);

    res.status(400).json({
      accepted: false,
      error: validation.error,
      auditTrail,
      replayEvidence: buildIncidentReplayEvidence(payload, { auditTrail }),
    });
    return;
  }

  const handoffPacket = buildSkyGridHandoff(payload);
  const auditTrail = buildSandboxAuditTrail(payload);

  res.status(202).json({
    accepted: true,
    intakeId: `intake_${payload.eventId}`,
    receivedAt: new Date().toISOString(),
    handoff: handoffPacket,
    auditTrail,
    replayEvidence: buildIncidentReplayEvidence(payload, { auditTrail }),
  });
};
