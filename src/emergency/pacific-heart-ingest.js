const crypto = require('node:crypto');

const SANDBOX_SOURCE = 'pacific-heart-sandbox';
const SANDBOX_LANE = 'skygrid-emergency-intake-sandbox';
const SANDBOX_QUEUE = 'skygrid.emergency.ingest';
const AUDIT_SCHEMA_VERSION = 'pacific-heart-audit-v1';

const REQUIRED_FIELDS = ['eventId', 'patientId', 'eventType', 'occurredAt', 'vitals'];
const REQUIRED_VITALS = ['heartRateBpm', 'bloodPressureSystolic', 'bloodPressureDiastolic'];

const PRODUCTION_AUDIT_RISKS = [
  'sandbox_audit_events_are_returned_with_the_response_not_written_to_an_immutable_store',
  'replay_fixtures_are_synthetic_and_do_not_replace_signed_source_system_evidence',
  'retention_access_review_and_break_glass_approval_workflows_remain_production_controls',
];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function auditHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function validatePacificHeartPayload(payload) {
  if (!isObject(payload)) {
    return { ok: false, error: 'payload_must_be_object' };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in payload)) {
      return { ok: false, error: `missing_field:${field}` };
    }
  }

  if (typeof payload.eventId !== 'string' || payload.eventId.trim() === '') {
    return { ok: false, error: 'invalid_eventId' };
  }

  if (typeof payload.patientId !== 'string' || payload.patientId.trim() === '') {
    return { ok: false, error: 'invalid_patientId' };
  }

  if (typeof payload.eventType !== 'string' || payload.eventType.trim() === '') {
    return { ok: false, error: 'invalid_eventType' };
  }

  if (Number.isNaN(Date.parse(payload.occurredAt))) {
    return { ok: false, error: 'invalid_occurredAt' };
  }

  if (!isObject(payload.vitals)) {
    return { ok: false, error: 'invalid_vitals' };
  }

  for (const vital of REQUIRED_VITALS) {
    if (typeof payload.vitals[vital] !== 'number') {
      return { ok: false, error: `invalid_vital:${vital}` };
    }
  }

  return { ok: true };
}

function summarizeLocation(location) {
  if (!isObject(location)) {
    return { present: false, precision: 'none' };
  }

  return {
    present: true,
    precision: 'withheld_from_audit_log',
  };
}

function redactPacificHeartForAudit(payload) {
  if (!isObject(payload)) {
    return {
      payloadShape: Array.isArray(payload) ? 'array' : typeof payload,
      phiBoundary: 'raw_payload_not_logged',
    };
  }

  return {
    eventId: typeof payload.eventId === 'string' ? payload.eventId : null,
    patientRef:
      typeof payload.patientId === 'string' && payload.patientId.trim() !== ''
        ? `sha256:${auditHash(payload.patientId)}`
        : null,
    eventType: typeof payload.eventType === 'string' ? payload.eventType : null,
    occurredAt: typeof payload.occurredAt === 'string' ? payload.occurredAt : null,
    vitalKeys: isObject(payload.vitals) ? Object.keys(payload.vitals).sort() : [],
    alertCount: Array.isArray(payload.alerts) ? payload.alerts.length : 0,
    location: summarizeLocation(payload.location),
    phiBoundary: 'patient_identifier_hashed_vital_values_and_coordinates_withheld',
  };
}

function buildAuditEvent({ stage, action, payload, outcome = 'success', reason, observedAt }) {
  const safePayload = redactPacificHeartForAudit(payload);
  const auditSeed = [AUDIT_SCHEMA_VERSION, stage, action, safePayload.eventId, outcome, reason].join(':');

  return {
    auditId: `audit_${auditHash(auditSeed)}`,
    schemaVersion: AUDIT_SCHEMA_VERSION,
    observedAt: observedAt ?? new Date().toISOString(),
    source: SANDBOX_SOURCE,
    stage,
    action,
    outcome,
    reason: reason ?? null,
    safePayload,
  };
}

function buildSandboxAuditTrail(payload, options = {}) {
  const observedAt = options.observedAt;
  const validation = validatePacificHeartPayload(payload);

  if (!validation.ok) {
    return [
      buildAuditEvent({
        stage: 'ingest',
        action: 'payload_rejected',
        payload,
        outcome: 'rejected',
        reason: validation.error,
        observedAt,
      }),
    ];
  }

  return [
    buildAuditEvent({
      stage: 'ingest',
      action: 'payload_received',
      payload,
      observedAt,
    }),
    buildAuditEvent({
      stage: 'normalization',
      action: 'payload_validated_and_redacted_for_audit',
      payload,
      observedAt,
    }),
    buildAuditEvent({
      stage: 'routing',
      action: 'operator_review_handoff_created',
      payload,
      observedAt,
    }),
    buildAuditEvent({
      stage: 'dashboard',
      action: 'sandbox_summary_available_for_review',
      payload,
      observedAt,
    }),
  ];
}

function buildSkyGridHandoff(payload) {
  return {
    lane: SANDBOX_LANE,
    source: SANDBOX_SOURCE,
    handoff: {
      queue: SANDBOX_QUEUE,
      mode: 'operator-reviewed',
      state: 'accepted_for_processing',
    },
    event: {
      eventId: payload.eventId,
      patientId: payload.patientId,
      eventType: payload.eventType,
      occurredAt: payload.occurredAt,
      vitals: payload.vitals,
      alerts: Array.isArray(payload.alerts) ? payload.alerts : [],
      location: payload.location ?? null,
    },
  };
}

function buildIncidentReplayEvidence(payload, options = {}) {
  const auditTrail = options.auditTrail ?? buildSandboxAuditTrail(payload, options);
  const validation = validatePacificHeartPayload(payload);
  const safePayload = redactPacificHeartForAudit(payload);

  return {
    replayId: `replay_${auditHash(`${safePayload.eventId}:${safePayload.patientRef}:${AUDIT_SCHEMA_VERSION}`)}`,
    schemaVersion: AUDIT_SCHEMA_VERSION,
    source: SANDBOX_SOURCE,
    lane: SANDBOX_LANE,
    status: validation.ok ? 'ready_for_sandbox_replay' : 'blocked_by_validation',
    incidentRef: {
      eventId: safePayload.eventId,
      patientRef: safePayload.patientRef,
    },
    replaySequence: auditTrail.map((event, index) => ({
      order: index + 1,
      auditId: event.auditId,
      stage: event.stage,
      action: event.action,
      outcome: event.outcome,
    })),
    evidenceReview: {
      capturedStages: auditTrail.map((event) => event.stage),
      phiBoundary: safePayload.phiBoundary,
      rawPhiIncluded: false,
      productionRisks: PRODUCTION_AUDIT_RISKS,
    },
  };
}

const sandboxPayload = {
  eventId: 'ph_evt_20260527_001',
  patientId: 'ph_patient_demo_001',
  eventType: 'cardiac_alert',
  occurredAt: '2026-05-27T23:45:00.000Z',
  vitals: {
    heartRateBpm: 134,
    bloodPressureSystolic: 162,
    bloodPressureDiastolic: 96,
  },
  alerts: ['tachycardia_detected', 'hypertension_stage_2'],
  location: {
    lat: 45.5132,
    lng: -122.6784,
  },
};

module.exports = {
  AUDIT_SCHEMA_VERSION,
  PRODUCTION_AUDIT_RISKS,
  SANDBOX_SOURCE,
  sandboxPayload,
  auditHash,
  redactPacificHeartForAudit,
  validatePacificHeartPayload,
  buildAuditEvent,
  buildSandboxAuditTrail,
  buildSkyGridHandoff,
  buildIncidentReplayEvidence,
};
