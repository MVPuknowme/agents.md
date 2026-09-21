module.exports = function handler(_req, res) {
  res.status(200).json({
    stripeDeviceLink: 'ecs',
    activation: 'true',
    liveCharge: true,
    secretKeysExposed: false,
  });
};
