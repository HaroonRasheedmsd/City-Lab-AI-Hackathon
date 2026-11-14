import React, { useState } from 'react';
import {
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  BookmarkCheck,
  Stethoscope,
} from 'lucide-react';
import type { DoctorQuestionsResponse, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface DoctorQuestionsPanelProps {
  doctorData?: DoctorQuestionsResponse | null;
  selectedQuestions: string[];
  onToggleQuestion: (q: string) => void;
  language: SupportedLanguage;
}

export const DoctorQuestionsPanel: React.FC<DoctorQuestionsPanelProps> = ({
  doctorData,
  selectedQuestions,
  onToggleQuestion,
  language,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  const questions = doctorData?.questions || [];
  const urgentWarning = doctorData?.urgent_warning;

  const handleCopyAll = () => {
    if (questions.length === 0) return;
    const text = questions
      .map((q, idx) => `${idx + 1}. ${q}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-healthcare-darkCard rounded-2xl p-6 shadow-soft border border-zendenta-border dark:border-slate-800 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400 flex items-center justify-center shrink-0">
            <Stethoscope size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zendenta-slate-dark dark:text-white">
              {t.doctorQuestionsTitle}
            </h3>
            <p className="text-xs text-zendenta-slate-muted dark:text-slate-400">
              {doctorData?.is_general
                ? 'All tests in normal range: 3 general follow-up questions'
                : 'Targeted inquiries based on your out-of-range test results'}
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopyAll}
          disabled={questions.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition disabled:opacity-40 self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400">{t.copied}</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>{t.copyQuestions}</span>
            </>
          )}
        </button>
      </div>

      {/* Urgent Warning if any critical values triggered */}
      {urgentWarning && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-900 dark:text-rose-200 text-xs urgent-ring">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-[10px]">
              Urgent Medical Alert
            </span>
            <p className="font-medium mt-0.5">{urgentWarning}</p>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="mt-4 space-y-3">
        {questions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
            <HelpCircle size={24} className="mb-1 text-slate-300" />
            <span>Select a patient report to load doctor consultation questions.</span>
          </div>
        ) : (
          questions.map((question, idx) => {
            const isSelected = selectedQuestions.includes(question);

            return (
              <div
                key={idx}
                onClick={() => onToggleQuestion(question)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'border-zendenta-blue bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-zendenta-blue/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                    {question}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleQuestion(question);
                  }}
                  className={`p-1 rounded-lg transition shrink-0 ${
                    isSelected
                      ? 'text-zendenta-blue dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={isSelected ? 'Remove from print summary' : 'Add to print summary'}
                >
                  <BookmarkCheck
                    size={18}
                    className={
                      isSelected
                        ? 'fill-blue-600/20 stroke-zendenta-blue'
                        : 'stroke-slate-400'
                    }
                  />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Printable summary hint */}
      {questions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <FileText size={13} />
            <span>Click any question to bookmark for the printable visit sheet</span>
          </span>
          <span className="font-semibold text-zendenta-blue dark:text-blue-400">
            {selectedQuestions.length} selected
          </span>
        </div>
      )}
    </div>
  );
};
