# EIPs protocol validation pilot handoff

**Linear issue:** MVP-80 — Close first protocol validation pilot  
**Prepared:** 2026-09-12  
**State:** blocked before implementation; no outreach or payment action authorized

## Repository access blocker

The requested implementation belongs in `MVPuknowme/eips`, but this workspace is the
SKYGRID / Aura-Core public website repository. It has no configured Git remote and does
not contain the EIPs source tree or the validation baseline referenced by
`MVPuknowme/eips#3`.

An HTTPS read of `https://github.com/MVPuknowme/eips.git` was attempted before preparing
this handoff and was rejected by the environment's network proxy with HTTP 403. Without
a checkout or readable remote, changing or testing the EIPs validator would require
inventing repository structure and behavior. That would not produce reviewable proof.

To unblock implementation, provide this agent workspace with either:

1. a checkout of `MVPuknowme/eips` on a writable review branch, or
2. read/write GitHub access to that repository and the current contents of PR #3.

## Bounded change to prepare in the target repository

Once access is restored, keep the proposed pilot change limited to one validation
failure and one deterministic fail-closed check:

1. Reproduce a currently accepted invalid EIP fixture using the repository's existing
   validation command.
2. Add a regression fixture that contains only the minimum input needed to demonstrate
   the failure.
3. Add one validator rule that rejects that fixture with a stable, actionable error and
   returns a non-zero status.
4. Confirm a neighboring valid fixture continues to pass.
5. Record the exact before/after commands, exit statuses, and relevant output in the PR
   body. Do not claim hosted or production validation.

### Acceptance evidence

The target PR is ready for review only when its evidence packet contains:

- the pre-change command and output showing the invalid fixture was accepted;
- the post-change command and output showing deterministic rejection;
- a passing positive-control fixture;
- the target repository's lint and test results; and
- the commit SHA containing the validator and regression test.

## Draft outreach note — approval required before use

I found a bounded validation case in the EIPs repository: **[replace with the exact
invalid input and current observed result after reproduction]**. The proposed acceptance
criterion is equally narrow: the existing validator must reject that fixture with a
stable error and non-zero status while the adjacent valid fixture continues to pass.

I can deliver that as one $250 founding Protocol Validation Sprint: reproduce the
failure, add one deterministic fail-closed check, and return a before/after evidence
packet plus PR within 48 hours after scope, repository access, and acceptance criteria
are confirmed. No production transactions, wallet signing, private-data movement, or
failover execution are included. If you want the paid slot, please answer yes or no and
name your preferred invoice/payment path; no message should be sent until the issue
owner explicitly approves outreach and a live settlement path is verified.

## Commercial and operational boundaries

- The retired SIG Network issue #1157 is not a prospect and must not be contacted.
- The supplied Stripe links are test-mode only and are not usable settlement rails.
- This handoff records no acceptance, invoice, payment, or realized revenue.
- No public comment, maintainer contact, deployment, or payment action was performed.
- The replacement lead remains unqualified until its failure is reproduced from the
  target repository and the maintainer or prospect is approved for outreach.
