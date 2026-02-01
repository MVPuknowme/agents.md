import React from "react";
import Section from "@/components/Section";
import CodeExample from "@/components/CodeExample";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

export default function FAQ() {
  const faqItems: FAQItem[] = [
    {
      question: "Can we block releases until liens are cleared?",
      answer:
        "Yes. Release buttons stay locked whenever a lien flag is present and the balance is above zero. Warranty-only jobs require an approval code before the block is lifted.",
    },
    {
      question: "How do we run a workflow that sends the email once weekly?",
      answer: (
        <>
          <p className="mb-2">Use the built-in scheduler to send the accounting email every Sunday at 6pm:</p>
          <div className="w-full flex justify-center">
            <CodeExample
              code={`workflow: accounting-digest\nschedule: "0 18 * * SUN"\nactions:\n  - email: finance@dealership.com\n  - attach: unpaid-tickets.csv`}
              compact
              heightClass="min-h-[64px]"
              centerVertically
            />
          </div>
        </>
      ),
    },
    {
      question: "What happens when there is a warranty dispute?",
      answer:
        "Escalations route to finance with photos and prior approvals attached. You can pause storage fees until the dispute is resolved.",
    },
    {
      question: "Do we need internet in the bay?",
      answer:
        "Offline capture is supported. Tablet sessions queue signatures, scans, and charges until connectivity returns, then sync automatically.",
    },
    {
      question: "Can we export lien records for filings?",
      answer:
        "Yes. Download a PDF ledger or push data to your DMS/CRM via webhook or SFTP so legal has what they need without extra work.",
    },
  ];

  return (
    <Section
      id="faq"
      title="FAQ"
      className="py-20"
      center
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {faqItems.map((item, index) => (
          <div key={index}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {item.question}
            </h3>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {item.answer}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
