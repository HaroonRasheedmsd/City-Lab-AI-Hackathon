import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  AlertTriangle,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertOctagon,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import type { ReportSummary, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface SummaryBentoProps {
  summary: ReportSummary;
  language: SupportedLanguage;
}

export const SummaryBento: React.FC<SummaryBentoProps> = ({ summary, language }) => {
  const t = translations[language];

  const totalCount = summary.total_tests;
  const normalCount = summary.counts_by_status['NORMAL'] || 0;
  const lowCount = summary.counts_by_status['LOW'] || 0;
  const highCount = summary.counts_by_status['HIGH'] || 0;
  const urgentCount = summary.counts_by_status['URGENT'] || 0;
  const unclassifiedCount =
    summary.counts_by_status['CANNOT BE CLASSIFIED FROM THE FILES'] || 0;
  const needsInfoCount = summary.counts_by_status['NEEDS_INFO'] || 0;
  const attentionCount = lowCount + highCount + urgentCount;

  // State for animated count-ups
  const [displayCounts, setDisplayCounts] = useState({
    total: 0,
    normal: 0,
    low: 0,
    high: 0,
    urgent: 0,
    unclassified: 0,
    needsInfo: 0,
    attention: 0,
  });

  const bentoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = {
      total: totalCount,
      normal: normalCount,
      low: lowCount,
      high: highCount,
      urgent: urgentCount,
      unclassified: unclassifiedCount,
      needsInfo: needsInfoCount,
      attention: attentionCount,
    };

    const current = { ...displayCounts };

    const tween = gsap.to(current, {
      ...targets,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayCounts({
          total: Math.round(current.total),
          normal: Math.round(current.normal),
          low: Math.round(current.low),
          high: Math.round(current.high),
          urgent: Math.round(current.urgent),
          unclassified: Math.round(current.unclassified),
          needsInfo: Math.round(current.needsInfo),
          attention: Math.round(current.attention),
        });
      },
    });

    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, normalCount, lowCount, highCount, urgentCount, unclassifiedCount, needsInfoCount, attentionCount]);

  const hasUrgent = urgentCount > 0;
  const urgentWarningText =
    summary.severe_warning ||
    'CRITICAL: One or more lab values breach dangerous safety limits. See a doctor today.';

  return (
    <div ref={bentoRef} className="space-y-4">
      {/* 1. Critical Urgent Alert Banner (shown only when urgent results exist) */}
      {hasUrgent && (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-urgent urgent-ring border border-rose-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <AlertOctagon size={28} className="text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest font-black bg-white/25 px-2 py-0.5 rounded-md">
                    URGENT CLINICAL ALERT
                  </span>
                  <span className="text-xs font-semibold opacity-90">
                    Source: 3_dangerous_urgent_values.md
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight mt-0.5">
                  {t.urgentAlert}
                </h3>
                <p className="text-sm font-medium text-rose-50 mt-0.5">
                  {urgentWarningText}
                </p>
              </div>
            </div>
            <div className="self-start sm:self-auto shrink-0">
              <span className="px-4 py-2 rounded-2xl bg-white text-rose-700 font-extrabold text-sm shadow-md inline-block">
                {displayCounts.urgent} critical result{displayCounts.urgent > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Bento Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-healthcare-darkCard border border-zendenta-border dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.totalTests}
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-zendenta-slate-dark dark:text-white font-display">
              {displayCounts.total}
            </span>
            <span className="text-xs font-medium text-slate-400">tests</span>
          </div>
        </div>

        {/* Normal */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-xs font-semibold">{t.statusNormal}</span>
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 font-display">
              {displayCounts.normal}
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">in range</span>
          </div>
        </div>

        {/* Low */}
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300">
            <span className="text-xs font-semibold">{t.statusLow}</span>
            <ArrowDownCircle size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-900 dark:text-blue-200 font-display">
              {displayCounts.low}
            </span>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">below</span>
          </div>
        </div>

        {/* High */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
            <span className="text-xs font-semibold">{t.statusHigh}</span>
            <ArrowUpCircle size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-900 dark:text-amber-200 font-display">
              {displayCounts.high}
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">elevated</span>
          </div>
        </div>

        {/* Urgent */}
        <div
          className={`p-4 rounded-2xl border shadow-soft flex flex-col justify-between ${
            hasUrgent
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900'
              : 'bg-slate-50/50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">{t.statusUrgent}</span>
            <AlertOctagon size={16} className={hasUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold font-display ${hasUrgent ? 'text-rose-600 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {displayCounts.urgent}
            </span>
            <span className="text-xs font-medium">critical</span>
          </div>
        </div>

        {/* Needs Info / Unclassified */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs font-semibold">Special Notes</span>
            <HelpCircle size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 font-display">
              {displayCounts.unclassified + displayCounts.needsInfo}
            </span>
            <span className="text-xs font-medium text-slate-500">pending</span>
          </div>
        </div>
      </div>

      {/* 3. Overall Attention Card & Mandatory Medical Disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Attention Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-soft flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Clinical Overview
            </span>
            <h4 className="text-lg font-bold mt-1 text-white">
              {displayCounts.attention === 0
                ? 'All evaluated tests in normal range'
                : `${displayCounts.attention} test${displayCounts.attention > 1 ? 's' : ''} require clinical attention`}
            </h4>
            <p className="text-xs text-blue-100/80 mt-1">
              Deterministic comparison against CityLab reference bounds
            </p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <ShieldAlert size={28} className="text-white" />
          </div>
        </div>

        {/* Mandatory Lab Safety Disclaimer Card (spans 2 columns) */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-zendenta-border dark:border-slate-800 shadow-soft flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zendenta-slate-dark dark:text-white flex items-center gap-2">
              <span>{t.disclaimerTitle}</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                Safety Directive 2 & 4
              </span>
            </h4>
            <p className="text-xs text-zendenta-slate-muted dark:text-slate-300 mt-1 leading-relaxed">
              {t.disclaimerBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
