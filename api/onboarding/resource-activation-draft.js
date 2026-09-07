const {
  SUPPORTED_ACTIVATION_TYPES,
  createResourceActivationDraft,
  normalizeResourceActivationDraftInput,
} = require('../../src/aps/resource-activation-draft.js');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'POST');
    }
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const body = req.body || {};
  const validation = validateRequest(body);
  if (!validation.ok) {
    res.status(400).json({
      error: 'invalid_request',
      required: ['onboarderId', 'activationType'],
      activationTypes: validation.activationTypes,
    });
    return;
  }

  const draft = createResourceActivationDraft(validation.input);
  res.status(200).json(draft);
};

function validateRequest(body) {
  try {
    return {
      ok: true,
      input: normalizeResourceActivationDraftInput(body),
    };
  } catch (_error) {
    return {
      ok: false,
      activationTypes: SUPPORTED_ACTIVATION_TYPES,
    };
  }
}
