// file: /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
// ❶ Personalised context + sign‑off retained
// ❷ Landing screen instructions rewritten
// ❸ Prompts: template‑aware, doctor‑grade, detailed formatting rules
// ❹ 3 analysis cards collapsible, scrollable column
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

const SCRIBE_DISCLAIMER_TEXT =
  'Metrix AI Clinical Scribe generates documentation based on input. Always review and verify documentation for accuracy and completeness before finalising in patient records. This tool does not replace clinical judgment.';

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

/* --------------------------- API helper ------------------------- */
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
      openModal,
      userContext,
      userSignOff,
    },
    dispatch,
  } = useContext(HomeContext);

  /* -------------------- local state --------------------- */
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');

  const [analysisErrors, setAnalysisErrors] = useState('');
  const [analysisTerms, setAnalysisTerms] = useState('');
  const [analysisRecs, setAnalysisRecs] = useState('');

  // ==== UPDATE‑1  collapsible card states =============================
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [termsExpanded, setTermsExpanded] = useState(true);
  const [recsExpanded, setRecsExpanded] = useState(true);
  // ====================================================================

  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] =
    useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplatesDropdown, setShowTemplatesDropdown] =
    useState(false);
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
      setAutoScrollEnabled(
        area.scrollTop + area.clientHeight >= area.scrollHeight - 50,
      );
    };
    area.addEventListener('scroll', handler);
    return () => area.removeEventListener('scroll', handler);
  }, []);

  /* ------------------ parse analysis into sections ------------------- */
  useEffect(() => {
    if (!analysis) {
      setAnalysisErrors('');
      setAnalysisTerms('');
      setAnalysisRecs('');
      return;
    }
    const sections = { err: '', terms: '', recs: '' };
    analysis.split(/\n(?=##\s)/).forEach((chunk) => {
      if (/transcription error/i.test(chunk)) sections.err = chunk.trim();
      else if (/inferred/i.test(chunk)) sections.terms = chunk.trim();
      else if (/recommendation/i.test(chunk)) sections.recs = chunk.trim();
    });
    setAnalysisErrors(sections.err);
    setAnalysisTerms(sections.terms);
    setAnalysisRecs(sections.recs);
  }, [analysis]);

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
      setAnalysisErrors('');
      setAnalysisTerms('');
      setAnalysisRecs('');
      setErrorsExpanded(true);
      setTermsExpanded(true);
      setRecsExpanded(true);
      setIsTranscriptExpanded(true);
      setLastOutputType(null);

      const template = prompts.find((p) => p.name === activeTemplateName);
      const templateContent =
        template?.content ||
        'Default template: structure the note into clear headings.';

      // ==== UPDATE‑2  template‑aware, strict doc prompt =========
      const docPrompt = `
System: You are an experienced clinical scribe producing a **${activeTemplateName}** for a doctor.

Rules:
1. **Follow the exact headings** from the supplied template.  
2. Populate each section with concise, accurate information extracted *only* from the transcript.  
3. Do **not** invent data; if the transcript is silent, leave that heading blank.  
4. Return **Markdown** only (## for headings, bullet points \`-\`, sub‑points \`*\`).  
5. Append the provided user sign‑off verbatim at the end if present.

Template (type: ${activeTemplateName}):
---------------------------------------
${templateContent}

Transcript:
-----------
${text}

${userContext ? `\nAdditional user context:\n${userContext}\n` : ''}
      `.trim();
      // ======================================================

      const res = await axios.post(ASK_RAG_URL, {
        message: docPrompt,
        history: [], // memory handled server‑side
        mode: 'scribe',
        template_name: activeTemplateName,
        model_name: activeModelName,
      });

      const rawDoc = (res.data.response as string) || '';
      const finalDoc = userSignOff ? `${rawDoc}\n\n---\n${userSignOff}` : rawDoc;

      setClinicalDoc(finalDoc);
      setIsEditingDoc(false);
      setLastOutputType('doc');

      await handleAnalyzeDoc(finalDoc, text);
    } catch (err: any) {
      console.error('[handleCreateDocFromTranscript]', err);
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to create document.' },
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

      // ==== UPDATE‑3  rich, template‑sensitive analysis prompt =========
      const analysisPrompt = `
System: You are reviewing the transcript and the clinical document for accuracy and clinical value.

Return **Markdown** with these *exact* section titles:

## Potential Transcription Errors
• Format each as "1. misheard >>> likely?" (e.g. "Troponone >>> Troponin?").  
• Only include items you are reasonably unsure of.

## Inferred Clinical Terms
• List diagnoses, medications, or findings *implied* but not explicitly spoken.  
• Bullet each item with a short rationale.

## Recommendations
• Act **as the treating doctor** at the stage implied by the template type.  
• Template type = **${activeTemplateName}**.  
  – If this is an **ED Triage Note**: recommend immediate investigations, bedside tests, scoring systems (e.g. Wells), imaging, initial management.  
  – If this is a **Discharge Summary**: give follow‑up plan, home meds, safety‑net advice, and outpatient referrals.  
• Use sub‑headings: ### Investigations, ### Scoring Tools, ### Imaging, ### Management / Follow‑up, ### Safety‑net.  
• Pull values from the document where possible (e.g. compute Wells if info supplied).  
• No irrelevant or inappropriate suggestions.

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}
      `.trim();
      // ================================================================

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
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: err.message || 'Failed to analyse.' },
      });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* -------- initial input -------- */
  const handleInitialInput = async (msg: Message) => {
    const text = msg.content.trim();
    if (!text) return;
    setTranscript(text);
    await handleCreateDocFromTranscript(text);
  };

  /* -------- regenerate -------- */
  const handleRegenerate = async () => {
    if (lastOutputType === 'doc') {
      await handleCreateDocFromTranscript(transcript);
    } else if (lastOutputType === 'analysis') {
      await handleAnalyzeDoc(clinicalDoc, transcript);
    }
  };

  const docWordCount = clinicalDoc
    ? clinicalDoc.replace(/---\n[\s\S]*$/, '').trim().split(/\s+/).length
    : 0;

  const handleClearScribe = () => {
    setTranscript('');
    setClinicalDoc('');
    setAnalysis('');
    setAnalysisErrors('');
    setAnalysisTerms('');
    setAnalysisRecs('');
    setErrorsExpanded(true);
    setTermsExpanded(true);
    setRecsExpanded(true);
    setIsEditingDoc(false);
    setEditDocText('');
    setLastOutputType(null);
    dispatch({ type: 'change', field: 'modelError', value: null });
  };

  /* ========================================================================
     JSX
  ======================================================================== */

  const hasTranscript = Boolean(transcript);
  const errorForDiv = modelError
    ? { message: (modelError as any)?.message || 'An unexpected error occurred.' }
    : null;

  let mainContent: ReactNode;
  if (!hasTranscript && !loading && !modelError) {
    /* -------- landing screen -------- */
    mainContent = (
      <>
        {/* ==== UPDATE‑4  new instructional paragraph ==== */}
        <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
          1️⃣&nbsp;Pick a note template in the top‑left.<br />
          2️⃣&nbsp;Capture the encounter:<br />
          &nbsp;&nbsp;&nbsp;&nbsp;• Click <strong>Dictation</strong> when you’re alone.<br />
          &nbsp;&nbsp;&nbsp;&nbsp;• Click <strong>Consultation</strong> with the patient present.<br />
          &nbsp;&nbsp;&nbsp;&nbsp;• Or paste / type a transcript into the bar at the bottom.<br />
          3️⃣&nbsp;Click the button again to stop. <strong>No PHI please.</strong><br />
          4️⃣&nbsp;Wait for the AI to return the document plus three analysis cards. You can copy, download, edit, or ask follow‑up questions.
        </p>
        {/* =============================================== */}

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
    /* -------- transcript + outputs -------- */
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
          {/* (unchanged – omitted for brevity) */}

          {/* ----------------------------------------------------------------
             Analysis column – collapsible cards
             --------------------------------------------------------------- */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
            {/* a) Errors */}
            <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Info size={16} />
                  Potential Transcription Errors
                </h3>
                <button
                  onClick={() => setErrorsExpanded((p) => !p)}
                  className={ghostButtonStyles}
                  title={errorsExpanded ? 'Collapse' : 'Expand'}
                >
                  {errorsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {errorsExpanded && (
                <div className="flex-1 overflow-auto p-4 text-sm">
                  {loading && lastOutputType === 'analysis' && (
                    <LoadingIndicator text="Analyzing…" />
                  )}
                  {!loading && analysisErrors && (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none"
                      remarkPlugins={[remarkGfm]}
                    >
                      {analysisErrors}
                    </ReactMarkdown>
                  )}
                  {!loading && !analysisErrors && (
                    <InfoPlaceholder text="No errors detected." />
                  )}
                </div>
              )}
            </div>

            {/* b) Inferred terms */}
            <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Info size={16} />
                  Inferred Clinical Terms
                </h3>
                <button
                  onClick={() => setTermsExpanded((p) => !p)}
                  className={ghostButtonStyles}
                  title={termsExpanded ? 'Collapse' : 'Expand'}
                >
                  {termsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {termsExpanded && (
                <div className="flex-1 overflow-auto p-4 text-sm">
                  {loading && lastOutputType === 'analysis' && (
                    <LoadingIndicator text="Analyzing…" />
                  )}
                  {!loading && analysisTerms && (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none"
                      remarkPlugins={[remarkGfm]}
                    >
                      {analysisTerms}
                    </ReactMarkdown>
                  )}
                  {!loading && !analysisTerms && (
                    <InfoPlaceholder text="No inferred terms." />
                  )}
                </div>
              )}
            </div>

            {/* c) Recommendations */}
            <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Info size={16} />
                  Recommendations
                </h3>
                <button
                  onClick={() => setRecsExpanded((p) => !p)}
                  className={ghostButtonStyles}
                  title={recsExpanded ? 'Collapse' : 'Expand'}
                >
                  {recsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {recsExpanded && (
                <div className="flex-1 overflow-auto p-4 text-sm">
                  {loading && lastOutputType === 'analysis' && (
                    <LoadingIndicator text="Analyzing…" />
                  )}
                  {!loading && analysisRecs && (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none"
                      remarkPlugins={[remarkGfm]}
                    >
                      {analysisRecs}
                    </ReactMarkdown>
                  )}
                  {!loading && !analysisRecs && (
                    <InfoPlaceholder text="No recommendations." />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <ScribeDisclaimer />
      </>
    );
  }

  /* ----------------------------- render ---------------------------- */
  // (header, template/model dropdowns, footer, modals remain unchanged)
});

Chat.displayName = 'Chat';
export default Chat;
