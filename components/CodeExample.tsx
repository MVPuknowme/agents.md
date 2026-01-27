import React from "react";
import CopyIcon from "./icons/CopyIcon";

interface CodeExampleProps {
  code?: string;
  compact?: boolean;
  heightClass?: string;
  centerVertically?: boolean;
}

export const HERO_AGENTS_MD = `workflow: tablet-pay-lien
steps:
  - capture: customer signature, driver license scan, VIN
  - present: repair order + lien notice with auto-calc storage fees
  - collect: card on file + optional down payment
  - trigger: weekly digest email for unpaid tickets
  - release: payment clears -> lien flag removed`;

const EXAMPLE_AGENTS_MD = `# Tablet pay + lien enforcement blueprint

## Kiosk checklist (service advisor)
- validate VIN and mileage at drop-off
- collect payment intent token on the tablet
- mark lien flag if balance > $0 after warranty adjustments

## Automated follow-ups
- Day 0: send signed work order + warranty coverage summary
- Day 3: SMS and email past-due notice with payment link
- Weekly: resend digest of unpaid vehicles to accounting (cron: Sunday 6pm)

## Safety rails
- refuse release workflow if lien flag present and balance > 0
- allow warranty-only releases when approval code attached
- export lien ledger to PDF for state filings
`;

function parseMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### ")) {
      elements.push(
        <div key={i} className="font-bold">
          {line}
        </div>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={i}>
          {renderLineWithInlineCode(line)}
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i}>&nbsp;</div>);
    } else {
      elements.push(
        <div key={i}>
          {renderLineWithInlineCode(line)}
        </div>
      );
    }
  }

  return elements;
}

function renderLineWithInlineCode(line: string): React.ReactNode {
  const parts = line.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <span key={index} className="bg-gray-200 dark:bg-gray-800 px-1 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function CodeExample({
  code,
  compact = false,
  heightClass,
  centerVertically = false,
}: CodeExampleProps) {
  const md = code ?? EXAMPLE_AGENTS_MD;
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const content = (
    <>
      <div className="relative">
        <button
          onClick={copyToClipboard}
          className={`absolute right-3 p-2 rounded-md bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10 cursor-pointer ${
            centerVertically ? "top-1/2 -translate-y-1/2" : "top-3"
          }`}
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </button>
        <pre
          className={`relative rounded-lg bg-white dark:bg-black text-gray-800 dark:text-gray-100 text-xs leading-6 overflow-x-auto p-4 ${
            centerVertically ? "flex items-center" : ""
          } ${
            heightClass
              ? heightClass
              : compact
              ? ""
              : "min-h-[250px] max-h-[500px]"
          } border border-gray-200 dark:border-gray-700 shadow-sm`}
        >
          <code>{parseMarkdown(md)}</code>
        </pre>
      </div>
    </>
  );

  if (compact) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <section className="px-6 pt-10 pb-24 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <h2 className="text-3xl font-semibold tracking-tight">
          Ready-to-run workflows
        </h2>
        {content}
      </div>
    </section>
  );
}
