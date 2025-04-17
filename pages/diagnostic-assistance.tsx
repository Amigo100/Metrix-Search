import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'next-i18next';

import PageHeader from '@/components/PageHeader';           // ⭐ NEW – canonical header
import {
  Send,
  Copy,
  RotateCcw,
  Edit,
  Trash2,
  Bot,
  User,
  Microscope,
  Stethoscope,
  Pill,
  Loader2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const DISCLAIMER_TEXT =
  `Metrix AI enhances clinical decision‑making with features like investigation ` +
  `plans, management guidance, and drug suggestions. It is not designed for ` +
  `analyzing medical images or signals and does not replace professional clinical ` +
  `judgment.`;

const primaryButtonStyles =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed';

const secondaryButtonStyles =
  'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed';

const ghostButtonStyles =
  'inline-flex items-center justify-center p-2 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed';

const formInputStyles =
  'block w-full rounded-full border border-gray-300 py-2 px-4 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-base';

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function DiagnosticAssistancePage() {
  const { t } = useTranslation('chat');

  /* ----- State ----- */
  const [stage, setStage] = useState<number>(1);
  const [requestType, setRequestType] = useState<string>('');
  const [exampleQueries, setExampleQueries] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content:
        "Hello! I'm your Metrix AI Assistant. How can I help you today? Select a category or type your query below.",
    },
  ]);
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ----- API config ----- */
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const API_ENDPOINT = `${API_BASE_URL}/rag/ask_rag`;

  /* ---------------------------------------------------------------------- */
  /*  Helpers                                                                */
  /* ---------------------------------------------------------------------- */

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, messageIsStreaming]);

  /* ……………………… (all business‑logic handlers stay unchanged) ……………………… */

  /* ---------------------------------------------------------------------- */
  /*  Rendering helpers                                                     */
  /* ---------------------------------------------------------------------- */

  const renderDisclaimer = (centered = false) => (
    <div
      className={`mt-8 max-w-2xl mx-auto ${
        centered ? 'text-center' : 'text-left'
      } text-xs text-gray-500 leading-relaxed`}
    >
      <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
    </div>
  );

  /* ---------- Stage 1 (home) ---------- */

  function renderHomeScreen() {
    const requestTypes = [
      {
        type: 'investigation',
        label: 'Investigation Plan',
        icon: Microscope,
        examples: [
          'Draft an investigation plan for a 70-year-old male with new onset cough and hemoptysis.',
          'Investigation plan for a 45-year-old with suspected autoimmune disorder, presenting with joint pains and rash.',
        ],
      },
      {
        type: 'management',
        label: 'Management Guidance',
        icon: Stethoscope,
        examples: [
          'Provide management guidance for a patient with uncontrolled hypertension and CKD.',
          'Management guidance for a 60-year-old with CHF exacerbation plus new AFib.',
        ],
      },
      {
        type: 'drug',
        label: 'Drug Regimen',
        icon: Pill,
        examples: [
          'Suggest a drug regimen for a new Type 2 diabetic with obesity & hyperlipidemia.',
          'Suggest a drug regimen for a 55-year-old with migraines & poorly controlled HTN.',
        ],
      },
    ];

    return (
      <div className="flex flex-col items-center pt-12 pb-16 px-4 h-full overflow-y-auto">
        {/* ✅ Canonical header */}
        <PageHeader title="Metrix AI Assistant" />

        <p className="text-lg text-gray-700 -mt-2 mb-8 max-w-xl text-center">
          Select a request type or ask anything below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl">
          {requestTypes.map(({ type, label, icon: Icon, examples }) => (
            <button
              key={type}
              onClick={() => {
                setRequestType(type);
                setExampleQueries(examples);
                setStage(2);
              }}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl bg-white text-gray-700 font-medium hover:shadow-lg hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <Icon className="w-8 h-8 mb-3 text-teal-600" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {renderDisclaimer(true)}
      </div>
    );
  }

  /* ---------- Stage 2 (examples) ---------- */

  function renderQueryScreen() {
    let heading = '';
    if (requestType === 'investigation')
      heading = 'Draft an investigation plan for a:';
    else if (requestType === 'management')
      heading = 'Provide management guidance for a:';
    else if (requestType === 'drug')
      heading = 'Suggest a drug regimen for a:';

    return (
      <div className="flex flex-col items-center pt-12 pb-12 px-4 h-full overflow-y-auto">
        {/* ✅ Canonical header */}
        <PageHeader title="Metrix AI Assistant" />

        <div className="-mt-2 w-full max-w-3xl text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">
            Try an example:
          </h2>
          <p className="mb-5 text-gray-600">{heading}</p>

          <div className="space-y-3">
            {exampleQueries.map((ex, idx) => (
              <button
                key={idx}
                className="w-full text-left p-3 border border-gray-200 rounded-lg cursor-pointer bg-white hover:bg-teal-50 hover:border-teal-200 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700"
                onClick={() => handleClickExample(ex)}
              >
                {ex}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStage(1)}
            className="mt-6 text-sm text-gray-500 hover:text-teal-600"
          >
            &larr; Back to request types
          </button>
        </div>

        {renderDisclaimer(false)}
      </div>
    );
  }

  /* ---------- Stage 3 (chat) ---------- */

  /* … your existing renderChatScreen() remains entirely unchanged … */

  /* ---------------------------------------------------------------------- */
  /*  Main render                                                           */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white via-teal-50 to-white">
      <div className="flex-1 overflow-y-auto">
        {stage === 1 && renderHomeScreen()}
        {stage === 2 && renderQueryScreen()}
        {stage === 3 && renderChatScreen()}
      </div>

      {/* Bottom input bar – no changes */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
          {stage === 3 && (
            <button
              onClick={handleClearChat}
              className={ghostButtonStyles}
              title="Clear Chat"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div className="relative flex-1">
            <input
              id="chat-input"
              type="text"
              className={formInputStyles}
              placeholder="Ask Metrix anything or type your query..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={messageIsStreaming}
            />
          </div>

          <button
            onClick={() => handleSendUserMessage(userInput)}
            disabled={messageIsStreaming || !userInput.trim()}
            className={`${primaryButtonStyles} px-4 py-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0`}
            title="Send message"
          >
            {messageIsStreaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticAssistancePage;
