import React from 'react';
import {
  ShieldCheck,
  Lock,
  Printer,
  Moon,
  Sun,
  BookOpen,
  Globe,
  Stethoscope,
} from 'lucide-react';
import type { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  activePatientName?: string | null;
  activePatientId?: string | null;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSources: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePatientName,
  activePatientId,
  language,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  onOpenSources,
  onPrint,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
            <Stethoscope size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                v1.0 Rules Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center: Privacy Context Lock Badge */}
        <div className="hidden md:flex items-center">
          {activePatientId ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-800 dark:text-teal-200 text-xs font-medium shadow-soft">
              <Lock size={14} className="text-teal-600 dark:text-teal-400" />
              <span>
                {t.privacyLocked}:{' '}
                <strong className="font-semibold text-teal-900 dark:text-teal-100">
                  {activePatientName || 'Patient'} ({activePatientId})
                </strong>
              </span>
              <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400 ml-0.5" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <ShieldCheck size={14} />
              <span>{t.noPatientSelected}</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reference Sources Button */}
          <button
            onClick={onOpenSources}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            title="View CityLab reference files and normal range sheets"
          >
            <BookOpen size={15} />
            <span className="hidden sm:inline">{t.viewSources}</span>
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <Globe size={14} className="text-slate-400 ml-1.5 mr-1" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent border-none text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 py-0.5"
            >
              <option value="en" className="dark:bg-slate-900 text-slate-900 dark:text-white">English</option>
              <option value="roman_urdu" className="dark:bg-slate-900 text-slate-900 dark:text-white">Roman Urdu</option>
              <option value="urdu" className="dark:bg-slate-900 text-slate-900 dark:text-white">اردو</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
            title="Print or save as PDF"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">{t.printReport}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
