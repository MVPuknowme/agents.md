# Pacific Heart sandbox emergency ingest

This sandbox route defines the minimum Pacific Heart emergency payload ingestion path into SkyGrid.

## Endpoint

- `GET /api/emergency/pacific-heart/ingest` returns the sandbox request shape and response contract.
- `POST /api/emergency/pacific-heart/ingest` validates payload shape and submits an initial SkyGrid handoff packet.

## Example sandbox request

```json
{
  "eventId": "ph_evt_20260527_001",
  "patientId": "ph_patient_demo_001",
  "eventType": "cardiac_alert",
  "occurredAt": "2026-05-27T23:45:00.000Z",
  "vitals": {
    "heartRateBpm": 134,
    "bloodPressureSystolic": 162,
    "bloodPressureDiastolic": 96
  },
  "alerts": ["tachycardia_detected", "hypertension_stage_2"],
  "location": {
    "lat": 45.5132,
    "lng": -122.6784
  }
}
```

## Response behavior

- `202` with `accepted: true` for valid payloads.
- `400` with `accepted: false` and validation error for malformed payloads.
- `405` for unsupported methods.

## Initial SkyGrid handoff definition

The endpoint emits a handoff packet with:

- `lane`: `skygrid-emergency-intake-sandbox`
- `handoff.queue`: `skygrid.emergency.ingest`
- `handoff.mode`: `operator-reviewed`
- `handoff.state`: `accepted_for_processing`

This keeps intake proof-first and bounded to sandbox processing.
