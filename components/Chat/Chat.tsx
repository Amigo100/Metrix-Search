// file: /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
// v2.5.3 – Fix typo in handleTranscriptionErrors where variables from
//          handleInferTerms were incorrectly used in the API call and
//          state update.
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
  'Metrix AI generates documentation based on input. Review for accuracy before finalising. Does not replace clinical judgment.';

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
      width={64}
      height={64}
      className="mb-3"
    />
    <h1 className="mt-3 text-2xl font-bold text-center">
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
    {/* Card Header */}
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
    {/* Card Content (Collapsible) */}
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
  const [transcriptTokens, setTranscriptTokens] = useState<TranscriptToken[]>([]);
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');

  const [analysisErrors, setAnalysisErrors] = useState(''); // State for transcription errors
  const [analysisTerms, setAnalysisTerms] = useState(''); // State for inferred clinical terms
  const [analysisRecs, setAnalysisRecs] = useState(''); // State for recommendations

  // State for card collapse/expand
  const [collapsedErr, setCollapsedErr] = useState(false);
  const [collapsedTerms, setCollapsedTerms] = useState(false);
  const [collapsedRecs, setCollapsedRecs] = useState(false);
  const [collapsedFU, setCollapsedFU] = useState(false); // Follow-up card

  // State for follow-up chat functionality
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResponses, setFollowUpResponses] = useState<string[]>([]);
  const [fuIndex, setFuIndex] = useState<number>(0); // Index for navigating follow-up responses

  // UI state
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [isEditingDoc, setIsEditingDoc] = useState(false); // State for editing the clinical document
  const [editDocText, setEditDocText] = useState(''); // Text area content while editing
  const [activeTemplateName, setActiveTemplateName] =
    useState('ED Triage Note'); // Currently selected template
  const [activeModelName, setActiveModelName] = useState('GPT-4'); // Currently selected model
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false); // Template dropdown visibility
  const [showModelsDropdown, setShowModelsDropdown] = useState(false); // Model dropdown visibility
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null); // Tracks the last generated output type for loading indicators

  /* -------------------- refs & scrolling ---------------- */
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for the main scrollable area
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to scroll to the bottom
  const inputRef = useRef<HTMLTextAreaElement | null>(null); // Ref for the chat input textarea
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true); // Auto-scroll state

  // Throttled function to scroll to the bottom smoothly
  const throttledScrollDown = throttle(() => {
    if (!autoScrollEnabled) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 250);

  // Effect to scroll down when new content arrives or loading finishes
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

  // Effect to manage auto-scroll based on user scroll position
  useEffect(() => {
    const area = chatContainerRef.current;
    if (!area) return;
    const handler = () => {
      setAutoScrollEnabled(
        area.scrollTop + area.clientHeight >= area.scrollHeight - 50,
      );
    };
    area.addEventListener('scroll', handler);
    return () => area.removeEventListener('scroll', handler); // Cleanup listener
  }, []);

  /* ========================================================================
     Helpers
   ======================================================================== */

  // Appends the user's sign-off to the document
  const appendSignOff = (doc: string): string =>
    `${doc.replace(/\s*$/, '')}\n\n---\n${userSignOff || 'Dr James Deighton MBBS'}`;

  /* -------- STEP 1: create clinical document -------- */
  const handleCreateDocFromTranscript = async (text: string) => {
    try {
      // Reset state and show loading indicator
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
      setLastOutputType('doc'); // Indicate document generation is in progress

      const template = prompts.find(p => p.name === activeTemplateName);
      const templateContent =
        template?.content || '*No template set – free‑form note*';

      // Construct the prompt for document generation
      const docPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}
You are a helpful clinical scribe for doctors and nurses. You are to take a speech transcript, and apply this to a selected clinical note template with pre-filled headers. Ensure this is formatted appropriately, and take great care to retain accuracy, using as much information from the transcript as possible. Reword or structure this as expected in a professional clinical document of the selected type. Include plentiful detail regarding the patient's presenting complaint. Return **Markdown**.

Template:
---------
${templateContent}

Transcript / Input:
-------------------
${text}

Instructions:
• Populate the template accurately & concisely.
• Headings: use **bold** or Markdown #.
• Bullet lists with * or -.

Return only the completed note.`.trim();

      // API call to generate the document
      const docRes = await axios.post(ASK_RAG_URL, {
        message: docPrompt,
        history: [],
        mode: 'scribe',
        template_name: activeTemplateName,
        model_name: activeModelName,
      });

      const rawDoc = (docRes.data.response as string) || '';
      const finalDoc = appendSignOff(rawDoc); // Add sign-off

      setClinicalDoc(finalDoc);
      setIsEditingDoc(false); // Ensure edit mode is off

      // Prime chat history for potential follow-up questions
      setChatHistory([
        {
          role: 'system',
          content:
            'You are Metrix AI. Follow‑up questions should refine or expand the previously generated document.',
        },
        { role: 'assistant', content: `Clinical Document:\n${finalDoc}` },
      ]);

      // Proceed to the next step: analyze transcription errors
      await handleTranscriptionErrors(finalDoc, text); // Pass the generated doc and original transcript
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to create document.' },
      });
      dispatch({ type: 'change', field: 'loading', value: false }); // Hide loading on error
    }
  };

  /* -------- STEP 2: transcription errors – ROBUST NEW PROMPT -------------- */
  const handleTranscriptionErrors = async (
    doc: string, // The generated document
    rawTranscript: string, // The original transcript
  ) => {
    try {
      setLastOutputType('errors'); // Indicate error analysis is in progress

      // Construct the prompt for error detection
      const errorPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}

You are a medical documentation assistant, specialising in quality assurance.

TASK
From the transcript below, list any words or short phrases that appear to have been
    ● an **unknown acronym or abbreviation**,
    ● a **likely mis‑spelling / mis‑hearing** of a medical term, drug, test or anatomy, or
    ● a **legitimate word inserted out‑of‑context** with surrounding clinical content.

EXCLUSIONS
– Do NOT list obvious one‑letter typos (e.g. “teh” → “the”).
– Ignore background conversation, filler words (“uh‑huh”) and non‑clinical chit‑chat.
– Do NOT infer diagnoses or reasoning; this is purely lexical/semantic.

OUTPUT FORMAT
Return a plain bullet list, one line per potential error, using
\`• <source_phrase> → <potential_issue_description>\`
If no potential errors are found, return exactly:
\`(No potential errors identified)\`

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}`.trim();

      // API call for error analysis
      // FIX: Use errorPrompt, errorRes, and setAnalysisErrors
      const errorRes = await axios.post(ASK_RAG_URL, {
        message: errorPrompt, // Use the error prompt
        history: [],
        mode: 'analysis', // Use analysis mode
        model_name: activeModelName,
      });

      setAnalysisErrors(errorRes.data.response || 'None.'); // Update error state

      // Proceed to the next step: infer clinical terms
      await handleInferTerms(doc, rawTranscript); // Pass doc and transcript
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to analyze errors.' },
      });
      // Don't stop loading here, let subsequent steps handle it or the finally block
    }
  };

  /* -------- STEP 3: infer clinical terms (v2.5.2 prompt) -------- */
  const handleInferTerms = async (doc: string, rawTranscript: string) => {
    try {
      setLastOutputType('terms'); // Indicate term inference is in progress

      // Construct the prompt for inferring clinical terms
      const termPrompt = `
${userContext ? `USER CONTEXT:\n${userContext}\n\n` : ''}

You are a medical documentation assistant, specialising in quality assurance.

TASK
From the transcript below, list any words or short phrases that appear to have been
    ● an **unknown acronym or abbreviation**,
    ● a **likely mis‑spelling / mis‑hearing** of a medical term, drug, test or anatomy, or
    ● a **legitimate word inserted out‑of‑context** with surrounding clinical content.

EXCLUSIONS
– Do NOT list obvious one‑letter typos (e.g. “teh” → “the”).
– Ignore background conversation, filler words (“uh‑huh”) and non‑clinical chit‑chat.
– Do NOT infer diagnoses or reasoning; this is purely lexical/semantic.

OUTPUT FORMAT
Return a plain bullet list, one line per inferred term, using
\`• <source_phrase> → <corrected_term>\`
If no terms are inferred, return exactly:
\`(No inferred terms)\`

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}`.trim();

      // API call for term inference
      const termRes = await axios.post(ASK_RAG_URL, {
        message: termPrompt,
        history: [],
        mode: 'analysis',
        model_name: activeModelName,
      });

      setAnalysisTerms(termRes.data.response || 'None.'); // Update terms state

      // Proceed to the final step: generate recommendations
      await handleRecommendations(doc); // Pass the generated document
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to infer terms.' },
      });
      // Don't stop loading here
    }
  };

  /* -------- STEP 4: recommendations (unchanged) -------- */
  const handleRecommendations = async (doc: string) => {
    try {
      setLastOutputType('recs'); // Indicate recommendation generation is in progress

      const noteType = activeTemplateName.toLowerCase();
      let headings = ''; // Determine headings based on template type
      if (noteType.includes('triage')) {
        headings = `### Examination\n* …\n\n### Imaging\n* …\n\n### Laboratory\n* …\n\n### Disposition\n* …`;
      } else if (noteType.includes('discharge')) {
        headings = `### Follow‑up\n* …\n\n### Safety‑netting\n* …\n\n### Patient Advice\n* …`;
      } else {
        headings = `### Plan\n* …`;
      }

      // Construct the prompt for recommendations
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

      // API call for recommendations
      const recRes = await axios.post(ASK_RAG_URL, {
        message: recPrompt,
        history: [],
        mode: 'analysis',
        model_name: activeModelName,
      });

      setAnalysisRecs(recRes.data.response || 'No recommendations.'); // Update recommendations state
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to generate recommendations.' },
      });
    } finally {
      // This finally block ensures loading stops after all steps (or if an error occurred in recommendations)
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };


  /* -------- follow‑up questions / refinement (unchanged) -------- */
  const handleFollowUp = async (msg: Message) => {
    const question = msg.content.trim();
    if (!question) return; // Ignore empty input

    // Add user question to history and show loading
    const newHistory: ChatMsg[] = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    setFollowUpLoading(true);
    setCollapsedFU(false); // Expand follow-up card

    try {
      // API call for follow-up chat
      const resp = await axios.post(ASK_RAG_URL, {
        message: question,
        // Send relevant history (exclude system message)
        history: newHistory.filter(m => m.role !== 'system'),
        mode: 'chat', // Use chat mode
        model_name: activeModelName,
      });

      const answer = resp.data.response || 'Sorry, no answer.';

      // Add assistant response to history and responses list
      setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
      setFollowUpResponses(prev => {
        const next = [...prev, answer];
        setFuIndex(next.length - 1); // Set index to the newest response
        return next;
      });
    } catch (err: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Follow‑up failed.' },
      });
    } finally {
      setFollowUpLoading(false); // Hide follow-up loading indicator
    }
  };

  /* -------- initial input, regenerate, clear helpers (unchanged) -------- */

  // Handles the very first input (transcript or pasted text)
  const handleInitialInput = async (msg: Message) => {
    const text = msg.content.trim();
    if (!text) return;
  setTranscript(text);                       // keep string
  setTranscriptTokens(msg.tokens || []);     // NEW
  await handleCreateDocFromTranscript(text);
};

  // Regenerates the document and analyses based on the existing transcript
  const handleRegenerate = async () => {
    if (!transcript) return; // Need a transcript to regenerate
    await handleCreateDocFromTranscript(transcript); // Restart the process
  };

  // Calculate word count for the clinical document (excluding sign-off)
  const docWordCount = clinicalDoc
    ? clinicalDoc.replace(/---\n[\s\S]*$/, '').trim().split(/\s+/).length
    : 0;

  // Clears all state related to the current scribe session
  const handleClearScribe = () => {
    setTranscript('');
    setTranscriptTokens([]);  
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
    dispatch({ type: 'change', field: 'modelError', value: null }); // Clear any errors
  };

  const settings = getSettings();

  const renderToken = (t: TranscriptToken, i: number) => {
    if (!settings.highlightConfidence) return t.text;
    if (t.confidence < 0.60) return <span key={i} className="bg-red-300">{t.text}</span>;
    if (t.confidence < 0.80) return <span key={i} className="bg-yellow-300">{t.text}</span>;
    return t.text;
  };
  
  /* ========================================================================
     JSX
   ======================================================================== */

  const hasTranscript = Boolean(transcript); // Check if a transcript exists
  const errorMsg = (modelError as any)?.message || null; // Get error message if any

  /* ---------------- landing vs working screens ---------------- */
  let mainContent: ReactNode;
  if (!hasTranscript && !loading && !modelError) {
    /* -------- landing screen (no transcript yet) -------- */
    mainContent = (
      <>
        {/* Instructions */}
        <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto leading-relaxed">
          1&nbsp;·&nbsp;Choose a <strong>note template</strong> (edit or add your own in
          the&nbsp;<em>Templates</em> menu).<br />
          2&nbsp;·&nbsp;Capture the encounter:<br />
          &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;<strong>Dictation</strong>&nbsp;for single‑speaker narration<br />
          &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;<strong>Consultation</strong>&nbsp;for a two‑way patient conversation<br />
          &nbsp;&nbsp;&nbsp;&nbsp;(press again to stop) — or simply paste a transcript into the bar below.<br />
          3&nbsp;·&nbsp;Metrix AI will draft the document, recommendations &amp; QA panels, which you
          can <em>copy, download, or edit</em>.<br />
          4&nbsp;·&nbsp;Ask follow‑up questions in the bottom bar any time to refine the output.
        </p>

        {/* Input method buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-3xl mx-auto">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <ChatTextToSpeech onSend={handleInitialInput} /> {/* Dictation */}
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <ChatStartOfficeVisit onSend={handleInitialInput} /> {/* Consultation */}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 mb-4 px-4 max-w-3xl mx-auto text-center text-xs text-gray-500">
          <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
        </div>
      </>
    );
  } else {
    /* -------- working screen (transcript exists or loading) -------- */
    mainContent = (
      <>
        <ErrorBanner err={errorMsg} /> {/* Display error if present */}

        {/* Transcript section */}
        {hasTranscript && (
          <div className="px-4 md:px-6 pt-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">
                Transcript
              </h2>
              {/* Transcript collapse/expand button */}
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

            {/* Transcript content */}
            {isTranscriptExpanded && (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {transcriptTokens.length
                  ? transcriptTokens.map(renderToken)
                  : transcript}
              </div>
            )}
          </div>
        )}

        {/* Main content area: Document panel (left) and Analysis panels (right) */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow px-4 md:px-6 pb-4 overflow-hidden">

          {/* ---------------- document panel (Left) --------------- */}
          <div className="flex-1 md:w-3/5 lg:w-2/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Document Header */}
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText size={16} /> Clinical Document
                {/* Word count */}
                {docWordCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    {docWordCount} words
                  </span>
                )}
              </h3>
              {/* Document action buttons (Regenerate, Copy, Download, Edit) */}
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
                        .then(() => alert('Copied to clipboard!')) // Consider a less intrusive notification
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
                          content: clinicalDoc, // Use Markdown content directly (pdfMake handles basic Markdown)
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
                      setIsEditingDoc(p => !p); // Toggle edit mode
                      setEditDocText(clinicalDoc); // Load current doc into editor
                    }}
                  >
                    {isEditingDoc ? <X size={16} /> : <Edit size={16} />}
                  </button>
                </div>
              )}
            </div>

            {/* Document Content Area */}
            <div className="flex-1 overflow-auto p-4 text-sm">
              {/* Loading indicator for document generation */}
              {loading && lastOutputType === 'doc' && (
                <LoadingIndicator text="Generating document…" />
              )}

              {/* Display document (Read-only mode) */}
              {!loading && clinicalDoc && !isEditingDoc && (
                <ReactMarkdown
                  className="prose prose-sm max-w-none" // Tailwind prose styles for Markdown
                  remarkPlugins={[remarkGfm]} // GitHub Flavored Markdown support
                >
                  {clinicalDoc}
                </ReactMarkdown>
              )}

              {/* Display document editor (Edit mode) */}
              {!loading && isEditingDoc && (
                <textarea
                  className="w-full h-full border border-gray-300 rounded p-2 text-sm font-mono" // Simple textarea for editing
                  value={editDocText}
                  onChange={e => setEditDocText(e.target.value)}
                />
              )}

              {/* Placeholder when no document is available */}
              {!loading && !clinicalDoc && (
                <InfoPlaceholder text="No document yet." />
              )}
            </div>

            {/* Save/Cancel buttons for Edit mode */}
            {isEditingDoc && (
              <div className="bg-gray-50 border-t border-gray-200 flex gap-2 p-2">
                <button
                  className={secondaryButtonStyles}
                  onClick={() => {
                    // Remove existing sign-off before saving, then re-append
                    const cleaned = editDocText.replace(/\n?---\n[\s\S]*$/, '');
                    const savedDoc = appendSignOff(cleaned);
                    setClinicalDoc(savedDoc); // Update the main document state
                    setIsEditingDoc(false); // Exit edit mode
                  }}
                >
                  Save
                </button>
                <button
                  className={ghostButtonStyles}
                  onClick={() => setIsEditingDoc(false)} // Just exit edit mode, discard changes
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* ---------------- right column (Analysis Panels) ----------------- */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
            {/* a) Potential Transcription Errors Card */}
            <Card
              title="Potential Transcription Errors"
              collapsed={collapsedErr}
              toggle={() => setCollapsedErr(p => !p)}
              loadingShown={loading && lastOutputType === 'errors'} // Show loading only when this specific step runs
              content={analysisErrors}
              emptyText="No errors detected."
            />

            {/* b) Inferred Clinical Terms Card */}
            <Card
              title="Inferred Clinical Terms"
              collapsed={collapsedTerms}
              toggle={() => setCollapsedTerms(p => !p)}
              loadingShown={loading && lastOutputType === 'terms'} // Show loading for this step
              content={analysisTerms}
              emptyText="No inferred terms."
            />

            {/* c) Recommendations Card */}
            <Card
              title="Recommendations"
              collapsed={collapsedRecs}
              toggle={() => setCollapsedRecs(p => !p)}
              loadingShown={
                (loading && lastOutputType === 'recs') || followUpLoading // Show loading for this step OR follow-up loading
              }
              content={analysisRecs}
              emptyText="No recommendations."
            />

            {/* d) Follow‑up Responses Card */}
            <Card
              title="Follow‑up Responses"
              collapsed={collapsedFU}
              toggle={() => setCollapsedFU(p => !p)}
              loadingShown={followUpLoading} // Show loading only during follow-up API calls
              content={followUpResponses[fuIndex] || ''} // Display the currently selected response
              emptyText="No follow‑up responses."
              extraHeader={
                // Show pagination controls only if there are responses and card is expanded
                followUpResponses.length > 0 && !collapsedFU ? (
                  <div className="flex items-center gap-1">
                    <button
                      disabled={fuIndex === 0} // Disable prev if at first response
                      onClick={() => setFuIndex(i => Math.max(0, i - 1))}
                      className={ghostButtonStyles}
                      title="Previous"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-gray-500">
                      {fuIndex + 1}/{followUpResponses.length} {/* Page indicator */}
                    </span>
                    <button
                      disabled={fuIndex === followUpResponses.length - 1} // Disable next if at last response
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

        {/* Disclaimer (repeated at bottom for visibility) */}
        <div className="mt-6 mb-4 px-4 max-w-3xl mx-auto text-xs text-gray-500">
          <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
        </div>
      </>
    );
  }

  /* ----------------------------- render ---------------------------- */
  return (
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">
      {/* Top bar: Template and Model selection */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-3 bg-white shadow-sm">
        {/* Template dropdown */}
        <div className="relative">
          <button
            className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`} // Custom padding/gap
            onClick={() => setShowTemplatesDropdown(p => !p)} // Toggle dropdown
          >
            <span className="font-medium text-xs uppercase tracking-wide">
              Template:
            </span>{' '}
            {activeTemplateName} {/* Display selected template */}
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showTemplatesDropdown ? 'rotate-180' : '' // Rotate arrow on open
              }`}
            />
          </button>
          {/* Dropdown content */}
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {prompts.map(p => ( // Map through available prompts (templates)
                <button
                  key={p.id}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => {
                    setActiveTemplateName(p.name); // Set selected template
                    setShowTemplatesDropdown(false); // Close dropdown
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
            onClick={() => setShowModelsDropdown(p => !p)} // Toggle dropdown
          >
            <span className="font-medium text-xs uppercase tracking-wide">
              Model:
            </span>{' '}
            {activeModelName} {/* Display selected model */}
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showModelsDropdown ? 'rotate-180' : '' // Rotate arrow
              }`}
            />
          </button>
          {/* Dropdown content */}
          {showModelsDropdown && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {models.map((m: any) => ( // Map through available models
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => {
                    setActiveModelName(m.name); // Set selected model
                    setShowModelsDropdown(false); // Close dropdown
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable main content area */}
      <div
        ref={chatContainerRef} // Ref for scroll management
        className="flex-1 overflow-y-auto flex flex-col"
      >
        <ScribeHeader /> {/* App header */}
        {mainContent} {/* Either landing or working screen */}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" /> {/* Invisible element to scroll to */}
      </div>

      {/* Bottom input bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm z-20">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
          {/* Clear session button (only shown after transcript exists) */}
          {hasTranscript && (
            <button
              onClick={handleClearScribe}
              className={ghostButtonStyles}
              title="Clear Session"
            >
              <Trash2 size={18} />
            </button>
          )}
          {/* Chat input component */}
          <div className="flex-1">
            <ChatInput
              stopConversationRef={stopConversationRef} // Prop for stopping generation
              textareaRef={inputRef} // Ref for focusing
              onSend={hasTranscript ? handleFollowUp : handleInitialInput} // Send handler depends on state
              onRegenerate={handleRegenerate} // Regenerate handler
              onScrollDownClick={() => // Scroll down button handler
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              showScrollDownButton={ // Conditionally show scroll down button
                !autoScrollEnabled && // Only if auto-scroll is off
                Boolean( // And if content is scrollable
                  chatContainerRef.current &&
                    chatContainerRef.current.scrollHeight >
                      chatContainerRef.current.clientHeight + 50,
                )
              }
              placeholder={ // Placeholder text depends on state
                hasTranscript
                  ? 'Ask follow‑up questions…'
                  : 'Type summary, notes, or command…'
              }
              showRegenerateButton={ // Conditionally show regenerate button
                hasTranscript && !loading && !followUpLoading // Only if transcript exists and not loading
              }
            />
          </div>
        </div>
      </div>

      {/* Modals (conditionally rendered based on openModal state) */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
});

// Set display name for React DevTools
Chat.displayName = 'Chat';
export default Chat; // Export the component
