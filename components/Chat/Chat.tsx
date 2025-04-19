// file: /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
// v2.5.1 – tighter prompts for real transcription errors & true inferences,
//           forbid note‑echo in Recommendations, native copy alert preserved,
//           regenerate button, follow‑up paging, sign‑off, logo – all intact
// -----------------------------------------------------------------------------

import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit,
  RotateCcw,
  AlertTriangle,
  Info,
  Loader2,
  X,
  FileText,
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
import { Message } from '@/types/chat';

import { ChatInput } from './ChatInput';
import { ChatTextToSpeech } from './ChatTextToSpeech';
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit';

import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/* ---------------------------------------------------------------- constants */
const primaryButtonStyles =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition disabled:opacity-70 disabled:cursor-not-allowed';
const secondaryButtonStyles =
  'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed';
const ghostButtonStyles =
  'inline-flex items-center justify-center p-2 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed';

const SCRIBE_DISCLAIMER_TEXT =
  'Metrix AI generates documentation based on input. Review for accuracy before finalising. Does not replace clinical judgment.';

/* --------------------------- API helper ------------------------- */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const ASK_RAG_URL = `${API_BASE_URL}/rag/ask_rag`;

/* ---------------------- helper components ---------------------- */
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
      Clinical Scribe Assistant
    </h1>
  </header>
);

const ErrorBanner = ({ err }: { err: string | null }) =>
  err ? (
    <div className="px-4 pt-4 md:px-6">
      <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm max-w-3xl mx-auto">
        <AlertTriangle size={18} className="flex-shrink-0 text-red-500" />
        <span className="text-sm">{err}</span>
      </div>
    </div>
  ) : null;

const LoadingIndicator = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center space-x-2 text-gray-500 py-4 text-sm">
    <Loader2 size={16} className="animate-spin" />
    <span className="italic">{text}</span>
  </div>
);

const InfoPlaceholder = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 italic p-4 text-center">
    <Info size={24} className="mb-2 opacity-80" />
    <span className="text-sm">{text}</span>
  </div>
);

/* ---------- Collapsible Card ---------- */
interface CardProps {
  title: string;
  collapsed: boolean;
  toggle: () => void;
  loadingShown: boolean;
  content: string;
  emptyText: string;
  extraHeader?: ReactNode;
}
const Card: React.FC<CardProps> = ({
  title,
  collapsed,
  toggle,
  loadingShown,
  content,
  emptyText,
  extraHeader,
}) => (
  <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-shrink-0">
    <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Info size={16} /> {title}
      </h3>
      <div className="flex items-center gap-1">
        {extraHeader}
        <button onClick={toggle} className={ghostButtonStyles}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
    </div>
    {!collapsed && (
      <div className="flex-1 overflow-auto p-4 text-sm">
        {loadingShown && <LoadingIndicator text="Processing…" />}
        {!loadingShown && content && (
          <ReactMarkdown
            className="prose prose-sm max-w-none"
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        )}
        {!loadingShown && !content && <InfoPlaceholder text={emptyText} />}
      </div>
    )}
  </div>
);

/* ----------------------------- component ---------------------- */
interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}
type OutputType = 'doc' | 'errors' | 'terms' | 'recs' | 'chat' | null;

interface ChatMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const Chat = memo(function Chat({ stopConversationRef }: Props) {
  const { t } = useTranslation('chat');

  /* ------------------- global context ------------------- */
  const {
    state: {
      modelError,
      loading,
      models,
      prompts,
      openModal,
      userContext,
      userSignOff,
    },
    dispatch,
  } = useContext(HomeContext);

  /* -------------------- local state --------------------- */
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');

  const [analysisErrors, setAnalysisErrors] = useState('');
  const [analysisTerms, setAnalysisTerms] = useState('');
  const [analysisRecs, setAnalysisRecs] = useState('');

  const [collapsedErr, setCollapsedErr] = useState(false);
  const [collapsedTerms, setCollapsedTerms] = useState(false);
  const [collapsedRecs, setCollapsedRecs] = useState(false);
  const [collapsedFU, setCollapsedFU] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResponses, setFollowUpResponses] = useState<string[]>([]);
  const [fuIndex, setFuIndex] = useState<number>(0);

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
    if (!loading && !followUpLoading) throttledScrollDown();
  }, [
    analysisRecs,
    analysisTerms,
    analysisErrors,
    followUpResponses,
    followUpLoading,
    loading,
    throttledScrollDown,
  ]);

  useEffect(() => {
    const area = chatContainerRef.current;
    if (!area) return;
    const handler = () => {
      setAutoScrollEnabled(
        area.scrollTop + area.clientHeight >= area.scrollHeight - 50,
      );
    };
    area.addEventListener('scroll', handler);
    return () => area.removeEventListener('scroll', handler);
  }, []);

  /* ========================================================================
     Helpers
  ======================================================================== */

  const appendSignOff = (doc: string): string =>
    `${doc.replace(/\s*$/, '')}\n\n---\n${userSignOff || 'Dr James Deighton MBBS'}`;

  /* -------- STEP 1: create clinical document -------- */
  const handleCreateDocFromTranscript = async (text: string) => {
    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });

      setClinicalDoc('');
      setAnalysisErrors('');
      setAnalysisTerms('');
      setAnalysisRecs('');
      setFollowUpResponses([]);
      setFuIndex(0);
      setChatHistory([]);
      setCollapsedErr(false);
      setCollapsedTerms(false);
      setCollapsedRecs(false);
      setCollapsedFU(false);
      setIsTranscriptExpanded(true);
      setLastOutputType('doc');

      const template = prompts.find(p => p.name === activeTemplateName);
      const templateContent =
        template?.content || '*No template set – free‑form note*';

      const docPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}
You are a helpful clinical scribe. Return **Markdown**.

Template:
---------
${templateContent}

Transcript / Input:
-------------------
${text}

Instructions:
• Populate the template accurately & concisely.
• Headings: use **bold** or Markdown #.
• Bullet lists with * or -.

Return only the completed note.`.trim();

      const docRes = await axios.post(ASK_RAG_URL, {
        message: docPrompt,
        history: [],
        mode: 'scribe',
        template_name: activeTemplateName,
        model_name: activeModelName,
      });

      const rawDoc = (docRes.data.response as string) || '';
      const finalDoc = appendSignOff(rawDoc);

      setClinicalDoc(finalDoc);
      setIsEditingDoc(false);

      /* prime chat history for follow‑ups */
      setChatHistory([
        {
          role: 'system',
          content:
            'You are Metrix AI. Follow‑up questions should refine or expand the previously generated document.',
        },
        { role: 'assistant', content: `Clinical Document:\n${finalDoc}` },
      ]);

      await handleTranscriptionErrors(finalDoc, text);
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to create document.' },
      });
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* -------- STEP 2: transcription errors -------- */
  const handleTranscriptionErrors = async (
    doc: string,
    rawTranscript: string,
  ) => {
    try {
      setLastOutputType('errors');
      const errorPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}
You are verifying **speech‑to‑text accuracy**.

RULES
1. wrongWord  = appears in Transcript (whole‑word).  
2. correctWord = appears in Clinical Document.  
3. They differ by ≥2 letters OR are homophones.  
4. Fabricated pairs are disallowed.  
5. Max 8 lines.

OUTPUT
If ≥1 pair:
## Potential Transcription Errors
* wrongWord → correctWord (short reason)

If none, output exactly:
None.

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}`.trim();

      const errorRes = await axios.post(ASK_RAG_URL, {
        message: errorPrompt,
        history: [],
        mode: 'analysis',
        model_name: activeModelName,
      });

      setAnalysisErrors(errorRes.data.response || 'None.');
      await handleInferTerms(doc, rawTranscript);
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to detect errors.' },
      });
    }
  };

  /* -------- STEP 3: inferred terms -------- */
  const handleInferTerms = async (doc: string, rawTranscript: string) => {
    try {
      setLastOutputType('terms');
      const termPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}
Find content in the *Clinical Document* that is **inferred, summarised, or
paraphrased**—NOT quoted verbatim from the Transcript.

EXCLUDE simple abbreviation expansions (NKDA → No Known Drug Allergies, etc.).

FORMAT
If ≥1 item:
## Inferred Clinical Terms
* "snippet from transcript" → "phrase in document"
(max 8 lines, each side ≤10 words)

If none, output exactly:
None.

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}`.trim();

      const termRes = await axios.post(ASK_RAG_URL, {
        message: termPrompt,
        history: [],
        mode: 'analysis',
        model_name: activeModelName,
      });

      setAnalysisTerms(termRes.data.response || 'None.');
      await handleRecommendations(doc);
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to infer terms.' },
      });
    }
  };

  /* -------- STEP 4: clinical recommendations -------- */
  const handleRecommendations = async (doc: string) => {
    try {
      setLastOutputType('recs');

      const noteType = activeTemplateName.toLowerCase();
      let headings = '';
      if (noteType.includes('triage')) {
        headings = `### Examination\n* …\n\n### Imaging\n* …\n\n### Laboratory\n* …\n\n### Disposition\n* …`;
      } else if (noteType.includes('discharge')) {
        headings = `### Follow‑up\n* …\n\n### Safety‑netting\n* …\n\n### Patient Advice\n* …`;
      } else {
        headings = `### Plan\n* …`;
      }

      const recPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}
Draft concise, specific next‑steps relevant for **${activeTemplateName}**.

RULES
• Use the headings supplied below.  
• Bullets ≤1 sentence each.  
• Do **NOT** re‑quote or duplicate the clinical document.  
• No transcription/QA advice.

RETURN:

## Recommendations
${headings}`.trim();

      const recRes = await axios.post(ASK_RAG_URL, {
        message: recPrompt,
        history: [],
        mode: 'analysis',
        model_name: activeModelName,
      });

      setAnalysisRecs(recRes.data.response || 'No recommendations.');
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to generate recommendations.' },
      });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* -------- follow‑up questions / refinement -------- */
  const handleFollowUp = async (msg: Message) => {
    const question = msg.content.trim();
    if (!question) return;
    const newHistory: ChatMsg[] = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    setFollowUpLoading(true);
    setCollapsedFU(false);

    try {
      const resp = await axios.post(ASK_RAG_URL, {
        message: question,
        history: newHistory.filter(m => m.role !== 'system'),
        mode: 'chat',
        model_name: activeModelName,
      });

      const answer = resp.data.response || 'Sorry, no answer.';
      setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
      setFollowUpResponses(prev => {
        const next = [...prev, answer];
        setFuIndex(next.length - 1);
        return next;
      });
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Follow‑up failed.' },
      });
    } finally {
      setFollowUpLoading(false);
    }
  };

  /* -------- initial input (transcript) -------- */
  const handleInitialInput = async (msg: Message) => {
    const text = msg.content.trim();
    if (!text) return;
    setTranscript(text);
    await handleCreateDocFromTranscript(text);
  };

  const handleRegenerate = async () => {
    if (!transcript) return;
    await handleCreateDocFromTranscript(transcript);
  };

  const docWordCount = clinicalDoc
    ? clinicalDoc.replace(/---\n[\s\S]*$/, '').trim().split(/\s+/).length
    : 0;

  const handleClearScribe = () => {
    setTranscript('');
    setClinicalDoc('');
    setAnalysisErrors('');
    setAnalysisTerms('');
    setAnalysisRecs('');
    setFollowUpResponses([]);
    setFuIndex(0);
    setChatHistory([]);
    setFollowUpLoading(false);
    setIsEditingDoc(false);
    setEditDocText('');
    setLastOutputType(null);
    dispatch({ type: 'change', field: 'modelError', value: null });
  };

  /* ========================================================================
     JSX
  ======================================================================== */

  const hasTranscript = Boolean(transcript);
  const errorMsg = (modelError as any)?.message || null;

  /* ---------------- landing vs working screens ---------------- */
  let mainContent: ReactNode;
  if (!hasTranscript && !loading && !modelError) {
    /* -------- landing screen -------- */
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

        <div className="mt-6 mb-4 px-4 max-w-3xl mx-auto text-center text-xs text-gray-500">
          <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
        </div>
      </>
    );
  } else {
    /* -------- transcript + outputs -------- */
    mainContent = (
      <>
        <ErrorBanner err={errorMsg} />

        {/* transcript */}
        {hasTranscript && (
          <div className="px-4 md:px-6 pt-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">
                Transcript
              </h2>
              <button
                onClick={() => setIsTranscriptExpanded(p => !p)}
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
                <FileText size={16} /> Clinical Document
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
                    title="Regenerate document"
                    onClick={handleRegenerate}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className={ghostButtonStyles}
                    title="Copy"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(clinicalDoc)
                        .then(() => alert('Copied to clipboard!'))
                        .catch(() => alert('Copy failed'))
                    }
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className={ghostButtonStyles}
                    title="Download PDF"
                    onClick={() =>
                      pdfMake
                        .createPdf({
                          content: clinicalDoc,
                          defaultStyle: { fontSize: 11 },
                        })
                        .download(
                          `Metrix_${activeTemplateName.replace(
                            /\s+/g,
                            '_',
                          )}_${new Date().toISOString().slice(0, 10)}.pdf`,
                        )
                    }
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className={ghostButtonStyles}
                    title={isEditingDoc ? 'Cancel' : 'Edit'}
                    onClick={() => {
                      setIsEditingDoc(p => !p);
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
                  onChange={e => setEditDocText(e.target.value)}
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
                    const cleaned = editDocText.replace(/\n?---\n[\s\S]*$/, '');
                    const savedDoc = appendSignOff(cleaned);
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

          {/* ---------------- right column ----------------- */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
            {/* a) Errors */}
            <Card
              title="Potential Transcription Errors"
              collapsed={collapsedErr}
              toggle={() => setCollapsedErr(p => !p)}
              loadingShown={loading && lastOutputType === 'errors'}
              content={analysisErrors}
              emptyText="No errors detected."
            />

            {/* b) Terms */}
            <Card
              title="Inferred Clinical Terms"
              collapsed={collapsedTerms}
              toggle={() => setCollapsedTerms(p => !p)}
              loadingShown={loading && lastOutputType === 'terms'}
              content={analysisTerms}
              emptyText="No inferred terms."
            />

            {/* c) Recommendations */}
            <Card
              title="Recommendations"
              collapsed={collapsedRecs}
              toggle={() => setCollapsedRecs(p => !p)}
              loadingShown={
                (loading && lastOutputType === 'recs') || followUpLoading
              }
              content={analysisRecs}
              emptyText="No recommendations."
            />

            {/* d) Follow‑ups */}
            <Card
              title="Follow‑up Responses"
              collapsed={collapsedFU}
              toggle={() => setCollapsedFU(p => !p)}
              loadingShown={followUpLoading}
              content={followUpResponses[fuIndex] || ''}
              emptyText="No follow‑up responses."
              extraHeader={
                followUpResponses.length > 0 && !collapsedFU ? (
                  <div className="flex items-center gap-1">
                    <button
                      disabled={fuIndex === 0}
                      onClick={() => setFuIndex(i => Math.max(0, i - 1))}
                      className={ghostButtonStyles}
                      title="Previous"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-gray-500">
                      {fuIndex + 1}/{followUpResponses.length}
                    </span>
                    <button
                      disabled={fuIndex === followUpResponses.length - 1}
                      onClick={() =>
                        setFuIndex(i =>
                          Math.min(followUpResponses.length - 1, i + 1),
                        )
                      }
                      className={ghostButtonStyles}
                      title="Next"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : null
              }
            />
          </div>
        </div>

        {/* disclaimer */}
        <div className="mt-6 mb-4 px-4 max-w-3xl mx-auto text-xs text-gray-500">
          <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
        </div>
      </>
    );
  }

  /* ----------------------------- render ---------------------------- */
  return (
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">
      {/* Top bar */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-3 bg-white shadow-sm">
        {/* Template dropdown */}
        <div className="relative">
          <button
            className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`}
            onClick={() => setShowTemplatesDropdown(p => !p)}
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
              {prompts.map(p => (
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

        {/* Model dropdown */}
        <div className="relative">
          <button
            className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`}
            onClick={() => setShowModelsDropdown(p => !p)}
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

      {/* Scrollable content */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto flex flex-col"
      >
        <ScribeHeader />
        {mainContent}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* Bottom input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm z-20">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
          {hasTranscript && (
            <button
              onClick={handleClearScribe}
              className={ghostButtonStyles}
              title="Clear Session"
            >
              <Trash2 size={18} />
            </button>
          )}
          <div className="flex-1">
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={inputRef}
              onSend={hasTranscript ? handleFollowUp : handleInitialInput}
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
                  ? 'Ask follow‑up questions…'
                  : 'Type summary, notes, or command…'
              }
              showRegenerateButton={
                hasTranscript && !loading && !followUpLoading
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
