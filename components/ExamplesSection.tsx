import React from "react";
import Section from "@/components/Section";
import CodeExample from "@/components/CodeExample";
import ExampleListSection from "@/components/ExampleListSection";

export default function ExamplesSection() {
  return (
    <Section id="examples" title="Workflows you can ship today" className="py-12" center>
      <div className="mb-4">
        <CodeExample compact />
      </div>
      <ExampleListSection />
    </Section>
  );
}
