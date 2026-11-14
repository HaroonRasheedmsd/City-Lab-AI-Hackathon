import React from 'react';
import {
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface SourcesViewProps {
  language: SupportedLanguage;
}

export const SourcesView: React.FC<SourcesViewProps> = () => {
  const sources = [
    {
      title: '1_lab_safety_rules.md',
      category: 'Clinical Governance & Safety Directives',
      description:
        'Contains 5 strict clinical directives: (1) Patient privacy context-lock, (2) Prohibition against automated medical diagnosis, (3) Tone calibration at Class 8 reading level, (4) Mandatory physician consultation disclaimers, and (5) Non-maleficence principles.',
      tags: ['Safety', 'Privacy', 'Class 8 Reading Level'],
      records: '5 Directives',
      type: 'Markdown Governance',
    },
    {
      title: '2_normal_ranges.md',
      category: 'Standard Clinical Reference Intervals',
      description:
        'Comprehensive clinical reference intervals for 9 core lab tests across age brackets (18-100 yrs) and biological sex (Male / Female). Specifies inclusive interval boundaries: if Value == Low or Value == High, status is NORMAL.',
      tags: ['Reference Intervals', 'Inclusive Boundaries', 'Sex/Age Brackets'],
      records: '13 Reference Bands',
      type: 'Clinical Ranges Sheet',
    },
    {
      title: '3_dangerous_urgent_values.md',
      category: 'Critical Panic Thresholds',
      description:
        'Authoritative emergency limit cutoffs (e.g. Hemoglobin < 7.0 g/dL or > 20.0 g/dL, Fasting Blood Sugar < 50 mg/dL or > 300 mg/dL). Mandates overriding normal/high/low classification with URGENT and displaying: "see a doctor today".',
      tags: ['Urgent Limits', 'Critical Overrides', 'Same-day Medical Care'],
      records: '4 Panic Rules',
      type: 'Critical Panic Rules',
    },
    {
      title: '4_test_glossary.md',
      category: 'Biochemical Definitions & Canonical Synonyms',
      description:
        'Biochemical test descriptions, clinical functions, and established lab synonyms/aliases (e.g. SGPT = ALT, SGOT = AST, Fasting Blood Sugar = Glucose, Hemoglobin = Hb).',
      tags: ['Canonical Aliases', 'Biochemical Context', 'Explanations'],
      records: '9 Core Biomarkers',
      type: 'Glossary & Alias Map',
    },
    {
      title: 'config/conversions.json',
      category: 'Standard Unit Conversion Factors',
      description:
        'Biochemical unit conversions (e.g. mmol/L to mg/dL for blood glucose with factor 18.0182) flagged with source="standard", ensuring deterministic conversions with auditable mathematical steps.',
      tags: ['Unit Conversion', 'Traceable Math'],
      records: 'Standard Multipliers',
      type: 'Conversion Table',
    },
    {
      title: 'patient_reports/*.txt',
      category: 'Encounter Reports (P001 - P014)',
      description:
        'Corpus of 14 clinical reports covering clean normals, female/male boundary cases, missing demographics, critical urgent panics, mmol/L unit conversions, unclassified tests (ferritin), and synonym variations.',
      tags: ['Test Corpus', '14 Scenarios'],
      records: '14 Reports',
      type: 'Patient Corpus',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-healthcare-darkCard border border-zendenta-border dark:border-slate-800 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zendenta-slate-dark dark:text-white">
              Clinical Reference Files &amp; Audit Trace
            </h3>
            <p className="text-xs text-zendenta-slate-muted dark:text-slate-400 mt-0.5">
              100% deterministic evaluation based exclusively on CityLab ground truth files.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Zero LLM Hallucination in Classification</span>
        </div>
      </div>

      {/* Grid of Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((src, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-healthcare-darkCard border border-zendenta-border dark:border-slate-800 shadow-soft hover:shadow-card transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400">
                  {src.type}
                </span>
                <span className="text-xs font-mono font-medium text-slate-400">
                  {src.records}
                </span>
              </div>

              <h4 className="text-sm font-bold text-zendenta-slate-dark dark:text-white font-mono">
                {src.title}
              </h4>

              <p className="text-xs font-semibold text-zendenta-teal dark:text-teal-400">
                {src.category}
              </p>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {src.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
              {src.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
