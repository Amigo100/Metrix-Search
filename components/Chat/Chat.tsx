// /components/Chat/Chat.tsx
// -----------------------------------------------------------------------------
// 1 scribe call → document
// 1 analysis call → transcription errors
// 2 analysis calls → inferred terms & recommendations
// Each phase is isolated; UI cards update progressively.
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

/* ───────────────────────── helpers ───────────────────── */
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

/* ───────────────────────── component ─────────────────── */
interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(function Chat({ stopConversationRef }: Props): JSX.Element {
  const {
    state: { modelError, loading, prompts, userContext, userSignOff },
    dispatch,
  } = useContext(HomeContext);

  /* state */
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [errorsTxt, setErrorsTxt] = useState('');
  const [termsTxt, setTermsTxt] = useState('');
  const [recsTxt, setRecsTxt] = useState('');

  const [errOpen, setErrOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [recsOpen, setRecsOpen] = useState(true);

  const activeTemplate = 'ED Triage Note';
  const activeModel = 'GPT-4';

  /* scroll support */
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
    axios
      .post(`${API}/rag/ask_rag`, { message, mode, model_name: activeModel })
      .then((r) => r.data.response as string);

  /* Prompt builders */
  const docPrompt = (raw: string) => {
    const tpl = prompts.find((p) => p.name === activeTemplate)?.content ?? '';
    return `
You are a clinical scribe generating a **${activeTemplate}**.

Output **Markdown only**. Use the template headings exactly.

Template:
---------
${tpl}

Transcript:
-----------
${raw}

${userContext ? `User Context:\n${userContext}` : ''}`.trim();
  };

  const errPrompt = (doc: string, raw: string) => `
Identify words/phrases in the *transcript* that were likely mis‑transcribed
when creating the *document*.  

Return **ONLY** a numbered Markdown list, one line each:

1. misheard >>> likely?
2. ...

No headings, no additional commentary.

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const termsPrompt = (doc: string, raw: string) => `
List clinical diagnoses, medications, or key terms **implied but not explicitly
written** in the document.

Return **ONLY** Markdown bullets:

- Term — reason
- ...

No other sections, no recommendations.

Transcript:
-----------
${raw}

Document:
---------
${doc}`.trim();

  const recsPrompt = (doc: string) => `
You are the treating doctor. Note type = **${activeTemplate}**.

Provide additional recommendations **not already covered** in the plan.

Return Markdown with EXACTLY these five headings
(in this order) and bulleted items under each:

### Investigations
### Scoring Tools
### Imaging
### Management / Follow‑up
### Safety‑net

Do NOT output 'Inferred Terms' or 'Potential Errors'. Do NOT add extra headings.

Base suggestions strictly on the document content; avoid irrelevant advice.

Document:
---------
${doc}`.trim();

  /* analysis pipeline ------------------------------------------------------- */
  const analyseAll = async (doc: string, raw: string) => {
    dispatch({ type: 'change', field: 'loading', value: true });

    try {
      /* phase 1 – transcription errors */
      setErrorsTxt('');
      const errors = await ask(errPrompt(doc, raw), 'analysis');
      setErrorsTxt(errors.trim());

      /* phase 2 – inferred terms & recommendations (run in parallel) */
      setTermsTxt('');
      setRecsTxt('');
      const [terms, recs] = await Promise.all([
        ask(termsPrompt(doc, raw), 'analysis'),
        ask(recsPrompt(doc), 'analysis'),
      ]);
      setTermsTxt(terms.trim());
      setRecsTxt(recs.trim());
    } catch (e: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: e.message },
      });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  /* scribe pipeline --------------------------------------------------------- */
  const createDoc = async (raw: string) => {
    dispatch({ type: 'change', field: 'loading', value: true });

    try {
      /* reset UI */
      setTranscript(raw);
      setClinicalDoc('');
      setErrorsTxt('');
      setTermsTxt('');
      setRecsTxt('');

      /* LLM #1 – clinical document */
      const baseDoc = await ask(docPrompt(raw), 'scribe');
      const doc = userSignOff ? `${baseDoc}\n\n---\n${userSignOff}` : baseDoc;
      setClinicalDoc(doc);

      /* LLM #2 → #4 – analysis chain */
      await analyseAll(doc, raw);
    } catch (e: any) {
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: e.message },
      });
    }
  };

  /* card component */
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
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-500 p-1"
          aria-label={`Toggle ${title}`}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <div className="p-3 text-sm overflow-auto max-h-60">
          {loading && !content ? <Loading text="Analyzing…" /> : null}
          {!loading && content && (
            <ReactMarkdown
              className="prose prose-sm"
              remarkPlugins={[remarkGfm]}
            >
              {content}
            </ReactMarkdown>
          )}
          {!loading && !content && (
            <div className="text-gray-400 italic">No data.</div>
          )}
        </div>
      )}
    </div>
  );

  /* mainContent */
  const Main = !transcript ? (
    <div className="text-center py-10 text-gray-500">
      Paste or dictate a transcript to begin.
    </div>
  ) : (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* document */}
      <div className="flex-1 bg-white border rounded shadow p-4 overflow-auto">
        {loading && !clinicalDoc ? (
          <Loading text="Generating…" />
        ) : (
          <ReactMarkdown
            className="prose prose-sm"
            remarkPlugins={[remarkGfm]}
          >
            {clinicalDoc}
          </ReactMarkdown>
        )}
      </div>
      {/* analysis */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <Card
          title="Potential Transcription Errors"
          open={errOpen}
          setOpen={setErrOpen}
          content={errorsTxt}
        />
        <Card
          title="Inferred Clinical Terms"
          open={termsOpen}
          setOpen={setTermsOpen}
          content={termsTxt}
        />
        <Card
          title="Recommendations"
          open={recsOpen}
          setOpen={setRecsOpen}
          content={recsTxt}
        />
      </div>
    </div>
  );

  /* render */
  return (
    <div className="flex flex-col h-screen">
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {Main}
        <div ref={endRef} />
      </div>

      {/* input */}
      <div className="border-t p-3">
        <ChatInput
          stopConversationRef={stopConversationRef}
          textareaRef={null}
          onSend={(m: Message) => createDoc(m.content)}
          onRegenerate={() => analyseAll(clinicalDoc, transcript)}
          onScrollDownClick={() =>
            endRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
          showScrollDownButton={false}
          showRegenerateButton={!!transcript && !!clinicalDoc && !loading}
          placeholder="Paste or dictate transcript…"
        />
      </div>

      <ErrorBanner
        msg={modelError ? (modelError as any).message ?? null : null}
      />
    </div>
  );
});
export default Chat;
