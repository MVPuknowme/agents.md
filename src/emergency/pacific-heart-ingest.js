const SANDBOX_SOURCE = 'pacific-heart-sandbox';
const SANDBOX_ENDPOINT = '/sandbox/pacific-heart/events';
const DASHBOARD_VIEW = 'dispatcher-sandbox-dashboard';
const RESPONDER_CHANNEL = 'responder-handoff-sandbox';

const REQUIRED_FIELDS = ['eventId', 'patientId', 'eventType', 'occurredAt', 'vitals'];
const REQUIRED_VITALS = ['heartRateBpm', 'bloodPressureSystolic', 'bloodPressureDiastolic'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return undefined;
}

function firstNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function normalizeIsoTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return undefined;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLocation(rawLocation = {}) {
  if (!isObject(rawLocation)) {
    return null;
  }

  const lat = firstNumber(rawLocation.lat, rawLocation.latitude);
  const lng = firstNumber(rawLocation.lng, rawLocation.lon, rawLocation.longitude);

  if (lat === undefined || lng === undefined) {
    return null;
  }

  return {
    lat,
    lng,
    label: firstString(rawLocation.label, rawLocation.address, rawLocation.scene) ?? 'sandbox-scene',
  };
}

function normalizeVitals(rawVitals = {}) {
  if (!isObject(rawVitals)) {
    return {};
  }

  const normalized = {
    heartRateBpm: firstNumber(rawVitals.heartRateBpm, rawVitals.heart_rate_bpm, rawVitals.hr),
    bloodPressureSystolic: firstNumber(
      rawVitals.bloodPressureSystolic,
      rawVitals.blood_pressure_systolic,
      rawVitals.bp_systolic,
    ),
    bloodPressureDiastolic: firstNumber(
      rawVitals.bloodPressureDiastolic,
      rawVitals.blood_pressure_diastolic,
      rawVitals.bp_diastolic,
    ),
  };

  const glucoseMgDl = firstNumber(rawVitals.glucoseMgDl, rawVitals.glucose_mg_dl, rawVitals.glucose);
  if (glucoseMgDl !== undefined) {
    normalized.glucoseMgDl = glucoseMgDl;
  }

  const oxygenSaturationPct = firstNumber(
    rawVitals.oxygenSaturationPct,
    rawVitals.oxygen_saturation_pct,
    rawVitals.spo2,
  );
  if (oxygenSaturationPct !== undefined) {
    normalized.oxygenSaturationPct = oxygenSaturationPct;
  }

  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
}

function normalizeMedicalContext(rawContext = {}) {
  if (!isObject(rawContext)) {
    return {
      conditions: [],
      medications: [],
      allergies: [],
    };
  }

  return {
    conditions: normalizeStringArray(rawContext.conditions),
    medications: normalizeStringArray(rawContext.medications),
    allergies: normalizeStringArray(rawContext.allergies),
  };
}

function normalizePacificHeartEvent(payload) {
  if (!isObject(payload)) {
    return { ok: false, error: 'payload_must_be_object' };
  }

  const event = isObject(payload.event) ? payload.event : payload;
  const patient = isObject(payload.patient) ? payload.patient : {};
  const medical = isObject(payload.medical) ? payload.medical : payload.medicalContext;

  const occurredAt = normalizeIsoTimestamp(
    event.occurredAt ?? event.occurred_at ?? event.timestamp ?? payload.receivedAt,
  );

  const normalized = {
    eventId: firstString(event.eventId, event.event_id, event.id),
    patientId: firstString(event.patientId, event.patient_id, patient.patientId, patient.id),
    eventType: firstString(event.eventType, event.event_type, event.type),
    occurredAt,
    vitals: normalizeVitals(event.vitals ?? payload.vitals),
    alerts: normalizeStringArray(event.alerts ?? payload.alerts),
    location: normalizeLocation(event.location ?? payload.location),
    consent: {
      mode: firstString(payload.consent?.mode, event.consent?.mode) ?? 'emergency-sandbox',
      operatorReviewRequired: true,
      phiBoundary: 'minimum-necessary-demo-context',
    },
    medicalContext: normalizeMedicalContext(medical),
  };

  return { ok: true, event: normalized };
}

function validatePacificHeartPayload(payload) {
  const normalization = normalizePacificHeartEvent(payload);
  if (!normalization.ok) {
    return normalization;
  }

  const normalized = normalization.event;

  for (const field of REQUIRED_FIELDS) {
    if (!(field in normalized)) {
      return { ok: false, error: `missing_field:${field}` };
    }
  }

  if (typeof normalized.eventId !== 'string' || normalized.eventId.trim() === '') {
    return { ok: false, error: 'invalid_eventId' };
  }

  if (typeof normalized.patientId !== 'string' || normalized.patientId.trim() === '') {
    return { ok: false, error: 'invalid_patientId' };
  }

  if (typeof normalized.eventType !== 'string' || normalized.eventType.trim() === '') {
    return { ok: false, error: 'invalid_eventType' };
  }

  if (Number.isNaN(Date.parse(normalized.occurredAt))) {
    return { ok: false, error: 'invalid_occurredAt' };
  }

  if (!isObject(normalized.vitals)) {
    return { ok: false, error: 'invalid_vitals' };
  }

  for (const vital of REQUIRED_VITALS) {
    if (typeof normalized.vitals[vital] !== 'number') {
      return { ok: false, error: `invalid_vital:${vital}` };
    }
  }

  return { ok: true, event: normalized };
}

function buildDashboardResult(normalizedEvent) {
  const alertSet = new Set(normalizedEvent.alerts);
  const heartRate = normalizedEvent.vitals.heartRateBpm;
  const glucose = normalizedEvent.vitals.glucoseMgDl;

  const priority =
    heartRate >= 130 ||
    glucose < 70 ||
    glucose > 250 ||
    alertSet.has('cardiac_alert') ||
    alertSet.has('diabetic_crisis') ||
    normalizedEvent.eventType.includes('cardiac')
      ? 'high'
      : 'routine';

  return {
    view: DASHBOARD_VIEW,
    status: 'visible_for_dispatch_review',
    priority,
    headline: `${normalizedEvent.eventType} for ${normalizedEvent.patientId}`,
    displayedPanels: ['event-summary', 'vitals', 'alerts', 'minimum-medical-context', 'responder-handoff'],
    safetyBoundary: 'operator-reviewed sandbox; no automatic dispatch authority',
  };
}

function buildResponderHandoff(normalizedEvent, dashboardResult) {
  return {
    channel: RESPONDER_CHANNEL,
    status: 'ready_for_operator_review',
    summary: {
      eventId: normalizedEvent.eventId,
      eventType: normalizedEvent.eventType,
      priority: dashboardResult.priority,
      vitals: normalizedEvent.vitals,
      alerts: normalizedEvent.alerts,
      allergies: normalizedEvent.medicalContext.allergies,
      medications: normalizedEvent.medicalContext.medications,
    },
    instructions: [
      'Use for supervised sandbox validation only.',
      'Confirm patient identity and consent boundary through approved emergency protocol.',
      'Do not treat advisory context as autonomous medical direction.',
    ],
  };
}

function buildSkyGridHandoff(payload) {
  const validation = validatePacificHeartPayload(payload);

  if (!validation.ok) {
    return validation;
  }

  return {
    lane: 'skygrid-emergency-intake-sandbox',
    source: SANDBOX_SOURCE,
    handoff: {
      queue: 'skygrid.emergency.ingest',
      mode: 'operator-reviewed',
      state: 'accepted_for_processing',
    },
    event: validation.event,
  };
}

function runPacificHeartSandboxFlow(payload, options = {}) {
  const observedAt = normalizeIsoTimestamp(options.observedAt) ?? new Date().toISOString();
  const endpoint = options.endpoint ?? SANDBOX_ENDPOINT;
  const validation = validatePacificHeartPayload(payload);

  if (!validation.ok) {
    return {
      ok: false,
      endpoint,
      statusCode: 400,
      observedAt,
      error: validation.error,
      evidence: {
        timestamp: observedAt,
        endpoint,
        statusCode: 400,
        dashboardResult: 'not_rendered_validation_failed',
      },
    };
  }

  const handoff = buildSkyGridHandoff(validation.event);
  const dashboardResult = buildDashboardResult(validation.event);
  const responderHandoff = buildResponderHandoff(validation.event, dashboardResult);

  return {
    ok: true,
    endpoint,
    statusCode: 202,
    observedAt,
    ingestion: handoff,
    dashboardResult,
    responderHandoff,
    evidence: {
      timestamp: observedAt,
      endpoint,
      statusCode: 202,
      dashboardResult: dashboardResult.status,
      responderHandoff: responderHandoff.status,
      eventId: validation.event.eventId,
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
    glucoseMgDl: 118,
  },
  alerts: ['tachycardia_detected', 'hypertension_stage_2'],
  location: {
    lat: 45.5132,
    lng: -122.6784,
    label: 'sandbox-scene',
  },
  medicalContext: {
    conditions: ['hypertension'],
    medications: ['demo-medication-record'],
    allergies: ['demo-allergy-record'],
  },
};

module.exports = {
  SANDBOX_ENDPOINT,
  SANDBOX_SOURCE,
  DASHBOARD_VIEW,
  RESPONDER_CHANNEL,
  sandboxPayload,
  normalizePacificHeartEvent,
  validatePacificHeartPayload,
  buildDashboardResult,
  buildResponderHandoff,
  buildSkyGridHandoff,
  runPacificHeartSandboxFlow,
};
