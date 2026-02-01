import React from "react";
import Section from "@/components/Section";

export default function CompatibilitySection() {
  const capabilities = [
    {
      name: "Tablet-ready checkout",
      detail:
        "Guided flows for signatures, license scans, VIN capture, and card-on-file authorization without leaving the bay.",
    },
    {
      name: "Mechanic lien guardrails",
      detail:
        "Auto-flag unpaid tickets, attach signed lien notices, and prevent release until balance is cleared or approved.",
    },
    {
      name: "Warranty-aware releases",
      detail:
        "Track warranty approvals, attach photo evidence, and route exceptions to finance before a vehicle leaves.",
    },
    {
      name: "Omni-channel reminders",
      detail:
        "Send SMS, email, and printed statements with payment links. Weekly digests keep accounting synced.",
    },
    {
      name: "Shop ops telemetry",
      detail:
        "Per-RO audit trails, lien ledger exports, and storage-fee calculators stay ready for state filings.",
    },
    {
      name: "Open integrations",
      detail:
        "Drop-in webhooks for DMS/CRM, SFTP exports for accounting, and API keys for custom dashboards.",
    },
  ];

  return (
    <Section
      id="compatibility"
      title="Built for tablets, bays, and back offices"
      className="py-12"
      center
      maxWidthClass="max-w-3xl"
    >
      <p className="text-xl font-light text-gray-500 dark:text-gray-400 text-center max-w-lg mx-auto">
        Everything your shop needs to take payments, track lien exposure, and
        enforce warranty rules without adding headcount.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {capabilities.map(({ name, detail }) => (
          <div
            key={name}
            className="flex flex-col gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black shadow-sm"
          >
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{detail}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
