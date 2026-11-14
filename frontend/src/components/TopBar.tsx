import React from 'react';
import {
  Search,
  Printer,
  Moon,
  Sun,
  Plus,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface TopBarProps {
  patientId: string | null;
  patientName?: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onPrint: () => void;
  onNewAnalysis: () => void;
  onToggleMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  patientId,
  patientName,
  searchQuery,
  onSearchChange,
  language,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  onPrint,
  onNewAnalysis,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="no-print h-16 bg-white dark:bg-healthcare-darkCard border-b border-zendenta-border dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="hover:text-slate-600 dark:hover:text-slate-300">Patients</span>
          <span>/</span>
          <span className="font-semibold text-zendenta-slate-dark dark:text-white">
            {patientName || patientId || 'Overview'}
          </span>
        </nav>
      </div>

      {/* Center: Search Bar & Patient Lock Pill */}
      <div className="hidden md:flex items-center gap-4 flex-1 max-w-lg mx-6">
        {/* Working Search Input */}
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tests, biomarkers, values (e.g. ALT, Glucose)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-zendenta-slate-dark dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-zendenta-blue/30 focus:border-zendenta-blue transition"
          />
        </div>

        {/* Patient Lock Pill (Hard Rule) */}
        {patientId && (
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
            title="Privacy lock active: Session locked strictly to this patient's report."
          >
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-[150px]">
              Locked to: {patientId}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-700 text-zendenta-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('roman_urdu')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                language === 'roman_urdu'
                  ? 'bg-white dark:bg-slate-700 text-zendenta-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Roman
            </button>
            <button
              onClick={() => onLanguageChange('urdu')}
              className={`px-2 py-1 rounded-lg font-bold transition font-urdu ${
                language === 'urdu'
                  ? 'bg-white dark:bg-slate-700 text-zendenta-blue shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Print / Export Button */}
        <button
          onClick={onPrint}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Print or Save PDF Summary"
        >
          <Printer size={18} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Primary Action: + New Analysis */}
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zendenta-blue hover:bg-zendenta-blue-hover text-white text-xs font-bold shadow-sm transition"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Analysis</span>
        </button>
      </div>
    </header>
  );
};
