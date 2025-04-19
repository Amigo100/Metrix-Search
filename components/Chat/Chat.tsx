// file: /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
//  Detailed template–aware prompts, collapsible analysis cards,
//  improved landing instructions, and build‑safe ErrorBanner component.
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

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/* ─────────────────────────────────────────── constants ─── */
const primaryButtonStyles =
  'inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed';
const secondaryButtonStyles =
  'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed';
const ghostButtonStyles =
  'inline-flex items-center justify-center p-2 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed';

const SCRIBE_DISCLAIMER_TEXT =
  'Metrix AI Clinical Scribe generates documentation based on input. Always review and verify documentation for accuracy and completeness before finalising in patient records. This tool does not replace clinical judgment.';

/* ─────────────────────────────────────────── helpers ─── */

// *** RENAMED: ErrorMessage → ErrorBanner ***
const ErrorBanner = ({ msg }: { msg: string | null }) =>
  msg ? (
    <div className="px-4 pt-4 md:px-6">
      <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm max-w-3xl mx-auto">
        <AlertTriangle size={18} />
        <span className="text-sm">{msg}</span>
      </div>
    </div>
  ) : null;

const Loading = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center space-x-2 text-gray-500 py-4 text-sm">
    <Loader2 size={16} className="animate-spin" />
    <span className="italic">{text}</span>
  </div>
);

const InfoBox = ({
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

const Header = () => (
  <header className="flex flex-col items-center justify-center text-center pt-6 pb-4 md:pt-8 md:pb-6 px-4">
    <img src="/MetrixAI.png" alt="Metrix Logo" width={56} height={56} className="mb-3" />
    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
      Clinical Scribe Assistant
    </h1>
  </header>
);

const Disclaimer = () => (
  <div className="mt-6 mb-4 px-4 max-w-3xl mx-auto text-xs text-gray-500 leading-relaxed text-center">
    <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
  </div>
);

/* ───────────────────────────────────────── component ─── */
interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}
type OutputType = 'doc' | 'analysis' | null;

export const Chat = memo(function Chat({ stopConversationRef }: Props): JSX.Element {
  const { t } = useTranslation('chat');

  /* ─────────── global state ────────── */
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

  /* ─────────── local state ─────────── */
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [analysisErrors, setAnalysisErrors] = useState('');
  const [analysisTerms, setAnalysisTerms] = useState('');
  const [analysisRecs, setAnalysisRecs] = useState('');

  // collapsible
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [termsExpanded, setTermsExpanded] = useState(true);
  const [recsExpanded, setRecsExpanded] = useState(true);

  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');

  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);

  /* refs & scrolling */
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollDown = throttle(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 250);

  useEffect(() => {
    if (clinicalDoc || analysis || loading) scrollDown();
  }, [clinicalDoc, analysis, loading, scrollDown]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () =>
      setAutoScroll(el.scrollTop + el.clientHeight >= el.scrollHeight - 50);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* ─────────── prompt helpers ─────────── */
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const ASK_RAG_URL = `${API}/rag/ask_rag`;

  const buildDocPrompt = (text: string) => {
    const tpl = prompts.find((p) => p.name === activeTemplateName)?.content ?? '';
    return `
System: You are an experienced clinical scribe producing a **${activeTemplateName}** for a doctor.

Rules:
1. Follow the **exact headings** from the template.  
2. Populate sections only with data from the transcript; leave blank if absent.  
3. Output **Markdown** (## headings, - bullet, * sub‑bullet).  
4. Append user sign‑off verbatim if provided.

Template (type: ${activeTemplateName}):
---------------------------------------
${tpl}

Transcript:
-----------
${text}

${userContext ? `Additional user context:\n${userContext}` : ''}
    `.trim();
  };

  const buildAnalysisPrompt = (doc: string, raw: string) => `
System: Review the transcript and document for accuracy and clinical value.

Return **Markdown** with these exact section titles:

## Potential Transcription Errors
• Format each as "1. misheard >>> likely?"  

## Inferred Clinical Terms
• Bullet each implied diagnosis/medication with brief rationale.

## Recommendations
• Act as the treating doctor, stage defined by template: **${activeTemplateName}**  
  – **ED Triage Note** → Investigations, scoring (e.g. Wells), imaging, initial mgmt.  
  – **Discharge Summary** → Follow‑up plan, home meds, safety‑net.  
• Use sub‑headings: ### Investigations, ### Scoring Tools, ### Imaging, ### Management / Follow‑up, ### Safety‑net.  
• Pull data from the note where possible and avoid irrelevant suggestions.

Transcript:
-----------
${raw}

Clinical Document:
------------------
${doc}`.trim();

  /* ─────────── main actions ─────────── */
  const createDocument = async (text: string) => {
    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      setTranscript(text);
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

      const { data } = await axios.post(ASK_RAG_URL, {
        message: buildDocPrompt(text),
        history: [],
        mode: 'scribe',
        template_name: activeTemplateName,
        model_name: activeModelName,
      });

      const rawDoc = data.response ?? '';
      const finalDoc = userSignOff ? `${rawDoc}\n\n---\n${userSignOff}` : rawDoc;
      setClinicalDoc(finalDoc);
      setLastOutputType('doc');

      await analyze(finalDoc, text);
    } catch (e: any) {
      dispatch({ type: 'change', field: 'modelError', value: { message: e.message } });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  const analyze = async (doc: string, raw: string) => {
    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      const { data } = await axios.post(ASK_RAG_URL, {
        message: buildAnalysisPrompt(doc, raw),
        history: [],
        mode: 'analysis',
        model_name: activeModelName,
      });
      setAnalysis(data.response ?? '');
      setLastOutputType('analysis');
    } catch (e: any) {
      dispatch({ type: 'change', field: 'modelError', value: { message: e.message } });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* ─────────── regenerate handler ─────────── */
  const regenerate = () => {
    if (lastOutputType === 'doc') createDocument(transcript);
    else if (lastOutputType === 'analysis') analyze(clinicalDoc, transcript);
  };

  /* ─────────── clear ─────────── */
  const clearAll = () => {
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
    setLastOutputType(null);
    dispatch({ type: 'change', field: 'modelError', value: null });
  };

  /* ─────────── parse analysis into sections ─────────── */
  useEffect(() => {
    if (!analysis) return;
    const errs = analysis.match(/## Potential Transcription Errors[\s\S]*/i);
    const terms = analysis.match(/## Inferred Clinical Terms[\s\S]*/i);
    const recs = analysis.match(/## Recommendations[\s\S]*/i);
    setAnalysisErrors(errs ? errs[0] : '');
    setAnalysisTerms(terms ? terms[0] : '');
    setAnalysisRecs(recs ? recs[0] : '');
  }, [analysis]);

  /* ─────────── doc word count ─────────── */
  const wordCount = clinicalDoc
    ? clinicalDoc.replace(/---\n[\s\S]*$/, '').trim().split(/\s+/).length
    : 0;

  /* ─────────── UI blocks (Landing, TranscriptBlock, DocPanel, AnalysisColumn) ─────────── */
  // … identical to previous message …

  /* landing screen */
  const Landing = (
    <>
      <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
        1️⃣ Pick a <strong>note template</strong> (top‑left).<br />
        2️⃣ Start <strong>Dictation</strong> (alone) or <strong>Consultation</strong> (with patient).<br />
        &nbsp;&nbsp;&nbsp;…or paste / type transcript in the bar below.<br />
        3️⃣ Click again to stop — <strong>avoid PHI</strong>.<br />
        4️⃣ Review the AI document + analysis cards. Copy, download, edit, or ask follow‑up.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-3xl mx-auto">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <ChatTextToSpeech onSend={(m) => createDocument(m.content)} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <ChatStartOfficeVisit onSend={(m) => createDocument(m.content)} />
        </div>
      </div>

      <Disclaimer />
    </>
  );

  const TranscriptBlock = (
    <div className="px-4 md:px-6 pt-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">Transcript</h2>
        <button onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)} className={ghostButtonStyles}>
          {isTranscriptExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {isTranscriptExpanded && (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
          {transcript}
        </div>
      )}
    </div>
  );

  const DocPanel = (
    <div className="flex-1 md:w-3/5 lg:w-2/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText size={16} />
          Clinical Document
          {wordCount > 0 && <span className="ml-2 text-xs text-gray-500">{wordCount} words</span>}
        </h3>
        {clinicalDoc && !loading && (
          <div className="flex items-center gap-2">
            <button
              className={ghostButtonStyles}
              title="Copy"
              onClick={() => navigator.clipboard.writeText(clinicalDoc)}
            >
              <Copy size={16} />
            </button>
            <button
              className={ghostButtonStyles}
              title="Download PDF"
              onClick={() =>
                pdfMake
                  .createPdf({ content: clinicalDoc, defaultStyle: { fontSize: 11 } })
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
                setIsEditingDoc(!isEditingDoc);
                setEditDocText(clinicalDoc);
              }}
            >
              {isEditingDoc ? <X size={16} /> : <Edit size={16} />}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 text-sm">
        {loading && lastOutputType === 'doc' && <Loading text="Generating document…" />}
        {!loading && clinicalDoc && !isEditingDoc && (
          <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
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
        {!loading && !clinicalDoc && <InfoBox text="No document yet." />}
      </div>

      {isEditingDoc && (
        <div className="bg-gray-50 border-t border-gray-200 flex gap-2 p-2">
          <button
            className={secondaryButtonStyles}
            onClick={() => {
              const cleaned = editDocText.replace(/\n?---\n[\s\S]*$/, '');
              const saved = userSignOff ? `${cleaned}\n\n---\n${userSignOff}` : cleaned;
              setClinicalDoc(saved);
              setIsEditingDoc(false);
            }}
          >
            Save
          </button>
          <button className={ghostButtonStyles} onClick={() => setIsEditingDoc(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  const AnalysisColumn = (
    <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
      {/* Errors */}
      <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 flex-shrink-0 overflow-hidden">
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Info size={16} />
            Potential Transcription Errors
          </h3>
          <button className={ghostButtonStyles} onClick={() => setErrorsExpanded(!errorsExpanded)}>
            {errorsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {errorsExpanded && (
          <div className="flex-1 overflow-auto p-4 text-sm">
            {loading && lastOutputType === 'analysis' && <Loading text="Analyzing…" />}
            {!loading && analysisErrors && (
              <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
                {analysisErrors}
              </ReactMarkdown>
            )}
            {!loading && !analysisErrors && <InfoBox text="No errors detected." />}
          </div>
        )}
      </div>

      {/* Terms */}
      <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 flex-shrink-0 overflow-hidden">
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Info size={16} />
            Inferred Clinical Terms
          </h3>
          <button className={ghostButtonStyles} onClick={() => setTermsExpanded(!termsExpanded)}>
            {termsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {termsExpanded && (
          <div className="flex-1 overflow-auto p-4 text-sm">
            {loading && lastOutputType === 'analysis' && <Loading text="Analyzing…" />}
            {!loading && analysisTerms && (
              <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
                {analysisTerms}
              </ReactMarkdown>
            )}
            {!loading && !analysisTerms && <InfoBox text="No inferred terms." />}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 flex-shrink-0 overflow-hidden">
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Info size={16} />
            Recommendations
          </h3>
          <button className={ghostButtonStyles} onClick={() => setRecsExpanded(!recsExpanded)}>
            {recsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {recsExpanded && (
          <div className="flex-1 overflow-auto p-4 text-sm">
            {loading && lastOutputType === 'analysis' && <Loading text="Analyzing…" />}
            {!loading && analysisRecs && (
              <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
                {analysisRecs}
              </ReactMarkdown>
            )}
            {!loading && !analysisRecs && <InfoBox text="No recommendations." />}
          </div>
        )}
      </div>
    </div>
  );

  /* mainContent selection */
  const mainContent: ReactNode =
    !transcript && !loading && !modelError ? (
      Landing
    ) : (
      <>
        <ErrorBanner msg={modelError ? (modelError as any).message ?? null : null} />

        {transcript && TranscriptBlock}

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow px-4 md:px-6 pb-4 overflow-hidden">
          {DocPanel}
          {AnalysisColumn}
        </div>

        <Disclaimer />
      </>
    );

  /* ─────────── JSX return ─────────── */
  return (
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">
      {/* Top bar */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-3 bg-white shadow-sm">
        {/* Template dropdown */}
        <div className="relative">
          <button className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`} onClick={() => setShowTemplates(!showTemplates)}>
            <span className="font-medium text-xs uppercase tracking-wide">Template:</span> {activeTemplateName}
            <ChevronDown size={16} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>
          {showTemplates && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {prompts.map((p) => (
                <button
                  key={p.id}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => {
                    setActiveTemplateName(p.name);
                    setShowTemplates(false);
                    if (transcript) createDocument(transcript);
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
          <button className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`} onClick={() => setShowModels(!showModels)}>
            <span className="font-medium text-xs uppercase tracking-wide">Model:</span> {activeModelName}
            <ChevronDown size={16} className={`transition-transform ${showModels ? 'rotate-180' : ''}`} />
          </button>
          {showModels && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {models.map((m: any) => (
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => {
                    setActiveModelName(m.name);
                    setShowModels(false);
                    if (transcript && clinicalDoc) analyze(clinicalDoc, transcript);
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
      <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col">
        <Header />
        {mainContent}
        <div ref={endRef} className="h-1 flex-shrink-0" />
      </div>

      {/* Bottom input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm z-20">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
          {transcript && (
            <button onClick={clearAll} className={ghostButtonStyles} title="Clear Scribe Session">
              <Trash2 size={18} />
            </button>
          )}

          <div className="flex-1">
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={inputRef}
              onSend={(m) => createDocument(m.content)}
              onRegenerate={regenerate}
              onScrollDownClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
              showScrollDownButton={
                !autoScroll &&
                containerRef.current &&
                containerRef.current.scrollHeight > containerRef.current.clientHeight + 50
              }
              placeholder={transcript ? 'Ask a follow‑up question…' : 'Paste or type a transcript…'}
              showRegenerateButton={transcript && !loading && Boolean(clinicalDoc || analysis)}
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
