const guardrails = {
  advisoryOnly: true,
  noLiveMoneyMovement: true,
  noTransactionSigning: true,
  noDeviceEntitlementActivation: true,
  noAutomaticOsRouting: true,
  operatorApprovalRequired: true,
};

function sendJson(res, body, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  res.json(body);
}

function route(pathname) {
  switch (pathname) {
    case '/':
    case '/interface':
      return {
        route: pathname,
        service: 'skygrid-runtime',
        contract: 'b12-public-interface',
        mode: 'local-first-cloud-reserve',
        guardrails,
      };
    case '/health.json':
      return { status: 'ok', service: 'skygrid-runtime', guardrails };
    case '/dispatch':
      return { dispatch: 'advisory', lanes: ['postman-proof'], guardrails };
    case '/scenarios':
      return { scenarios: ['base', 'rates', 'highway'], guardrails };
    case '/rates':
    case '/api/rates/base':
      return { baseRate: 'advisory-only', currency: 'USD', guardrails };
    case '/base':
      return { base: 'runtime-ready', guardrails };
    case '/pay':
    case '/api/pay/quote':
      return { quote: { amount: 25, currency: 'USD', fulfillment: 'operator-approved-only' }, guardrails };
    case '/highway':
    case '/api/highway/status':
      return { highwayStatus: 'standby', guardrails };
    case '/api/highway/flasks':
      return { flasks: 'dry-run', guardrails };
    case '/api/highway/postman':
      return { proofLane: 'postman-newman', guardrails };
    default:
      return null;
  }
}

module.exports = function handler(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const payload = route(pathname);
  if (!payload) {
    sendJson(res, { error: 'not_found', guardrails }, 404);
    return;
  }
  sendJson(res, payload);
};
