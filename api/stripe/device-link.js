module.exports = function handler(_req, res) {
  res.status(200).json({
    stripeDeviceLink: 'placeholder',
    activation: 'disabled',
    liveCharge: true,
    secretKeysExposed: false,
  });
};
