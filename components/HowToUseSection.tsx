import Section from "@/components/Section";
import React from "react";

export default function HowToUseSection() {
  const steps = [
    {
      title: "Deploy the tablet flow",
      body: (
        <>
          Mount the web app on advisor tablets, connect your card processor,
          and scan VIN/license data before the vehicle leaves the lift.
        </>
      ),
    },
    {
      title: "Switch on lien automation",
      body: (
        <>
          Choose a grace period, storage fee schedule, and lien disclosure
          language. The app applies the flag automatically when balances remain.
        </>
      ),
    },
    {
      title: "Enforce warranty releases",
      body:
        "Require approval codes, attach photo evidence, and block release until finance clears the RO or adds a waiver.",
    },
    {
      title: "Schedule outreach",
      body: (
        <>
          Configure SMS/email nudges and run a workflow that sends the
          accounting email once weekly so the team starts Monday with a
          prioritized follow-up list.
        </>
      ),
    },
  ];

  return (
    <Section
      title="How it rolls out"
      className="py-12"
      center
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6 text-left">
        {steps.map((s, idx) => (
          <div key={idx}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {idx + 1}. {s.title}
            </h3>
            <div className="text-gray-700 dark:text-gray-300">{s.body}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
