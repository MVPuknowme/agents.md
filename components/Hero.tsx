import React from "react";
import CodeExample, { HERO_AGENTS_MD } from "@/components/CodeExample";
import GitHubIcon from "@/components/icons/GitHubIcon";

export default function Hero() {
  return (
    <header className="px-6 py-20 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="flex flex-col items-start text-left sm:items-start max-w-prose">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Tablet pay &amp; track for auto shops
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            Capture signatures, payments, lien acknowledgements, and warranty
            terms from the service bay &mdash; then track every vehicle until the
            bill is cleared.
          </p>

          <p className="mt-3 text-lg leading-relaxed text-gray-700 dark:text-gray-300 pr-4">
            Build a dealership-ready tablet flow with lien notices, stored cards
            on file, and automated outreach for overdue balances.
          </p>

          <div className="mt-6 flex gap-4 flex-col sm:flex-row w-full sm:w-auto justify-center sm:justify-start">
            <a
              href="#examples"
              className="inline-block px-5 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium text-center hover:opacity-80"
            >
              See the playbook
            </a>
            <a
              href="#faq"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <GitHubIcon className="w-4 h-4 text-current" />
              Implementation FAQ
            </a>
          </div>
        </div>
        <div className="w-full md:max-w-none">
          <CodeExample
            compact
            heightClass="min-h-[160px] max-h-[300px]"
            code={HERO_AGENTS_MD}
            href="https://example.com/tablet-pay"
          />
        </div>
      </div>
    </header>
  );
}
