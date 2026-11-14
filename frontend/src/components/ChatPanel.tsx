import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Lock,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import type { SupportedLanguage } from '../types';
import { api } from '../api/client';
import { translations } from '../i18n/translations';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: string;
  isRefusal?: boolean;
  ruleQuoted?: string;
  providerUsed?: string;
  sources?: string[];
  timestamp: string;
}

interface ChatPanelProps {
  patientId?: string | null;
  patientName?: string | null;
  language: SupportedLanguage;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  patientId,
  patientName,
  language,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const t = translations[language];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestion chips
  const suggestionChips = [
    'What does my high ALT mean?',
    'Which results need attention?',
    'What questions should I ask my doctor?',
    'Are my ranges normal for my age?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !patientId || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage(patientId, text);

      const isRefusal = !!res.safety_refusal;
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.response,
        intent: res.intent,
        isRefusal,
        ruleQuoted: res.safety_refusal?.rule_quoted,
        providerUsed: res.provider_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `Unable to process query: ${err.message || 'Network error'}. Please try again.`,
        isRefusal: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle incoming initialQuestion (e.g. from Detail Drawer "Ask AI about this")
  useEffect(() => {
    if (initialQuestion && patientId) {
      handleSend(initialQuestion);
      onClearInitialQuestion?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, patientId]);

  // Reset or initialize greeting when patient changes
  useEffect(() => {
    if (patientId) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello. I am your CityLab Lab Assistant, locked to **${patientName || 'this patient'} (${patientId})**. I can explain what your lab tests measure and what the numbers mean using CityLab's reference files. I cannot provide a medical diagnosis or prescribe medications.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, patientName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-healthcare-darkCard rounded-2xl p-6 shadow-soft border border-zendenta-border dark:border-slate-800 flex flex-col h-[620px] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zendenta-blue text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zendenta-slate-dark dark:text-white">
              {t.chatTitle}
            </h3>
            <p className="text-xs text-zendenta-slate-muted dark:text-slate-400">
              Answering only about {patientName || patientId || 'active patient'}
            </p>
          </div>
        </div>

        {/* Lock indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
          <Lock size={12} />
          <span>Locked: {patientId || 'None'}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {!patientId ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <Lock size={32} className="mb-2 text-slate-300 dark:text-slate-600" />
            <p>Please select a patient to start context-locked Q&amp;A.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition ${
                    isUser
                      ? 'bg-zendenta-blue text-white rounded-tr-sm shadow-sm'
                      : msg.isRefusal
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {/* Safe/Neutral Refusal Badge if privacy or diagnosis blocked */}
                  {msg.isRefusal && (
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs mb-2 pb-1.5 border-b border-amber-200 dark:border-amber-800">
                      <ShieldAlert size={15} />
                      <span>Lab Safety &amp; Privacy Policy Notice</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Quoted Rule if available */}
                  {msg.ruleQuoted && (
                    <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      CityLab Policy Quoted: "{msg.ruleQuoted}"
                    </div>
                  )}

                  {/* Footer details: timestamp and provider */}
                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      isUser ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.providerUsed && (
                      <span className="flex items-center gap-1">
                        <FileCheck2 size={10} />
                        <span>Source: {msg.providerUsed}</span>
                      </span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading skeleton indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin text-zendenta-blue" />
              <span>Consulting CityLab reference rules &amp; glossary...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {patientId && (
        <div className="pt-2 pb-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <Sparkles size={14} className="text-zendenta-teal shrink-0 mr-1" />
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-zendenta-blue dark:text-slate-300 font-medium transition text-xs border border-slate-200 dark:border-slate-700"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!patientId || isLoading}
            placeholder={
              patientId
                ? `Answering only about ${patientName || patientId} - other records are private.`
                : 'Select patient first...'
            }
            className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zendenta-blue/30 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!patientId || !inputText.trim() || isLoading}
            className="p-3 rounded-xl bg-zendenta-blue hover:bg-zendenta-blue-hover text-white font-semibold transition disabled:opacity-40 shadow-sm"
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
