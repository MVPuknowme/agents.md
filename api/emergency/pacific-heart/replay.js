const {
  buildIncidentReplayEvidence,
  buildSandboxAuditTrail,
  sandboxPayload,
} = require('../../../src/emergency/pacific-heart-ingest');

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const payload = req.method === 'POST' ? req.body : sandboxPayload;
  const auditTrail = buildSandboxAuditTrail(payload);

  res.status(200).json({
    mode: 'sandbox-replay',
    replayEvidence: buildIncidentReplayEvidence(payload, { auditTrail }),
    auditTrail,
  });
};
