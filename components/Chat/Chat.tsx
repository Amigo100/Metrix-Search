### 4️⃣  **/components/Chat/Chat.tsx**
```tsx
import React, {
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  MutableRefObject,
} from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'next-i18next';
import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit,
  IconCheck,
  IconChevronUp,
  IconHelpCircle,
  IconSettings,
  IconTemplate,
  IconCpu,
  IconInfoCircle,
  IconLoader2,
} from '@tabler/icons-react';

import { HomeContext } from '@/contexts/HomeContext';
import { throttle } from '@/utils/data/throttle';
import type { Conversation, Message, Role } from '@/types/chat';
import type { Prompt } from '@/types/prompt';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ChatInput } from '@/components/Chat/ChatInput';
import { ChatTextToSpeech } from '@/components/Chat/ChatTextToSpeech';
import { ChatStartOfficeVisit } from '@/components/Chat/ChatStartOfficeVisit';
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { ErrorMessageDiv } from '@/components/Chat/ErrorMessageDiv';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Local helper type ----------------------------------------------------------
type OutputType = 'doc' | 'analysis' | null;

interface ChatProps {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(function Chat({ stopConversationRef }: ChatProps) {
  const { t } = useTranslation('chat');
  const {
    state: {
      modelError,
      loading,
      openModal,
      models,
      prompts,
    },
    dispatch,
  } = useContext(HomeContext);

  // State --------------------------------------------------------------------
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Scroll helpers -----------------------------------------------------------
  const throttledScrollDown = throttle(() => {
    if (
      autoScrollEnabled &&
      messagesEndRef.current &&
      chatContainerRef.current
    ) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, 250);

  useEffect(() => {
    if (clinicalDoc || analysis || !loading) throttledScrollDown();
  }, [clinicalDoc, analysis, loading, throttledScrollDown]);

  useEffect(() => {
    const container = chatContainerRef.current;
    const onScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      setAutoScrollEnabled(scrollHeight - scrollTop - clientHeight < 80);
    };
    container?.addEventListener('scroll', onScroll);
    return () => container?.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScrollEnabled(true);
  };

  // Business logic -----------------------------------------------------------
  const handleCreateDocFromTranscript = async (text: string) => {
    const tpl = prompts.find((p) => p.name === activeTemplateName);
    const tplContent = tpl?.content ?? '';
    const docPrompt = `You are a helpful clinical scribe AI.\nTemplate:\n${tplContent}\nTranscript:\n${text}`;

    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });
      setClinicalDoc('');
      setAnalysis('');
      setIsTranscriptExpanded(false);

      const payload = { message: docPrompt, history: [], mode: 'scribe', template_name: activeTemplateName };
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'}/rag/ask_rag`, payload);
      const doc = data.response as string;
      setClinicalDoc(doc);
      setIsEditingDoc(false);
      setLastDocPrompt(docPrompt);
      setLastOutputType('doc');
      await handleAnalyzeDoc(doc, text);
    } catch (err) {
      console.error('[createDoc] →', err);
      dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to create document.' } });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  const handleAnalyzeDoc = async (doc: string, raw: string) => {
    const analysisPrompt = `You are a clinical summarizer.\nTranscript:\n${raw}\nClinical Document:\n${doc}`;

    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });

      const payload = { message: analysisPrompt, history: [], mode: 'analysis' };
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'}/rag/ask_rag`, payload);
      setAnalysis(data.response as string);
      setLastAnalysisPrompt(analysisPrompt);
    } catch (err) {
      console.error('[analysis] →', err);
      dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to analyze document.' } });
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false });
    }
  };

  const handleTranscriptReceived = (text: string) => {
    setTranscript(text);
    void handleCreateDocFromTranscript(text);
  };

  const handleRegenerate = async () => {
    dispatch({ type: 'change', field: 'modelError', value: null });
    setIsTranscriptExpanded(false);

    if (lastOutputType === 'doc' && transcript && lastDocPrompt) {
      await handleCreateDocFromTranscript(transcript);
    } else if (lastOutputType === 'analysis' && clinicalDoc && transcript && lastAnalysisPrompt) {
      await handleAnalyzeDoc(clinicalDoc, transcript);
    }
  };

  // Utilities ----------------------------------------------------------------
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;

  const handleCopyDoc = () => navigator.clipboard.writeText(clinicalDoc).catch(console.error);

  const handleDownloadPDF = () => {
    if (!clinicalDoc) return;
    const now = new Date();
    const ts = now.toISOString().replace(/[:T]/g, '-').split('.')[0];
    const definition = {
      content: [
        { text: 'Clinical Document', style: 'header', margin: [0, 0, 0, 10] },
        { text: clinicalDoc },
      ],
      styles: { header: { fontSize: 14, bold: true } },
    };
    pdfMake.createPdf(definition).download(`${ts}_ClinicalDocument.pdf`);
  };

  const handleSaveEdit = () => {
    setIsEditingDoc(false);
    setClinicalDoc(editDocText);
    if (transcript) void handleAnalyzeDoc(editDocText, transcript);
  };

  // Outside‑click for dropdowns ---------------------------------------------
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (
        templateDropdownRef.current &&
        !templateDropdownRef.current.contains(e.target as Node)
      )
        setShowTemplatesDropdown(false);
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node))
        setShowModelsDropdown(false);
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  // -------------------------------------------------------------------------
  const noTranscript = !transcript;

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-b from-white via-teal-50 to-gray-50 text-gray-900">
      {/* Top bar */}
      <div className="border-b border-gray-200 px-4 md:px-6 py-2 flex items-center justify-between gap-4 bg-white shadow-sm flex-wrap z-10">
        {/* Template dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" ref={templateDropdownRef}>
            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              onClick={() => setShowTemplatesDropdown((v) => !v)}
              aria-haspopup="true"
              aria-expanded={showTemplatesDropdown}
            >
              <IconTemplate size={16} className="mr-1.5 text-teal-600" />
              {`${t('Template')}: ${activeTemplateName}`}
              <IconChevronDown size={16} className={`ml-1.5 transition-transform ${showTemplatesDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showTemplatesDropdown && (
              <div className="absolute left-0 mt-1 w-60 rounded-md border border-gray-200 bg-white p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
                {prompts.map((p) => (
                  <button
                    key={p.id}
                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded"
                    onClick={() => {
                      setActiveTemplateName(p.name);
                      setShowTemplatesDropdown(false);
                      if (transcript) void handleCreateDocFromTranscript(transcript);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model dropdown */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              onClick={() => setShowModelsDropdown((v) => !v)}
              aria-haspopup="true"
              aria-expanded={showModelsDropdown}
            >
              <IconCpu size={16} className="mr-1.5 text-purple-600" />
              {`${t('Model')}: ${activeModelName}`}
              <IconChevronDown size={16} className={`ml-1.5 transition-transform ${showModelsDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showModelsDropdown && (
              <div className="absolute left-0 mt-1 w-60 rounded-md border border-gray-200 bg-white p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
                {models.map((m: { id: string; name: string }) => (
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

        {/* Help / settings */}
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50"
            title="Help"
            onClick={() => dispatch({ type: 'change', field: 'openModal', value: 'help' })}
          >
            <IconHelpCircle size={18} />
          </button>
          <button
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50"
            title="Settings"
            onClick={() => dispatch({ type: 'change', field: 'openModal', value: 'settings' })}
          >
            <IconSettings size={18} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6">
        {modelError && !loading && <ErrorMessageDiv error={modelError} />}

        {/* Empty state */}
        {noTranscript && !loading && !modelError && (
          <div className="flex flex-col items-center justify-center flex-grow text-center px-4">
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Metrix AI Clinical Scribe</h1>
            <p className="text-gray-600 text-sm max-w-lg mx-auto mb-8">
              Choose an input method below. Select a template and model above before starting.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <ChatTextToSpeech onSend={(m) => handleTranscriptReceived(m.content)} />
              <ChatStartOfficeVisit onSend={(m) => handleTranscriptReceived(m.content)} />
            </div>
            <p className="text-xs text-gray-400 mt-8 max-w-lg">
              Or paste a transcript directly into the input bar below.
            </p>
          </div>
        )}

        {/* Results */}
        {!noTranscript && !modelError && (
          <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Transcript */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-700">Transcript</h2>
                <button
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50"
                  onClick={() => setIsTranscriptExpanded((v) => !v)}
                  title={isTranscriptExpanded ? 'Collapse' : 'Expand'}
                >
                  {isTranscriptExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </button>
              </div>
              <div
                className={`transition-all duration-300 ${isTranscriptExpanded ? 'max-h-60 p-4 overflow-y-auto' : 'max-h-0 p-0 overflow-hidden'}`}
                style={{ scrollbarWidth: 'thin' }}
              >
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>

            {/* Document */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base font-semibold text-gray-700">Clinical Documentation</h2>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 mr-2">{docWordCount} words</span>
                  <button
                    className="inline-flex items-center p-2 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50"
                    onClick={handleCopyDoc}
                    title="Copy"
                  >
                    <IconCopy size={16} />
                  </button>
                  <button
                    className="inline-flex items-center p-2 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50"
                    onClick={handleDownloadPDF}
                    title="Download PDF"
                  >
                    <IconDownload size={16} />
                  </button>
                  {isEditingDoc ? (
                    <button
                      className="inline-flex items-center p-2 rounded-md text-green-600 hover:bg-green-100"
                      onClick={handleSaveEdit}
                      title="Save"
                    >
                      <IconCheck size={16} />
                    </button>
                  ) : (
                    <button
                      className="inline-flex items-center p-2 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50"
                      onClick={() => {
                        setIsEditingDoc(true);
                        setEditDocText(clinicalDoc);
                      }}
                      title="Edit"
                    >
                      <IconEdit size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 md:p-6 min-h-[250px]">
                {isEditingDoc ? (
                  <textarea
                    className="block w-full h-full min-h-[250px] border border-gray-300 rounded-lg p-3"
                    value={editDocText}
                    onChange={(e) => setEditDocText(e.target.value)}
                  />
                ) : loading && !clinicalDoc ? (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <IconLoader2 size={24} className="animate-spin mr-2" /> Generating…
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-800">
                    {clinicalDoc ? <ReactMarkdown>{clinicalDoc}</ReactMarkdown> : <p className="italic text-gray-500">Document will appear here.</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base font-semibold text-gray-700 flex items-center">
                  <IconInfoCircle size={18} className="mr-2 text-blue-600" /> AI Analysis & Recommendations
                </h2>
              </div>
              <div className="flex-1 overflow-auto p-4 md:p-6 min-h-[150px]">
                {loading && !analysis ? (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <IconLoader2 size={24} className="animate-spin mr-2" /> Generating…
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {analysis ? <ReactMarkdown>{analysis}</ReactMarkdown> : <p className="italic text-gray-500">Analysis will appear here.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input */}
      <ChatInput
        stopConversationRef={stopConversationRef}
        textareaRef={null}
        onSend={(m) => handleTranscriptReceived(m.content)}
        onRegenerate={handleRegenerate}
        onScrollDownClick={scrollToBottom}
        showScrollDownButton={
          !autoScrollEnabled &&
          Boolean(
            chatContainerRef.current &&
              chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight,
          )
        }
      />

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
