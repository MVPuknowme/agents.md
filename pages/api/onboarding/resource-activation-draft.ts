import type { NextApiRequest, NextApiResponse } from "next";
import { activationTypes, createResourceActivationDraft, type ActivationType, type ResourceLane } from "../../../src/skygrid/resource-activation-draft";

type ErrorResponse = { error: string };

function isActivationType(value: unknown): value is ActivationType {
  return typeof value === "string" && activationTypes.includes(value as ActivationType);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" } satisfies ErrorResponse);
  }

  const { onboarderId, activationType, candidateLanes } = req.body ?? {};
  if (typeof onboarderId !== "string" || onboarderId.trim().length === 0) {
    return res.status(400).json({ error: "onboarderId is required" } satisfies ErrorResponse);
  }

  if (!isActivationType(activationType)) {
    return res.status(400).json({ error: "activationType is invalid" } satisfies ErrorResponse);
  }

  const parsedCandidates = Array.isArray(candidateLanes) ? candidateLanes as ResourceLane[] : undefined;
  const draft = createResourceActivationDraft({
    onboarderId,
    activationType,
    candidateLanes: parsedCandidates,
  });

  return res.status(200).json(draft);
}
