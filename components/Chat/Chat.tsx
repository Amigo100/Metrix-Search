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

const ScribeHeader = () => (
  <header className="flex flex-col items-center justify-center text-center pt-6 pb-4 md:pt-8 md:pb-6 px-4">
    <img
      src="/MetrixAI.png"
      alt="Metrix Logo"
      width={56}
      height={56}
      className="mb-3"
    />
    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
      Clinical Scribe Assistant
    </h1>
  </header>
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
      userContext, // NEW
      userSignOff, // NEW
    },
    dispatch,
  } = useContext(HomeContext);

  /* -------------------- local state --------------------- */
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] =
    useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);

  /* -------------------- refs & scrolling ---------------- */
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const throttledScrollDown = throttle(() => {
    if (!autoScrollEnabled) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 250);

  useEffect(() => {
    if (clinicalDoc || analysis || loading) throttledScrollDown();
  }, [clinicalDoc, analysis, loading, throttledScrollDown]);

  useEffect(() => {
    const area = chatContainerRef.current;
    if (!area) return;
    const handler = () => {
      const atBottom =
        area.scrollTop + area.clientHeight >= area.scrollHeight - 50;
      setAutoScrollEnabled(atBottom);
    };
    area.addEventListener('scroll', handler);
    return () => area.removeEventListener('scroll', handler);
  }, []);

  /* ========================================================================
     Helpers
  ======================================================================== */

  /* -------- create clinical document -------- */
  const handleCreateDocFromTranscript = async (text: string) => {
    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });

      setClinicalDoc('');
      setAnalysis('');
      setIsTranscriptExpanded(true);
      setLastOutputType(null);

      const template = prompts.find((p) => p.name === activeTemplateName);
      const templateContent =
        template?.content ||
        'Default template: structure the note into clear headings.';

      /* ---- build prompt with userContext ---- */
      const docPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}
You are a helpful clinical scribe AI. Return output in **Markdown**
(headings bold/** or #, bullet lists *, -).

Template:
---------
${templateContent}

Transcript / Input:
-------------------
${text}

Instructions: Fill the template. Ensure the final answer is Markdown.
      `.trim();

      const payload = {
        message: docPrompt,
        history: [],
        mode: 'scribe',
        template_name: activeTemplateName,
        model_name: activeModelName,
      };

      const res = await axios.post(ASK_RAG_URL, payload);
      const rawDoc = (res.data.response as string) || '';

      /* append sign‑off if available */
      const finalDoc = userSignOff ? `${rawDoc}\n\n---\n${userSignOff}` : rawDoc;

      setClinicalDoc(finalDoc);
      setIsEditingDoc(false);
      setLastOutputType('doc');

      await handleAnalyzeDoc(finalDoc, text);
    } catch (err: any) {
      console.error('[handleCreateDocFromTranscript]', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to create document.';
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: msg },
      });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* -------- analyse document -------- */
  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => {
    try {
      if (!loading) dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });

      const analysisPrompt = `
You are a clinical summariser focusing on:
1) **Potential transcription errors** (list)
2) **Inferred clinical terms** (list)
3) **Recommendations** (headings / lists)

Return result in **Markdown**.

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}
      `.trim();

      const res = await axios.post(ASK_RAG_URL, {
        message: analysisPrompt,
        history: [],
        mode: 'analysis',
        model_name: activeModelName,
      });

      setAnalysis(res.data.response || '');
      setLastOutputType('analysis');
    } catch (err: any) {
      console.error('[handleAnalyzeDoc]', err);
      const msg =
        err.response?.data?.detail || err.message || 'Failed to analyse.';
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: msg },
      });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* -------- initial or follow‑up input -------- */
  const handleInitialInput = async (msg: Message) => {
    const text = msg.content.trim();
    if (!text) return;
    setTranscript(text);
    dispatch({ type: 'change', field: 'textInputContent', value: '' });
    await handleCreateDocFromTranscript(text);
  };

  const handleSendFollowUp = async (msg: Message) => {
    console.log('Follow‑up:', msg.content);
    alert('Follow‑up flow not implemented.');
    dispatch({ type: 'change', field: 'textInputContent', value: '' });
  };

  /* -------- regenerate -------- */
  const handleRegenerate = async () => {
    if (lastOutputType === 'doc') {
      await handleCreateDocFromTranscript(transcript);
    } else if (lastOutputType === 'analysis') {
      await handleAnalyzeDoc(clinicalDoc, transcript);
    }
  };

  /* -------- misc helpers -------- */
  const docWordCount = clinicalDoc
    ? clinicalDoc.replace(/---\n[\s\S]*$/, '').trim().split(/\s+/).length
    : 0;

  const handleClearScribe = () => {
    setTranscript('');
    setClinicalDoc('');
    setAnalysis('');
    setIsEditingDoc(false);
    setEditDocText('');
    setLastOutputType(null);
    dispatch({ type: 'change', field: 'textInputContent', value: '' });
    dispatch({ type: 'change', field: 'modelError', value: null });
  };

  /* ========================================================================
     JSX sections (unchanged except we preserve sign‑off when saving edits)
  ======================================================================== */

  const hasTranscript = Boolean(transcript);
  const errorForDiv = modelError
    ? { message: (modelError as any)?.message || 'An unexpected error occurred.' }
    : null;

  /* ----------------------- mainContent decision ------------------------ */
  let mainContent: ReactNode;
  if (!hasTranscript && !loading && !modelError) {
    /* -------- initial screen -------- */
    mainContent = (
      <>
        <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
          Select a template and model, then start by recording audio, initiating
          a consultation, or typing your summary below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-3xl mx-auto">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <ChatTextToSpeech onSend={handleInitialInput} />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <ChatStartOfficeVisit onSend={handleInitialInput} />
          </div>
        </div>

        <ScribeDisclaimer centered />
      </>
    );
  } else {
    /* -------- transcript + results -------- */
    mainContent = (
      <>
        <ErrorMessageDivComponent error={errorForDiv} />

        {hasTranscript && (
          <div className="px-4 md:px-6 pt-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">
                Transcript
              </h2>
              <button
                onClick={() => setIsTranscriptExpanded((p) => !p)}
                className={ghostButtonStyles}
              >
                {isTranscriptExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>

            {isTranscriptExpanded && (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {transcript}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow px-4 md:px-6 pb-4 overflow-hidden">
          {/* ---------------- document panel --------------- */}
          <div className="flex-1 md:w-3/5 lg:w-2/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText size={16} />
                Clinical Document
                {docWordCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    {docWordCount} words
                  </span>
                )}
              </h3>

              {!loading && clinicalDoc && (
                <div className="flex items-center gap-2">
                  <button
                    className={ghostButtonStyles}
                    title="Copy"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(clinicalDoc)
                        .then(() => {
                          dispatch({
                            type: 'change',
                            field: 'modelError',
                            value: { message: 'Copied!' },
                          });
                          setTimeout(
                            () =>
                              dispatch({
                                type: 'change',
                                field: 'modelError',
                                value: null,
                              }),
                            1000,
                          );
                        })
                    }
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className={ghostButtonStyles}
                    title="Download PDF"
                    onClick={() =>
                      pdfMake
                        .createPdf({
                          content: clinicalDoc,
                          defaultStyle: { fontSize: 11 },
                        })
                        .download(
                          `Metrix_Scribe_${activeTemplateName.replace(/\s+/g, '_')}_${new Date()
                            .toISOString()
                            .slice(0, 10)}.pdf`,
                        )
                    }
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className={ghostButtonStyles}
                    title={isEditingDoc ? 'Cancel' : 'Edit'}
                    onClick={() => {
                      setIsEditingDoc((p) => !p);
                      setEditDocText(clinicalDoc);
                    }}
                  >
                    {isEditingDoc ? <X size={16} /> : <Edit size={16} />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 text-sm">
              {loading && lastOutputType === 'doc' && (
                <LoadingIndicator text="Generating document…" />
              )}

              {!loading && clinicalDoc && !isEditingDoc && (
                <ReactMarkdown
                  className="prose prose-sm max-w-none"
                  remarkPlugins={[remarkGfm]}
                >
                  {clinicalDoc}
                </ReactMarkdown>
              )}

              {!loading && isEditingDoc && (
                <textarea
                  className="w-full h-full border border-gray-300 rounded p-2 text-sm font-mono"
                  value={editDocText}
                  onChange={(e) => setEditDocText(e.target.value)}
                />
              )}

              {!loading && !clinicalDoc && (
                <InfoPlaceholder text="No document yet." />
              )}
            </div>

            {isEditingDoc && (
              <div className="bg-gray-50 border-t border-gray-200 flex gap-2 p-2">
                <button
                  className={secondaryButtonStyles}
                  onClick={() => {
                    /* ensure sign‑off remains (or gets added if missing) */
                    const cleaned = editDocText.replace(
                      /\n?---\n[\s\S]*$/,
                      '',
                    );
                    const savedDoc = userSignOff
                      ? `${cleaned}\n\n---\n${userSignOff}`
                      : cleaned;
                    setClinicalDoc(savedDoc);
                    setIsEditingDoc(false);
                  }}
                >
                  Save
                </button>
                <button
                  className={ghostButtonStyles}
                  onClick={() => setIsEditingDoc(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* ---------------- analysis panel --------------- */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[300px]">
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Info size={16} />
                AI Analysis
              </h3>
            </div>

            <div className="flex-1 overflow-auto p-4 text-sm">
              {loading && lastOutputType === 'analysis' && (
                <LoadingIndicator text="Analyzing…" />
              )}

              {!loading && analysis && (
                <ReactMarkdown
                  className="prose prose-sm max-w-none"
                  remarkPlugins={[remarkGfm]}
                >
                  {analysis}
                </ReactMarkdown>
              )}

              {!loading && !analysis && (
                <InfoPlaceholder text="No analysis yet." />
              )}
            </div>
          </div>
        </div>

        <ScribeDisclaimer />
      </>
    );
  }

  /* ----------------------------- render ---------------------------- */
  return (
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">
      {/* Top bar */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-3 bg-white shadow-sm">
        {/* template dropdown */}
        <div className="relative">
          <button
            className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`}
            onClick={() => setShowTemplatesDropdown((p) => !p)}
          >
            <span className="font-medium text-xs uppercase tracking-wide">
              Template:
            </span>{' '}
            {activeTemplateName}
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showTemplatesDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {prompts.map((p) => (
                <button
                  key={p.id}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => {
                    setActiveTemplateName(p.name);
                    setShowTemplatesDropdown(false);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* model dropdown */}
        <div className="relative">
          <button
            className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`}
            onClick={() => setShowModelsDropdown((p) => !p)}
          >
            <span className="font-medium text-xs uppercase tracking-wide">
              Model:
            </span>{' '}
            {activeModelName}
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showModelsDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showModelsDropdown && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {models.map((m: any) => (
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => {
                    setActiveModelName(m.name);
                    setShowModelsDropdown(false);
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* scrollable content */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col">
        <ScribeHeader />
        {mainContent}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* bottom input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm z-20">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
          {hasTranscript && (
            <button
              onClick={handleClearScribe}
              className={ghostButtonStyles}
              title="Clear Scribe Session"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div className="flex-1">
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={inputRef}
              onSend={hasTranscript ? handleSendFollowUp : handleInitialInput}
              onRegenerate={handleRegenerate}
              onScrollDownClick={() =>
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              showScrollDownButton={
                !autoScrollEnabled &&
                Boolean(
                  chatContainerRef.current &&
                    chatContainerRef.current.scrollHeight >
                      chatContainerRef.current.clientHeight + 50,
                )
              }
              placeholder={
                hasTranscript
                  ? 'Ask a follow‑up question…'
                  : 'Type summary, notes, or command…'
              }
              showRegenerateButton={
                hasTranscript && !loading && Boolean(clinicalDoc || analysis)
              }
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat;
