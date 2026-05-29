import React from "react";
import type { GetStaticProps } from "next";

import Footer from "@/components/Footer";

const { buildSandboxResponderSummary } = require("@/src/emergency/pacific-heart-ingest");

type ResponderSummary = {
  view: string;
  mode: string;
  source: string;
  validation: {
    sourceValidated: boolean;
    normalizedEventValidated: boolean;
    privacyGate: string;
    allowedFields: string[];
    redactedFields: string[];
  };
  event: {
    eventId: string;
    eventType: string;
    occurredAt: string;
    priority: string;
    alerts: string[];
    vitals: {
      heartRateBpm: number;
      bloodPressureSystolic: number;
      bloodPressureDiastolic: number;
    };
    location: {
      lat: number;
      lng: number;
      precision: string;
    } | null;
    preArrivalNotes: string[];
  };
  privacy: {
    patientIdentifierIncluded: boolean;
    fullChartIncluded: boolean;
    treatmentProtocolIncluded: boolean;
    operatorReviewRequired: boolean;
    boundary: string;
  };
};

type ResponderPageProps = {
  summary: ResponderSummary;
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function PacificHeartResponderPage({ summary }: ResponderPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:py-14">
        <section className="rounded-3xl border border-cyan-400/30 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30 md:p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Pacific Heart sandbox responder view
          </p>
          <div className="grid gap-6 md:grid-cols-[1.4fr_0.8fr] md:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Responder pre-arrival summary
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                This page renders validated sandbox emergency data only. It is limited to
                pre-arrival context, keeps direct patient identifiers out of the responder
                surface, and requires operator review before operational use.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Privacy gate
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatLabel(summary.validation.privacyGate)}
              </p>
              <p className="mt-2 text-sm text-emerald-100">
                Source validated: {summary.validation.sourceValidated ? "yes" : "no"}
              </p>
              <p className="text-sm text-emerald-100">
                Event validated: {summary.validation.normalizedEventValidated ? "yes" : "no"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Event</p>
            <p className="mt-2 text-xl font-semibold text-white">{summary.event.eventId}</p>
            <p className="mt-1 text-sm text-cyan-200">{formatLabel(summary.event.eventType)}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Priority</p>
            <p className="mt-2 text-xl font-semibold text-white">{formatLabel(summary.event.priority)}</p>
            <p className="mt-1 text-sm text-slate-300">Sandbox triage cue, not a treatment order.</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Occurred at</p>
            <p className="mt-2 text-xl font-semibold text-white">{summary.event.occurredAt}</p>
            <p className="mt-1 text-sm text-slate-300">UTC sandbox timestamp.</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-semibold text-white">Vitals and alerts</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl bg-slate-800 p-4">
                <dt className="text-sm text-slate-400">Heart rate</dt>
                <dd className="text-2xl font-semibold text-white">{summary.event.vitals.heartRateBpm} bpm</dd>
              </div>
              <div className="rounded-xl bg-slate-800 p-4">
                <dt className="text-sm text-slate-400">Blood pressure</dt>
                <dd className="text-2xl font-semibold text-white">
                  {summary.event.vitals.bloodPressureSystolic}/{summary.event.vitals.bloodPressureDiastolic}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-800 p-4">
                <dt className="text-sm text-slate-400">Location</dt>
                <dd className="text-base font-semibold text-white">
                  {summary.event.location
                    ? `${summary.event.location.lat}, ${summary.event.location.lng}`
                    : "Not supplied"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {summary.event.alerts.map((alert) => (
                <span key={alert} className="rounded-full border border-amber-300/40 bg-amber-950/40 px-3 py-1 text-sm text-amber-100">
                  {formatLabel(alert)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-semibold text-white">Allowed pre-arrival context</h2>
            <ul className="mt-5 space-y-3">
              {summary.event.preArrivalNotes.map((note) => (
                <li key={note} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-slate-200">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-rose-300/30 bg-rose-950/20 p-6">
          <h2 className="text-2xl font-semibold text-white">Privacy boundary confirmation</h2>
          <p className="mt-3 text-slate-200">{summary.privacy.boundary}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <p className="rounded-xl bg-slate-950/60 p-3 text-sm text-slate-200">
              Patient ID exposed: {summary.privacy.patientIdentifierIncluded ? "yes" : "no"}
            </p>
            <p className="rounded-xl bg-slate-950/60 p-3 text-sm text-slate-200">
              Full chart exposed: {summary.privacy.fullChartIncluded ? "yes" : "no"}
            </p>
            <p className="rounded-xl bg-slate-950/60 p-3 text-sm text-slate-200">
              Treatment protocol exposed: {summary.privacy.treatmentProtocolIncluded ? "yes" : "no"}
            </p>
            <p className="rounded-xl bg-slate-950/60 p-3 text-sm text-slate-200">
              Operator review required: {summary.privacy.operatorReviewRequired ? "yes" : "no"}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export const getStaticProps: GetStaticProps<ResponderPageProps> = async () => {
  const result = buildSandboxResponderSummary();

  if (!result.ok) {
    throw new Error(`Unable to build sandbox responder summary: ${result.error}`);
  }

  return {
    props: {
      summary: result.summary,
    },
  };
};
