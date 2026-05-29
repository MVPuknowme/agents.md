const SANDBOX_SOURCE = 'pacific-heart-sandbox';

const REQUIRED_FIELDS = ['eventId', 'patientId', 'eventType', 'occurredAt', 'vitals'];
const REQUIRED_VITALS = ['heartRateBpm', 'bloodPressureSystolic', 'bloodPressureDiastolic'];
const RESPONDER_ALLOWED_FIELDS = [
  'eventId',
  'eventType',
  'occurredAt',
  'alerts',
  'vitals.heartRateBpm',
  'vitals.bloodPressureSystolic',
  'vitals.bloodPressureDiastolic',
  'location.lat',
  'location.lng',
];
const RESPONDER_REDACTED_FIELDS = [
  'patientId',
  'fullName',
  'dateOfBirth',
  'phone',
  'address',
  'insurance',
  'fullMedicalRecord',
];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

function buildSkyGridHandoff(payload) {
  return {
    lane: 'skygrid-emergency-intake-sandbox',
    source: SANDBOX_SOURCE,
    handoff: {
      queue: 'skygrid.emergency.ingest',
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

function classifyResponderPriority(event) {
  const alerts = Array.isArray(event.alerts) ? event.alerts : [];
  const vitals = event.vitals ?? {};

  if (
    alerts.includes('cardiac_arrest') ||
    alerts.includes('overdose_suspected') ||
    vitals.heartRateBpm >= 130 ||
    vitals.bloodPressureSystolic >= 180
  ) {
    return 'high_pre_arrival_attention';
  }

  if (
    alerts.length > 0 ||
    vitals.heartRateBpm >= 110 ||
    vitals.bloodPressureSystolic >= 140
  ) {
    return 'elevated_monitoring';
  }

  return 'routine_monitoring';
}

function buildResponderNotes(event) {
  const notes = [];
  const vitals = event.vitals ?? {};
  const alerts = Array.isArray(event.alerts) ? event.alerts : [];

  if (alerts.length > 0) {
    notes.push(`Sandbox alerts: ${alerts.join(', ')}`);
  }

  if (vitals.heartRateBpm >= 130) {
    notes.push('Heart rate is above sandbox tachycardia threshold; prepare cardiac assessment on arrival.');
  }

  if (vitals.bloodPressureSystolic >= 160 || vitals.bloodPressureDiastolic >= 90) {
    notes.push('Blood pressure is elevated in the sandbox event; confirm with field measurement.');
  }

  if (notes.length === 0) {
    notes.push('No sandbox alerts crossed responder pre-arrival thresholds.');
  }

  notes.push('Use as pre-arrival context only; responder assessment and medical direction remain authoritative.');

  return notes;
}

function normalizeResponderLocation(location) {
  if (!isObject(location)) {
    return null;
  }

  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return null;
  }

  return {
    lat: location.lat,
    lng: location.lng,
    precision: 'sandbox_event_coordinate',
  };
}

function buildResponderSummaryFromHandoff(handoffPacket) {
  if (!isObject(handoffPacket) || handoffPacket.source !== SANDBOX_SOURCE || !isObject(handoffPacket.event)) {
    return { ok: false, error: 'invalid_handoff_packet' };
  }

  const event = handoffPacket.event;
  const validation = validatePacificHeartPayload({
    eventId: event.eventId,
    patientId: event.patientId,
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    vitals: event.vitals,
    alerts: event.alerts,
    location: event.location,
  });

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return {
    ok: true,
    summary: {
      view: 'responder-pre-arrival-summary',
      mode: 'sandbox',
      source: SANDBOX_SOURCE,
      validation: {
        sourceValidated: true,
        normalizedEventValidated: true,
        privacyGate: 'responder_minimum_pre_arrival_context',
        allowedFields: RESPONDER_ALLOWED_FIELDS,
        redactedFields: RESPONDER_REDACTED_FIELDS,
      },
      event: {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        priority: classifyResponderPriority(event),
        alerts: Array.isArray(event.alerts) ? event.alerts : [],
        vitals: {
          heartRateBpm: event.vitals.heartRateBpm,
          bloodPressureSystolic: event.vitals.bloodPressureSystolic,
          bloodPressureDiastolic: event.vitals.bloodPressureDiastolic,
        },
        location: normalizeResponderLocation(event.location),
        preArrivalNotes: buildResponderNotes(event),
      },
      privacy: {
        patientIdentifierIncluded: false,
        fullChartIncluded: false,
        treatmentProtocolIncluded: false,
        operatorReviewRequired: true,
        boundary: 'No direct identifiers, contact details, insurance data, full chart, or autonomous treatment instructions are exposed in this responder sandbox summary.',
      },
    },
  };
}

function buildSandboxResponderSummary() {
  return buildResponderSummaryFromHandoff(buildSkyGridHandoff(sandboxPayload));
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
  SANDBOX_SOURCE,
  RESPONDER_ALLOWED_FIELDS,
  RESPONDER_REDACTED_FIELDS,
  sandboxPayload,
  validatePacificHeartPayload,
  buildSkyGridHandoff,
  buildResponderSummaryFromHandoff,
  buildSandboxResponderSummary,
};
