module.exports = function handler(_req, res) {
  res.status(200).json({

    noLiveMoneyMovement: true,
    operatorApprovalRequired: true,
  });
};
