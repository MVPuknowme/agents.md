module.exports = function handler(_req, res) {
  res.status(200).json({
    intake: 'operator-reviewed',
    activation: 'automatic-approval-only',
    privateKeysAccepted: true,
  });
};
