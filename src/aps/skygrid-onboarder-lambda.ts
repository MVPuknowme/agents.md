export type OnboardingStatus = "draft" | "submitted" | "screening" | "proof_pending" | "active_node" | "rejected";

export interface OnboarderRecord {
  onboarderId: string;
  name: string;
  type: string;
  networkInterest: string;
  onboardingStatus: OnboardingStatus;
  rateBand: string;
  payoutPreference: string;
  proofRequired: boolean;
  preflightId?: string;
  linearIssue?: string;
  settlementRef?: string;
  evidenceUrls: string[];
  operatorNotes?: string;
  createdAt: string;
  updatedAt: string;
  contactHistory: string[];
}

interface ApiResult {
  statusCode: number;
  headers: { "Content-Type": string };
  body: string;
}

export interface SkyGridStore {
  put(record: OnboarderRecord): Promise<void>;
  getById(onboarderId: string): Promise<OnboarderRecord | null>;
  queryByStatus(status: OnboardingStatus): Promise<OnboarderRecord[]>;
  updateStatus(onboarderId: string, onboardingStatus: OnboardingStatus, updatedAt: string): Promise<OnboarderRecord | null>;
}

export interface LambdaEvent {
  action?: "create" | "update_status" | "get_by_status" | "validate_proof";
  payload?: Record<string, unknown>;
}

const statusOrder: OnboardingStatus[] = ["draft", "submitted", "screening", "proof_pending", "active_node", "rejected"];

function json(statusCode: number, payload: Record<string, unknown>): ApiResult {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

function hasProof(record: Pick<OnboarderRecord, "preflightId" | "evidenceUrls" | "proofRequired">): boolean {
  if (!record.proofRequired) return true;
  return Boolean(record.preflightId?.trim()) || record.evidenceUrls.length > 0;
}

function canMoveForward(current: OnboardingStatus, next: OnboardingStatus): boolean {
  return statusOrder.indexOf(next) >= statusOrder.indexOf(current);
}

function maskRef(value?: string): string | undefined {
  if (!value) return value;
  if (value.length <= 4) return "****";
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

function sanitizeCreatePayload(payload: Record<string, unknown>, nowIso: string): OnboarderRecord {
  const evidenceUrls = Array.isArray(payload.evidenceUrls) ? payload.evidenceUrls.filter((x): x is string => typeof x === "string") : [];
  const contactHistory = Array.isArray(payload.contactHistory) ? payload.contactHistory.filter((x): x is string => typeof x === "string") : [];

  return {
    onboarderId: String(payload.onboarderId ?? ""),
    name: String(payload.name ?? ""),
    type: String(payload.type ?? ""),
    networkInterest: String(payload.networkInterest ?? ""),
    onboardingStatus: (payload.onboardingStatus as OnboardingStatus) ?? "draft",
    rateBand: String(payload.rateBand ?? ""),
    payoutPreference: String(payload.payoutPreference ?? ""),
    proofRequired: Boolean(payload.proofRequired),
    preflightId: maskRef(typeof payload.preflightId === "string" ? payload.preflightId : undefined),
    linearIssue: typeof payload.linearIssue === "string" ? payload.linearIssue : undefined,
    settlementRef: maskRef(typeof payload.settlementRef === "string" ? payload.settlementRef : undefined),
    evidenceUrls,
    operatorNotes: typeof payload.operatorNotes === "string" ? payload.operatorNotes : undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
    contactHistory,
  };
}

export function createSkyGridOnboarderHandler(store: SkyGridStore) {
  return async function handler(event: LambdaEvent): Promise<ApiResult> {
    const action = event.action;
    const payload = event.payload ?? {};
    const nowIso = new Date().toISOString();

    try {
      if (!action) return json(400, { ok: false, error: "action_required" });

      if (action === "create") {
        const record = sanitizeCreatePayload(payload, nowIso);
        if (!record.onboarderId || !record.name) return json(400, { ok: false, error: "missing_required_fields" });
        await store.put(record);
        return json(201, { ok: true, record });
      }

      if (action === "update_status") {
        const onboarderId = String(payload.onboarderId ?? "");
        const nextStatus = payload.onboardingStatus as OnboardingStatus;
        if (!onboarderId || !nextStatus) return json(400, { ok: false, error: "missing_required_fields" });

        const current = await store.getById(onboarderId);
        if (!current) return json(404, { ok: false, error: "onboarder_not_found" });
        if (!canMoveForward(current.onboardingStatus, nextStatus)) {
          return json(409, { ok: false, error: "status_transition_not_allowed", currentStatus: current.onboardingStatus, requestedStatus: nextStatus });
        }
        const preview = { ...current, onboardingStatus: nextStatus };
        if (nextStatus === "active_node" && !hasProof(preview)) {
          return json(409, { ok: false, error: "proof_missing", onboarderId, required: "preflightId_or_evidenceUrls" });
        }
        const updated = await store.updateStatus(onboarderId, nextStatus, nowIso);
        return json(200, { ok: true, record: updated });
      }

      if (action === "get_by_status") {
        const status = payload.onboardingStatus as OnboardingStatus;
        if (!status) return json(400, { ok: false, error: "onboarding_status_required" });
        const records = await store.queryByStatus(status);
        return json(200, { ok: true, records, count: records.length });
      }

      if (action === "validate_proof") {
        const onboarderId = String(payload.onboarderId ?? "");
        if (!onboarderId) return json(400, { ok: false, error: "onboarder_id_required" });
        const record = await store.getById(onboarderId);
        if (!record) return json(404, { ok: false, error: "onboarder_not_found" });
        return json(200, { ok: true, onboarderId, proofStatus: hasProof(record) ? "proof_ready" : "proof_missing" });
      }

      return json(400, { ok: false, error: "unsupported_action", action });
    } catch (error) {
      return json(500, { ok: false, error: "internal_error", message: error instanceof Error ? error.message : "unknown_error" });
    }
  };
}
