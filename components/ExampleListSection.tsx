import React from "react";

const WORKFLOWS = [
  {
    name: "Service-bay tablet checkout",
    description:
      "Advisors capture signatures, scan IDs, and store cards on file before the vehicle leaves the lift.",
    badge: "Front-of-house",
  },
  {
    name: "Lien hold with storage fees",
    description:
      "Automatically apply lien language, calculate storage after grace periods, and block release until balances clear.",
    badge: "Collections",
  },
  {
    name: "Warranty enforcement",
    description:
      "Pair warranty approvals with photos and require finance sign-off before releasing warranty-only jobs.",
    badge: "Quality",
  },
  {
    name: "Weekly accounting digest",
    description:
      "Run a workflow that sends the accounting email once weekly with unpaid tickets, lien flags, and payment links.",
    badge: "Automation",
  },
];

const ExampleListSection = () => {
  return (
    <section className="px-6 pb-12 -mt-36">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6">Playbook snapshots</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOWS.map((workflow) => (
            <div
              key={workflow.name}
              className="lg:aspect-video bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-lg leading-snug" title={workflow.name}>
                  {workflow.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{workflow.description}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 translate-y-[1px]">
                  {workflow.badge}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Ready to run
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExampleListSection;
