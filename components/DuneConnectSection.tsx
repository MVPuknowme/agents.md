import React from "react";

import Section from "@/components/Section";

const DuneConnectSection = () => (
  <Section
    id="dune-contracts"
    title="Connect with Dune contracts"
    className="py-12"
    center
    maxWidthClass="max-w-4xl"
  >
    <div className="space-y-4 text-lg text-gray-700 dark:text-gray-200 text-left">
      <p>
        Need on-chain context for your agents? Dune Contracts offers curated,
        query-ready contract data so you can plug the same project instructions
        into reproducible blockchain analyses.
      </p>

      <p className="text-base text-gray-600 dark:text-gray-300">
        Open the Contracts workspace to explore datasets, notebooks, and cloud
        resources that pair naturally with your AGENTS.md guidance.
      </p>

      <div className="flex flex-wrap gap-3">
        <a
          href="https://dune.com/contracts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Browse Dune Contracts
        </a>
        <a
          href="https://dune.com/contracts?tab=cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          View cloud resources
        </a>
      </div>
    </div>
  </Section>
);

export default DuneConnectSection;
