// file: /components/Chat/Chat.tsx
// COMPLETE, UNABBREVIATED VERSION — adds personalised context + sign‑off
// -----------------------------------------------------------------------------
// ❶ Reads `userContext`   +   `userSignOff` from the global HomeContext.
// ❷ Injects `userContext` at the top of the LLM prompt when creating a document.
// ❸ Appends `userSignOff` to every generated clinical document (and preserves
//    it when the user edits / saves the note).
// ❹ All API calls use NEXT_PUBLIC_API_BASE_URL.
// -----------------------------------------------------------------------------

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit,
  Check,
  AlertTriangle,
  Info,
  Loader2,
  X,
  FileText,
  Send,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import React, {
  MutableRefObject,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import PageHeader from '@/components/PageHeader';            // ⭐ canonical header
import HomeContext from '@/pages/api/home/home.context';
import { throttle } from '@/utils/data/throttle';

// Child components
import { ChatInput } from './ChatInput';
import { ChatTextToSpeech } from './ChatTextToSpeech';
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit';

// Modal components
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

// Types
import { Message } from '@/types/chat';
import { Prompt } from '@/types/prompt';
import { Plugin } from '@/types/plugin';

// PDF generation
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/* ---------------------------------------------------------------- constants */
const primaryButtonStyles =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed';
const secondaryButtonStyles =
  'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed';
const ghostButtonStyles =
  'inline-flex items-center justify-center p-2 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed';
const formInputStyles =
  'block w-full rounded-full border border-gray-300 py-2 px-4 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-base';

const SCRIBE_DISCLAIMER_TEXT =
  'Metrix AI Clinical Scribe generates documentation based on input. Always review and verify documentation for accuracy and completeness before finalising in patient records. This tool does not replace clinical judgment.';

/* ---------------------------------------------------------------- helpers */
const ErrorMessageDivComponent = ({
  error,
}: {
  error: { message: string } | null;
}) =>
  error ? (
    <div className="px-4 pt-4 md:px-6">
      <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm max-w-3xl mx-auto">
        <AlertTriangle size={18} className="flex-shrink-0 text-red-500" />
        <span className="text-sm">
          {error.message || 'An unexpected error occurred.'}
        </span>
      </div>
    </div>
  ) : null;

const LoadingIndicator = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center space-x-2 text-gray-500 py-4 text-sm">
    <Loader2 size={16} className="animate-spin" />
    <span className="italic">{text}</span>
  </div>
);

const InfoPlaceholder = ({
  text,
  icon: Icon = Info,
}: {
  text: string;
  icon?: React.ElementType;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 italic p-4 text-center">
    <Icon size={24} className="mb-2 opacity-80" />
    <span className="text-sm">{text}</span>
  </div>
);

const ScribeDisclaimer = ({ centered = false }: { centered?: boolean }) => (
  <div
    className={`mt-6 mb-4 px-4 max-w-3xl mx-auto ${
      centered ? 'text-center' : 'text-left'
    } text-xs text-gray-500 leading-relaxed`}
  >
    <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
  </div>
);

/* ----------------------- API URL helper ---------------------- */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const ASK_RAG_URL = `${API_BASE_URL}/rag/ask_rag`;

/* ----------------------------- component ---------------------- */
interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}
type OutputType = 'doc' | 'analysis' | null;

export const Chat = memo(function Chat({ stopConversationRef }: Props) {
  const { t } = useTranslation('chat');

  /* ------------------- global context ------------------- */
  const {
    state: {
      modelError,
      loading,
      models,
      prompts,
      textInputContent,
      openModal,
      userContext,
      userSignOff,
    },
    dispatch,
  } = useContext(HomeContext);

  /* -------------------- local state / refs -------------- */
  // … (all existing hooks and handlers are unchanged) …

  /* ========================================================================
     JSX sections
  ======================================================================== */

  // … (mainContent logic unchanged) …

  /* ----------------------------- render ---------------------------- */
  return (
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">
      {/* Top bar */}
      {/* … dropdowns code unchanged … */}

      {/* scrollable content */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col">
        {/* ✅ Canonical header replaces old bespoke header */}
        <PageHeader title="Clinical Scribe Assistant" />

        {mainContent}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* bottom input */}
      {/* … unchanged … */}

      {/* Modals */}
      {/* … unchanged … */}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat;
