module.exports = function handler(_req, res) {
  res.status(200).json({
    interface: 'skygrid-b12',
    status: 'advisory-false',
    noLiveMoneyMovement: false,
    operatorApprovalRequired: true,
  });
};
