const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = require("node:fs").readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
  });
  module._compile(output.outputText, filename);
};

const { createResourceActivationDraft } = require("../src/skygrid/resource-activation-draft.ts");

test("returns deterministic recommendation for same inputs", () => {
  const input = {
    onboarderId: "onb_001",
    activationType: "compute_request",
    candidateLanes: [
      { laneId: "b", laneType: "edge_compute", capacityScore: 90, latencyScore: 90, reliabilityScore: 90 },
      { laneId: "a", laneType: "edge_compute", capacityScore: 90, latencyScore: 90, reliabilityScore: 90 },
    ],
  };

  const first = createResourceActivationDraft(input);
  const second = createResourceActivationDraft(input);

  assert.deepEqual(first, second);
  assert.equal(first.allowedToExecute, false);
});

test("solar backed node prefers solar/device capable lanes when provided", () => {
  const draft = createResourceActivationDraft({
    onboarderId: "onb_solar",
    activationType: "solar_backed_node",
    candidateLanes: [
      { laneId: "generic", laneType: "edge_compute", capacityScore: 99, latencyScore: 99, reliabilityScore: 99 },
      { laneId: "solar", laneType: "solar_backup", capacityScore: 80, latencyScore: 70, reliabilityScore: 92, renewableScore: 98, supportsSolarBackup: true },
    ],
  });

  assert.equal(draft.recommendedLane.laneId, "solar");
  assert.equal(draft.proofTrail.executionGate, "approval_required");
});

test("gas and token planning fields stay planning-only", () => {
  const gasDraft = createResourceActivationDraft({ onboarderId: "onb_gas", activationType: "gas_fee_budget" });
  const leaseDraft = createResourceActivationDraft({ onboarderId: "onb_lease", activationType: "token_space_lease" });

  assert.equal(gasDraft.gasBudgetEstimate.planningOnly, true);
  assert.equal(leaseDraft.tokenSpaceLeasePlan.planningOnly, true);
});
