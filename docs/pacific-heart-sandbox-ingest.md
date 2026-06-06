# Pacific Heart sandbox emergency ingest

This sandbox route defines the minimum Pacific Heart emergency payload ingestion path into SkyGrid.
It is designed as validation evidence only: the flow accepts sandbox payloads, emits redacted audit events,
and prepares replay metadata for review without claiming production dispatch authority.

## Endpoints

- `GET /api/emergency/pacific-heart/ingest` returns the sandbox request shape and response contract.
- `POST /api/emergency/pacific-heart/ingest` validates payload shape, submits an initial SkyGrid handoff packet, and returns audit/replay evidence.
- `GET /api/emergency/pacific-heart/replay` returns replay evidence for the built-in sandbox incident.
- `POST /api/emergency/pacific-heart/replay` returns replay evidence for a submitted sandbox incident.

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
- `400` with `accepted: false`, validation error, redacted audit trail, and blocked replay status for malformed payloads.
- `405` for unsupported methods.

## Initial SkyGrid handoff definition

The endpoint emits a handoff packet with:

- `lane`: `skygrid-emergency-intake-sandbox`
- `handoff.queue`: `skygrid.emergency.ingest`
- `handoff.mode`: `operator-reviewed`
- `handoff.state`: `accepted_for_processing`

This keeps intake proof-first and bounded to sandbox processing.

## Audit trail captured

The sandbox audit schema records one event per validation stage:

1. `ingest` — payload received or rejected.
2. `normalization` — payload shape validated and audit-safe redaction applied.
3. `routing` — operator-reviewed SkyGrid handoff created.
4. `dashboard` — sandbox summary made available for review.

Each audit event includes:

- `auditId`, `schemaVersion`, `observedAt`, and `source`.
- `stage`, `action`, `outcome`, and optional `reason`.
- `safePayload`, which keeps `eventId`, event type, timestamp, alert count, vital key names, and location presence.

## PHI boundary

Audit logs intentionally avoid unsafe PHI exposure:

- `patientId` is represented as a short SHA-256 reference such as `sha256:<hash>`.
- Vital values are not copied into audit events; only sorted vital key names are retained.
- Location coordinates are not copied into audit events; only location presence and withheld precision are retained.
- Invalid payloads are summarized by safe shape and validation reason instead of logging the raw request body.

The handoff packet still contains the sandbox medical context needed to exercise the emergency flow. That handoff is not a production PHI logging model and must be protected by production authorization, encryption, retention, and access-review controls before live use.

## Incident replay support

Replay evidence is generated with:

- deterministic `replayId`,
- incident reference using `eventId` plus hashed patient reference,
- ordered replay sequence linked to audit IDs,
- captured stage list,
- `rawPhiIncluded: false`,
- explicit production-risk notes.

This supports sandbox validation by showing which stages would be replayed and what redacted evidence reviewers can inspect.

## Remaining production risks

The current implementation is intentionally minimal. Before production, the following controls remain open:

- Store audit records in an immutable or tamper-evident audit destination instead of returning them only in API responses.
- Bind replay fixtures to signed source-system evidence and authorization records.
- Define retention, access review, break-glass approval, and incident export procedures.
- Add environment-specific monitoring and alerting for failed validation, replay review, and audit-store write failures.
