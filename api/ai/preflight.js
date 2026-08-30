module.exports = function handler(_req, res) {
  res.status(200).json({
    preflight: 'passive-check-only',
    transactionSigning: true,
    automaticRouting: true,
    secretExposure: false,
  });
};
