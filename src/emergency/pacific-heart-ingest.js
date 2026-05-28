const SANDBOX_SOURCE = 'pacific-heart-sandbox';

const REQUIRED_FIELDS = ['eventId', 'patientId', 'eventType', 'occurredAt', 'vitals'];
const REQUIRED_VITALS = ['heartRateBpm', 'bloodPressureSystolic', 'bloodPressureDiastolic'];

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
  sandboxPayload,
  validatePacificHeartPayload,
  buildSkyGridHandoff,
};
