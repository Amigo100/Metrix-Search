// file: /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
// • Three strict analysis calls with hard‑gated prompts
// • Conditional template‑aware recommendations
// • Automatic user‑sign‑off append
// • Build‑safe ChatInput props
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
} from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import HomeContext from '@/pages/api/home/home.context';
import { throttle } from '@/utils/data/throttle';
import { Message } from '@/types/chat';

import { ChatInput } from './ChatInput';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/* ── UI helpers ─────────────────────────────────────────── */
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

/* ── component ──────────────────────────────────────────── */
interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}
export const Chat = memo(function Chat({ stopConversationRef }: Props): JSX.Element {
  /* global ctx */
  const {
    state: { modelError, loading, prompts, userContext, userSignOff },
    dispatch,
  } = useContext(HomeContext);

  /* local state */
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [errorsTxt, setErrorsTxt] = useState('');
  const [termsTxt, setTermsTxt] = useState('');
  const [recsTxt, setRecsTxt] = useState('');

  const [errOpen, setErrOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [recsOpen, setRecsOpen] = useState(true);

  const activeTemplate = 'ED Triage Note'; // could be stateful dropdown
  const activeModel = 'GPT-4';

  /* scrolling */
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollDown = throttle(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
  useEffect(scrollDown, [clinicalDoc, errorsTxt, termsTxt, recsTxt]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = () =>
      setAutoScroll(el.scrollTop + el.clientHeight >= el.scrollHeight - 70);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, []);

  /* API helper */
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const ask = (message: string, mode: 'scribe' | 'analysis') =>
    axios.post(`${API}/rag/ask_rag`, { message, mode, model_name: activeModel })
         .then(r => (r.data.response as string).trim());

  /* ── Prompt builders ───────────────────────────── */
  const docPrompt = (raw: string, tplContent: string) => `
You are a clinical scribe generating a **${activeTemplate}**.

Output **Markdown only** and replicate the template headings exactly.

Template:
---------
${tplContent}

Transcript:
-----------
${raw}

${userContext ? `User Context:\n${userContext}` : ''}`.trim();

  const errPrompt = (doc: string, raw: string) => `
Compare each word/phrase in the **transcript** against the **document**.
List items where spelling/term differs significantly (≥2 letters),
or where a drug/dose looks wrong.

Return **ONLY** a numbered list in Markdown:

1. misheard >>> likely?
2. ...

If no mismatches, return the single word **NONE**.
If you output anything else you will be graded 0.

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const termsPrompt = (doc: string, raw: string) => `
Identify clinical diagnoses, medications or key terms that are **inferred**
(not verbatim) in the document compared with the transcript.

Return **ONLY** Markdown bullets:

- Term — brief rationale
- ...

If none, return **NONE**.

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const recsPrompt = (doc: string) => {
    const adviceBlock =
      activeTemplate.toLowerCase().includes('triage')
        ? `Focus on **initial work‑up**: investigations, bedside exams, scoring tools, early imaging, initial management.`
        : `Focus on **discharge planning**: follow‑up, home meds, patient education / safety‑net.`;
    return `
You are the treating doctor.

${adviceBlock}

Return Markdown with these EXACT headings only (in this order) and bullet
points under each. Do NOT add any other sections or re‑state errors/terms.

### Investigations
### Scoring Tools
### Imaging
### Management / Follow‑up
### Safety‑net

If a heading has no items write "- None".

Document:
---------
${doc}`.trim();
  };

  /* ── analysis pipeline ─────────────────────────── */
  const analyseAll = async (doc: string, raw: string) => {
    dispatch({ type: 'change', field: 'loading', value: true });
    try {
      const [e, t, r] = await Promise.all([
        ask(errPrompt(doc, raw),   'analysis'),
        ask(termsPrompt(doc, raw), 'analysis'),
        ask(recsPrompt(doc),       'analysis'),
      ]);

      setErrorsTxt(e === 'ERROR' ? '' : e);
      setTermsTxt( t === 'ERROR' ? '' : t);
      setRecsTxt(  r === 'ERROR' ? '' : r);
    } catch (err: any) {
      dispatch({ type: 'change', field: 'modelError', value: { message: err.message } });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* ── create doc ────────────────────────────────── */
  const createDoc = async (raw: string) => {
    dispatch({ type: 'change', field: 'loading', value: true });
    try {
      setTranscript(raw);
      setClinicalDoc('');
      setErrorsTxt('');
      setTermsTxt('');
      setRecsTxt('');
      const tpl = prompts.find(p => p.name === activeTemplate)?.content ?? '';
      const base = await ask(docPrompt(raw, tpl), 'scribe');

      /* re‑read sign‑off each time in case user just saved profile */
      const signOff = (userSignOff || '').trim();
      const doc = signOff ? `${base}\n\n---\n${signOff}` : base;
      setClinicalDoc(doc);

      await analyseAll(doc, raw);
    } catch (err: any) {
      dispatch({ type: 'change', field: 'modelError', value: { message: err.message } });
    }
  };

  /* ── card ───────────────────────────────────────── */
  const Card = ({
    title, open, setOpen, content,
  }: {
    title: string; open: boolean; setOpen: (b: boolean)=>void; content: string;
  }) =>
    content === 'ERROR' || content === '' ? null : (
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
            {!loading && (
              <ReactMarkdown
                className="prose prose-sm"
                remarkPlugins={[remarkGfm]}
                /* strip any rogue headings */
                children={content.replace(/^#+.*/gm, '').trim()}
              />
            )}
          </div>
        )}
      </div>
    );

  /* ── main content ───────────────────────────────── */
  const Main = !transcript ? (
    <div className="text-center py-10 text-gray-500">
      Paste or dictate a transcript to begin.
    </div>
  ) : (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Document */}
      <div className="flex-1 bg-white border rounded shadow p-4 overflow-auto">
        {loading && !clinicalDoc ? (
          <Loading text="Generating…" />
        ) : (
          <ReactMarkdown className="prose prose-sm" remarkPlugins={[remarkGfm]}>
            {clinicalDoc}
          </ReactMarkdown>
        )}
      </div>
      {/* Analysis */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <Card title="Potential Transcription Errors" open={errOpen}   setOpen={setErrOpen}   content={errorsTxt} />
        <Card title="Inferred Clinical Terms"        open={termsOpen} setOpen={setTermsOpen} content={termsTxt} />
        <Card title="Recommendations"                open={recsOpen}  setOpen={setRecsOpen}  content={recsTxt} />
      </div>
    </div>
  );

  /* ── render ─────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen">
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50">
        {Main}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-white">
        <ChatInput
          stopConversationRef={stopConversationRef}
          textareaRef={null}
          onSend={(m: Message) => createDoc(m.content)}
          onRegenerate={() => analyseAll(clinicalDoc, transcript)}
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
