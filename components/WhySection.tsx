import Section from "@/components/Section";
import React from "react";
import ClipboardIcon from "@/components/icons/ClipboardIcon";
import UserIcon from "@/components/icons/UserIcon";
import LinkIcon from "@/components/icons/LinkIcon";

export default function WhySection() {
  return (
    <Section
      id="why"
      title="Why tablet pay + mechanic liens?"
      className="pt-24 pb-12"
      center
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4">
        <p className="mb-4">
          Customers sign in the bay, advisors collect payment intents on the
          spot, and lien acknowledgements are baked into the flow. Your team
          never guesses whether a vehicle can leave.
        </p>
        <p className="mb-4">
          The same workflow powers warranty jobs: capture approvals, store
          supporting photos, and release vehicles only when coverage is
          validated or balances are cleared.
        </p>
        <p className="mb-4">Teams keep coming back because it:</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ClipboardIcon />
            <p>
              <span className="font-semibold block">Digitizes lien notices.</span>
              Every job gets a signed lien disclosure and release checklist the
              moment work starts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <UserIcon />
            <p>
              <span className="font-semibold block">Protects technicians.</span>
              Prevent unauthorized hand-offs by tying release approval to
              payment status and warranty confirmation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LinkIcon />
            <p>
              <span className="font-semibold block">Keeps accounting in sync.</span>
              Weekly digests summarize unpaid vehicles, lien flags, and stored
              card authorizations so follow-up is automatic.
            </p>
          </div>
        </div>
        <p>
          Think of it as a modern cashier desk that travels with every tablet:
          predictable releases, fewer disputes, and a clean audit trail for
          state lien requirements.
        </p>
      </div>
    </Section>
  );
}
