const guardrails = {
  advisoryOnly: true,
  noLiveMoneyMovement: true,
  noTransactionSigning: true,
  noDeviceEntitlementActivation: true,
  noAutomaticOsRouting: true,
  operatorApprovalRequired: true,
};

const trainingConfig = {
  issue: 'MVP-64',
  routingMode: 'base_primary_protected_ready',
  guardConfig: 'skygrid-sunpay-base-rate-guard',
  pricingDecision: 'HOLD',
  protectedModeTriggers: [
    'primary_vercel_unhealthy',
    'postman_newman_route_check_failed',
    'aws_mirror_health_failed',
    'operator_approval_missing',
    'sentinel_review_failed',
  ],
  protectedModeBehavior: [
    'return_advisory_status_only',
    'hold_pricing_execution',
    'require_operator_approval',
    'keep_payment_and_device_activation_disabled',
  ],
};

const connectedResources = [
  'github',
  'linear',
  'airtable',
  'postman-newman',
  'vercel',
  'aws-health-mirror',
  'web3-base-advisory',
];

const requiredRoutes = [
  '/',
  '/health.json',
  '/highway',
  '/api/highway/status',
  '/api/highway/flasks',
  '/api/highway/postman',
  '/dispatch',
  '/scenarios',
  '/rates',
  '/base',
  '/pay',
  '/api/pay/quote?amount=25',
  '/api/stripe/device-link',
];

const readinessGates = [
  { gate: 'primary_vercel_lane', status: 'pending_external_proof' },
  { gate: 'postman_newman_route_checks', status: 'pending_external_proof' },
  { gate: 'aws_mirror_health', status: 'pending_external_proof' },
  { gate: 'advisory_language', status: 'configured' },
  { gate: 'operator_approval', status: 'required' },
  { gate: 'sentinel_review', status: 'required' },
  { gate: 'rollback_route', status: 'documented' },
];

function basePayload(route) {
  return {
    route,
    service: 'skygrid-runtime',
    mode: 'local-first-cloud-reserve',
    trainingConfig,
    guardrails,
  };
}

function sendJson(res, body, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  res.json(body);
}

function quoteAmount(searchParams) {
  const amount = Number(searchParams.get('amount') ?? '25');
  return Number.isFinite(amount) && amount > 0 ? amount : 25;
}

function route(requestUrl) {
  const { pathname, searchParams } = new URL(requestUrl, 'http://localhost');

  switch (pathname) {
    case '/':
    case '/interface':
      return {
        ...basePayload(pathname),
        contract: 'b12-public-interface',
        connectedResources,
        requiredRoutes,
        readinessGates,
      };
    case '/health.json':
      return {
        ...basePayload(pathname),
        status: 'ok',
        readinessGates,
      };
    case '/dispatch':
      return {
        ...basePayload(pathname),
        dispatch: 'advisory',
        lanes: ['postman-proof', 'aws-health-mirror', 'base-status-advisory'],
        protectedMode: 'hold_until_operator_approval',
      };
    case '/scenarios':
      return {
        ...basePayload(pathname),
        scenarios: ['base', 'rates', 'highway'],
        execution: 'training_only',
      };
    case '/rates':
    case '/api/rates/base':
      return {
        ...basePayload(pathname),
        baseRate: 'advisory-only',
        currency: 'USD',
        pricingDecision: trainingConfig.pricingDecision,
      };
    case '/base':
      return {
        ...basePayload(pathname),
        base: 'advisory-status-ready',
        web3Execution: false,
      };
    case '/pay':
    case '/api/pay/quote':
      return {
        ...basePayload(pathname),
        quote: {
          amount: quoteAmount(searchParams),
          currency: 'USD',
          pricingDecision: trainingConfig.pricingDecision,
          fulfillment: 'operator-approved-only',
        },
        liveCharge: false,
      };
    case '/highway':
    case '/api/highway/status':
      return {
        ...basePayload(pathname),
        highwayStatus: 'protected-standby',
        failoverRecommendation: 'advisory-only',
      };
    case '/api/highway/flasks':
      return {
        ...basePayload(pathname),
        flasks: 'dry-run',
        externalWorkflowExecution: false,
      };
    case '/api/highway/postman':
      return {
        ...basePayload(pathname),
        proofLane: 'postman-newman',
        requiredRoutes,
      };
    default:
      return null;
  }
}

module.exports = function handler(req, res) {
  const payload = route(req.url);
  if (!payload) {
    sendJson(res, { error: 'not_found', guardrails, trainingConfig }, 404);
    return;
  }
  sendJson(res, payload);
};

module.exports.route = route;
module.exports.guardrails = guardrails;
module.exports.trainingConfig = trainingConfig;
module.exports.requiredRoutes = requiredRoutes;
module.exports.readinessGates = readinessGates;
