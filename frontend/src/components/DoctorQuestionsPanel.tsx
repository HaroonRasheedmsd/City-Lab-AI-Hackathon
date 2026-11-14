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
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
            <Stethoscope size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
              {t.doctorQuestionsTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.doctorQuestionsSubtitle}
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
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-900 dark:text-rose-200 text-xs">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
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
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'border-teal-400 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0 mt-0.5">
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
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={isSelected ? 'Remove from print summary' : 'Add to print summary'}
                >
                  <BookmarkCheck
                    size={18}
                    className={isSelected ? 'fill-teal-600/20 stroke-teal-600' : 'stroke-slate-400'}
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
            <span>Click any question to include it in the printable medical export</span>
          </span>
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            {selectedQuestions.length} selected
          </span>
        </div>
      )}
    </div>
  );
};
