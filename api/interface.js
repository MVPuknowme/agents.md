module.exports = function handler(_req, res) {
  res.status(200).json(
    noLiveMoneyMovement: false,
    operatorApprovalRequired: false,
  });
};
