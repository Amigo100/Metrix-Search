// file: /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
//  • 3 dedicated analysis calls (Errors | Terms | Recommendations)
//  • Template‑aware prompts
//  • Collapsible cards
//  • Strict‑boolean JSX props (build‑safe)
// -----------------------------------------------------------------------------

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit,
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

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/* ───────────────────────── helpers ───────────────────── */
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

const InfoBox = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full text-gray-400 italic p-4">
    {text}
  </div>
);

/* ───────────────────────── component ─────────────────── */
interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}
type OutputType = 'doc' | 'analysis' | null;

export const Chat = memo(function Chat({ stopConversationRef }: Props): JSX.Element {
  /* ───── context ──── */
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

  /* ───── local state ──── */
  const [transcript,   setTranscript]   = useState('');
  const [clinicalDoc,  setClinicalDoc]  = useState('');
  const [errorsTxt,    setErrorsTxt]    = useState('');
  const [termsTxt,     setTermsTxt]     = useState('');
  const [recsTxt,      setRecsTxt]      = useState('');

  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [errOpen,  setErrOpen]  = useState(true);
  const [termsOpen,setTermsOpen]= useState(true);
  const [recsOpen, setRecsOpen] = useState(true);

  const [activeTemplate, setActiveTemplate] = useState('ED Triage Note');
  const [activeModel,    setActiveModel]    = useState('GPT-4');

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef       = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll]        = useState(true);

  /* ───── scrolling ──── */
  const scrollDown = throttle(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
  useEffect(() => { scrollDown(); }, [clinicalDoc, errorsTxt, termsTxt, recsTxt, scrollDown]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = () =>
      setAutoScroll(el.scrollTop + el.clientHeight >= el.scrollHeight - 50);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, []);

  /* ───── API helpers ──── */
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const askLLM   = (payload: any) => axios.post(`${API_BASE}/rag/ask_rag`, payload).then(r => r.data.response as string);

  /* ───── prompt builders ──── */
  const buildDocPrompt = (raw: string) => {
    const tpl = prompts.find(p => p.name === activeTemplate)?.content ?? '';
    return `
You are a clinical scribe creating a **${activeTemplate}**.  
Follow the template headings exactly.  
Return Markdown only.

Template:
---------
${tpl}

Transcript:
-----------
${raw}

${userContext ? `User Context:\n${userContext}` : ''}`.trim();
  };

  const buildErrPrompt = (doc: string, raw: string) => `
List only **potentially mis‑heard words** from the transcript vs document.

Format exactly:
1. misheard >>> likely?

No commentary, no extra sections.

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const buildTermsPrompt = (doc: string, raw: string) => `
From the transcript and document, infer clinical terms **NOT explicitly stated**.

Return Markdown bullet list:
- Term — reason

No recommendations.

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const buildRecsPrompt = (doc: string) => `
Act as the treating doctor.  
Note type = **${activeTemplate}**

If ED Triage Note ⇒ early investigations, scoring tools, imaging, initial mgmt.  
If Discharge Summary ⇒ follow‑up plan, home meds, safety‑net.

Return headings:
### Investigations
### Scoring Tools
### Imaging
### Management / Follow‑up
### Safety‑net

Use concise Markdown lists. Base on the document data.

Document:
---------
${doc}`.trim();

  /* ───── main flows ──── */
  const runAllAnalysis = async (doc: string, raw: string) => {
    try {
      dispatch({ type: 'change', field: 'loading', value: true });

      const [errs, terms, recs] = await Promise.all([
        askLLM({ message: buildErrPrompt(doc, raw),   mode: 'analysis', model_name: activeModel }),
        askLLM({ message: buildTermsPrompt(doc, raw), mode: 'analysis', model_name: activeModel }),
        askLLM({ message: buildRecsPrompt(doc),       mode: 'analysis', model_name: activeModel }),
      ]);

      setErrorsTxt(errs);
      setTermsTxt(terms);
      setRecsTxt(recs);
    } catch (e:any) {
      dispatch({ type: 'change', field: 'modelError', value: { message: e.message } });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  const createDoc = async (raw: string) => {
    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      setTranscript(raw);
      setClinicalDoc('');
      setErrorsTxt('');
      setTermsTxt('');
      setRecsTxt('');
      setErrOpen(true); setTermsOpen(true); setRecsOpen(true);

      const base = await askLLM({
        message: buildDocPrompt(raw),
        mode: 'scribe',
        template_name: activeTemplate,
        model_name: activeModel,
      });

      const docWithSign = userSignOff ? `${base}\n\n---\n${userSignOff}` : base;
      setClinicalDoc(docWithSign);

      await runAllAnalysis(docWithSign, raw);
    } catch (e:any) {
      dispatch({ type: 'change', field: 'modelError', value: { message: e.message } });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* ───── JSX helpers (cards) ──── */
  const Card = ({
    title,
    open,
    setOpen,
    content,
    loadingKey,
  }: {
    title: string;
    open: boolean;
    setOpen: (v: boolean) => void;
    content: string;
    loadingKey: keyof typeof loading | string; // dummy
  }) => (
    <div className="flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex-shrink-0">
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Info size={16} /> {title}
        </h3>
        <button className="p-1 text-gray-500" onClick={() => setOpen(!open)}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <div className="flex-1 overflow-auto p-4 text-sm">
          {loading && <Loading text="Analyzing…" />}
          {!loading && content && (
            <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          )}
          {!loading && !content && <InfoBox text="No data yet." />}
        </div>
      )}
    </div>
  );

  /* ───── mainContent ──── */
  const mainContent = !transcript ? (
    /* landing instructions omitted for brevity */
    <div className="text-center px-4 py-8 text-gray-600">
      Select a template then dictate, consult, or paste a transcript.
    </div>
  ) : (
    <div className="flex flex-col md:flex-row gap-6 px-4 pb-4">
      {/* Document panel */}
      <div className="flex-1 bg-white border rounded-lg shadow p-4">
        {loading && !clinicalDoc && <Loading text="Generating document…" />}
        {!loading && (
          <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
            {clinicalDoc}
          </ReactMarkdown>
        )}
      </div>

      {/* Analysis column */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <Card title="Potential Transcription Errors" open={errOpen}   setOpen={setErrOpen}   content={errorsTxt} loadingKey="err" />
        <Card title="Inferred Clinical Terms"        open={termsOpen} setOpen={setTermsOpen} content={termsTxt} loadingKey="terms" />
        <Card title="Recommendations"                open={recsOpen}  setOpen={setRecsOpen}  content={recsTxt} loadingKey="recs" />
      </div>
    </div>
  );

  /* ───── render ──── */
  return (
    <div className="flex flex-col h-screen">
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {mainContent}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <ChatInput
          stopConversationRef={stopConversationRef}
          textareaRef={null}
          onSend={(m: Message) => createDoc(m.content)}
          showRegenerateButton={!!transcript && !!clinicalDoc && !loading}
          showScrollDownButton={false}
          placeholder="Paste or dictate transcript…"
          onRegenerate={() => runAllAnalysis(clinicalDoc, transcript)}
        />
      </div>

      <ErrorBanner msg={modelError ? (modelError as any).message ?? null : null} />
    </div>
  );
});

export default Chat;
