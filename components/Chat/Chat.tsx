// file: /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
// 3 parallel analysis calls; template‑aware prompts; collapsible cards;
// user sign‑off; strict boolean props; onScrollDownClick prop restored.
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

/* ---------- helpers ---------- */
const ErrorBanner = ({ msg }: { msg: string | null }) =>
  msg ? (
    <div className="px-4 pt-4">
      <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
        <AlertTriangle size={16} /> <span className="text-sm">{msg}</span>
      </div>
    </div>
  ) : null;

const Loading = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center py-4 text-gray-500 text-sm space-x-2">
    <Loader2 size={16} className="animate-spin" /> <span>{text}</span>
  </div>
);

const InfoBox = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full text-gray-400 italic p-3">
    {text}
  </div>
);

/* ---------- component ---------- */
interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}
export const Chat = memo(function Chat({ stopConversationRef }: Props): JSX.Element {
  const {
    state: {
      modelError,
      loading,
      models,
      prompts,
      userContext,
      userSignOff,
    },
    dispatch,
  } = useContext(HomeContext);

  /* ----- state ----- */
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');

  const [errorsTxt, setErrorsTxt] = useState('');
  const [termsTxt, setTermsTxt] = useState('');
  const [recsTxt, setRecsTxt] = useState('');

  const [errOpen, setErrOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [recsOpen, setRecsOpen] = useState(true);

  const [activeTemplate, setActiveTemplate] = useState('ED Triage Note');
  const [activeModel, setActiveModel] = useState('GPT-4');

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  /* ----- scroll helpers ----- */
  const scrollDown = throttle(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
  useEffect(scrollDown, [clinicalDoc, errorsTxt, termsTxt, recsTxt]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = () =>
      setAutoScroll(el.scrollTop + el.clientHeight >= el.scrollHeight - 50);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, []);

  /* ----- API helpers ----- */
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const ask = (msg: string, mode: string) =>
    axios
      .post(`${API}/rag/ask_rag`, { message: msg, mode, model_name: activeModel })
      .then(r => r.data.response as string);

  /* ----- prompts ----- */
  const docPrompt = (raw: string) => {
    const tpl = prompts.find(p => p.name === activeTemplate)?.content ?? '';
    return `
You are a clinical scribe creating a **${activeTemplate}**.

Follow template headings exactly and output Markdown only.

Template:
---------
${tpl}

Transcript:
-----------
${raw}

${userContext ? `User Context:\n${userContext}` : ''}`.trim();
  };

  const errPrompt = (doc: string, raw: string) => `
List only potentially mis‑heard words.

Format:
1. misheard >>> likely?

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const termsPrompt = (doc: string, raw: string) => `
List inferred clinical terms NOT explicitly stated.

- Term — rationale

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const recsPrompt = (doc: string) => `
Give clinical recommendations for **${activeTemplate}**.

Headings:
### Investigations
### Scoring Tools
### Imaging
### Management / Follow‑up
### Safety‑net

Document:
---------
${doc}`.trim();

  /* ----- flows ----- */
  const analyseAll = async (doc: string, raw: string) => {
    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      const [e, t, r] = await Promise.all([
        ask(errPrompt(doc, raw), 'analysis'),
        ask(termsPrompt(doc, raw), 'analysis'),
        ask(recsPrompt(doc), 'analysis'),
      ]);
      setErrorsTxt(e);
      setTermsTxt(t);
      setRecsTxt(r);
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
      const base = await ask(docPrompt(raw), 'scribe');
      const doc = userSignOff ? `${base}\n\n---\n${userSignOff}` : base;
      setClinicalDoc(doc);
      await analyseAll(doc, raw);
    } catch (e: any) {
      dispatch({ type: 'change', field: 'modelError', value: { message: e.message } });
    }
  };

  /* ----- JSX ----- */
  const Card = ({
    title,
    open,
    setOpen,
    content,
  }: {
    title: string;
    open: boolean;
    setOpen: (b: boolean) => void;
    content: string;
  }) => (
    <div className="flex flex-col bg-white border rounded shadow">
      <div className="flex justify-between items-center bg-gray-50 border-b px-3 py-1.5">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <Info size={14} /> {title}
        </h3>
        <button onClick={() => setOpen(!open)} className="text-gray-500 p-1">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <div className="p-3 text-sm overflow-auto max-h-60">
          {loading && !content ? <Loading text="Analyzing…" /> : null}
          {!loading && content && (
            <ReactMarkdown className="prose prose-sm" remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          )}
          {!loading && !content && <InfoBox text="No data." />}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      {/* scroll area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {!transcript ? (
          <div className="text-center py-10 text-gray-500">
            Select a template and paste / dictate a transcript.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 p-4">
            {/* doc */}
            <div className="flex-1 bg-white border rounded shadow p-4">
              {loading && !clinicalDoc ? <Loading text="Generating…" /> : null}
              {!loading && (
                <ReactMarkdown className="prose prose-sm" remarkPlugins={[remarkGfm]}>
                  {clinicalDoc}
                </ReactMarkdown>
              )}
            </div>
            {/* analysis */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <Card title="Potential Transcription Errors" open={errOpen}   setOpen={setErrOpen}   content={errorsTxt} />
              <Card title="Inferred Clinical Terms"        open={termsOpen} setOpen={setTermsOpen} content={termsTxt} />
              <Card title="Recommendations"                open={recsOpen}  setOpen={setRecsOpen}  content={recsTxt} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* input */}
      <div className="border-t p-3">
        <ChatInput
          stopConversationRef={stopConversationRef}
          textareaRef={null}
          onSend={(m: Message) => createDoc(m.content)}
          onRegenerate={() => analyseAll(clinicalDoc, transcript)}
          // FIX: onScrollDownClick required by prop type
          onScrollDownClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
          showScrollDownButton={false}
          showRegenerateButton={!!transcript && !!clinicalDoc && !loading}
          placeholder="Paste or dictate transcript…"
        />
      </div>

      <ErrorBanner msg={modelError ? (modelError as any).message ?? null : null} />
    </div>
  );
});
export default Chat;
