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
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  patientId,
  patientName,
  language,
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

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
  }, [patientId, patientName]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-800 flex flex-col h-[600px] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              {t.chatTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.chatSubtitle}
            </p>
          </div>
        </div>

        {/* Lock indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-semibold border border-teal-200 dark:border-teal-800">
          <Lock size={12} />
          <span>Locked: {patientId || 'None'}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {!patientId ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <Lock size={32} className="mb-2 text-slate-300 dark:text-slate-600" />
            <p>Please select a patient to start context-locked Q&A.</p>
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
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition ${
                    isUser
                      ? 'bg-teal-700 text-white rounded-tr-sm'
                      : msg.isRefusal
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {/* Safe/Neutral Refusal Badge if privacy or diagnosis blocked */}
                  {msg.isRefusal && (
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold text-xs mb-2 pb-1.5 border-b border-blue-200 dark:border-blue-800">
                      <ShieldAlert size={15} />
                      <span>Lab Safety &amp; Privacy Policy</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Quoted Rule if available */}
                  {msg.ruleQuoted && (
                    <div className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/60 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Lab Policy: "{msg.ruleQuoted}"
                    </div>
                  )}

                  {/* Footer details: timestamp and provider */}
                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      isUser ? 'text-teal-200' : 'text-slate-400'
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
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin text-teal-600" />
              <span>Checking CityLab clinical files...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {patientId && (
        <div className="pt-2 pb-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <Sparkles size={14} className="text-teal-600 dark:text-teal-400 shrink-0 mr-1" />
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-teal-700 dark:text-slate-300 font-medium transition text-xs"
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
            placeholder={patientId ? t.chatPlaceholder : 'Select patient first...'}
            className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!patientId || !inputText.trim() || isLoading}
            className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition disabled:opacity-40 shadow-sm"
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
