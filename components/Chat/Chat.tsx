// /components/Chat/Chat.tsx

import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit,
  IconCheck,
} from '@tabler/icons-react';
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
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'next-i18next';

import ReactMarkdown from 'react-markdown';

import HomeContext from '@/pages/api/home/home.context';
import { throttle } from '@/utils/data/throttle';
import { saveConversation, saveConversations } from '@/utils/app/conversation';

import { ChatInput } from './ChatInput';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { ChatTextToSpeech } from './ChatTextToSpeech';
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit';

import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

import { Conversation, Message } from '@/types/chat';
import { Prompt } from '@/types/prompt';

// PDF generation
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

type OutputType = 'doc' | 'analysis' | null;

export const Chat = memo(function Chat({ stopConversationRef }: Props) {
  const { t } = useTranslation('chat');

  const {
    state: {
      modelError,
      loading,
      conversations,
      selectedConversation,
      openModal,
      models,
      prompts,
    },
    dispatch,
    handleUpdateConversation,
  } = useContext(HomeContext);

  // MAIN local states:
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');

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
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const throttledScrollDown = throttle(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, 250);

  useEffect(() => {
    throttledScrollDown();
  }, [clinicalDoc, analysis, throttledScrollDown, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    if (messagesEndRef.current) observer.observe(messagesEndRef.current);
    return () => {
      if (messagesEndRef.current) observer.unobserve(messagesEndRef.current);
    };
  }, []);

  // -------------------------------------------------
  // Use environment variable for API base URL
  // -------------------------------------------------
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // We might have two different endpoints: /rag, /predictive, etc.
  // We'll show example for /rag:
  const RAG_ENDPOINT = `${API_BASE_URL}/rag/ask_rag`;

  // -----------------------------------------------
  // Create doc from transcript (Markdown output)
  // -----------------------------------------------
  const handleCreateDocFromTranscript = async (text: string) => {
    const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
    const templateContent = selectedTemplate?.content || '';

    const docPrompt = `
You are a helpful clinical scribe AI. Return output in Markdown format.

Template:
${templateContent}

User Transcript:
${text}
`.trim();

    try {
      const payload = {
        message: docPrompt,
        history: [],
        mode: 'scribe',
        template_name: activeTemplateName,
      };
      // Instead of axios to localhost => do axios to RAG_ENDPOINT
      const res = await axios.post(RAG_ENDPOINT, payload);
      const docMarkdown = res.data.response || '';

      setClinicalDoc(docMarkdown);
      setAnalysis('');
      setIsEditingDoc(false);

      setLastDocPrompt(docPrompt);
      setLastOutputType('doc');

      await handleAnalyzeDoc(docMarkdown, text);
    } catch (err) {
      console.error('[handleCreateDocFromTranscript] error =>', err);
    }
  };

  // Compare doc vs transcript => highlight errors, etc.
  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => {
    const analysisPrompt = `
Analyze doc vs. transcript. Return Markdown output with any errors or recommended improvements.

Transcript:
${rawTranscript}

Clinical Document:
${doc}
`.trim();

    try {
      const payload = {
        message: analysisPrompt,
        history: [],
        mode: 'analysis',
      };
      const res = await axios.post(RAG_ENDPOINT, payload);
      setAnalysis(res.data.response || '');
      setLastAnalysisPrompt(analysisPrompt);
      setLastOutputType('analysis');
    } catch (err) {
      console.error('[handleAnalyzeDoc] error =>', err);
    }
  };

  const handleTranscriptReceived = async (text: string) => {
    setTranscript(text);
    await handleCreateDocFromTranscript(text);
  };

  const handleRegenerate = async () => {
    if (lastOutputType === 'doc') {
      if (!lastDocPrompt) return;
      try {
        const payload = {
          message: lastDocPrompt,
          history: [],
          mode: 'scribe',
          template_name: activeTemplateName,
        };
        const res = await axios.post(RAG_ENDPOINT, payload);
        const docMarkdown = res.data.response || '';
        setClinicalDoc(docMarkdown);
        setAnalysis('');
        await handleAnalyzeDoc(docMarkdown, transcript);
      } catch (err) {
        console.error('[handleRegenerate - doc] error =>', err);
      }
    } else if (lastOutputType === 'analysis') {
      if (!lastAnalysisPrompt) return;
      try {
        const payload = {
          message: lastAnalysisPrompt,
          history: [],
          mode: 'analysis',
        };
        const res = await axios.post(RAG_ENDPOINT, payload);
        setAnalysis(res.data.response || '');
      } catch (err) {
        console.error('[handleRegenerate - analysis] error =>', err);
      }
    }
  };

  const handleCopyDoc = async () => {
    try {
      await navigator.clipboard.writeText(clinicalDoc);
      alert('Document copied to clipboard!');
    } catch (err) {
      console.error('[handleCopyDoc] failed =>', err);
    }
  };

  const handleDownloadPDF = () => {
    const now = new Date();
    const timeStamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '_',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    const pdfDefinition = {
      content: [
        { text: 'Clinical Document', style: 'header', margin: [0, 0, 0, 10] },
        { text: clinicalDoc, margin: [0, 0, 0, 10] },
      ],
      styles: {
        header: { fontSize: 14, bold: true },
      },
    };
    pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`);
  };

  const handleStartEdit = () => {
    setIsEditingDoc(true);
    setEditDocText(clinicalDoc);
  };
  const handleSaveEdit = () => {
    setIsEditingDoc(false);
    setClinicalDoc(editDocText);
  };

  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;
  const noTranscript = !transcript;

  let mainContent: ReactNode;
  if (modelError) {
    mainContent = <ErrorMessageDiv error={modelError} />;
  } else if (noTranscript) {
    mainContent = (
      <div className="flex flex-row items-center justify-evenly py-6 px-4 w-full h-full">
        <div className="w-[45%] flex flex-col items-center justify-center border rounded-lg p-36 shadow">
          <ChatTextToSpeech
            onSend={(msg) => {
              handleTranscriptReceived(msg.content);
            }}
          />
        </div>
        <div className="w-[45%] flex flex-col items-center justify-center border rounded-lg p-36 shadow">
          <ChatStartOfficeVisit
            onSend={(msg) => {
              handleTranscriptReceived(msg.content);
            }}
          />
        </div>
      </div>
    );
  } else {
    mainContent = (
      <div className="px-4 py-2 w-full h-full">
        <div className="text-center text-lg font-semibold mb-2">Transcript</div>
        <div className="flex justify-center mb-6">
          <div className="max-w-2xl bg-gray-200 text-black p-4 rounded shadow whitespace-pre-wrap">
            {transcript}
          </div>
        </div>

        <div className="flex flex-row gap-4 h-[65vh]">
          <div className="flex-1 border rounded-md p-4 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-md">Clinical Documentation</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">{docWordCount} words</span>
                <button onClick={handleCopyDoc} className="p-1 rounded hover:bg-gray-200">
                  <IconCopy size={16} />
                </button>
                <button onClick={handleDownloadPDF} className="p-1 rounded hover:bg-gray-200">
                  <IconDownload size={16} />
                </button>
                {isEditingDoc ? (
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 rounded hover:bg-gray-200 text-green-600"
                  >
                    <IconCheck size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <IconEdit size={16} />
                  </button>
                )}
              </div>
            </div>

            {isEditingDoc ? (
              <textarea
                className="w-full h-[70vh] border rounded p-2 text-sm whitespace-pre-wrap"
                value={editDocText}
                onChange={(e) => setEditDocText(e.target.value)}
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown>{clinicalDoc}</ReactMarkdown>
              </div>
            )}
          </div>

          <div className="flex-1 border rounded-md p-4 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-md">Analysis &amp; Recommendations</h2>
            </div>
            <div className="prose prose-sm dark:prose-invert">
              {analysis ? (
                <ReactMarkdown>{analysis}</ReactMarkdown>
              ) : (
                <p className="italic text-gray-500">Generating comparison...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-[#343541] text-black dark:text-white">
      <div className="border-b border-gray-300 dark:border-gray-700 px-4 py-2 flex items-center gap-4">
        {/* Template Dropdown, etc. */}
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-2
                       text-sm font-semibold text-gray-700 hover:bg-gray-300"
            onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
          >
            {`${t('Template')}: ${activeTemplateName}`}
            <IconChevronDown size={16} />
          </button>
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-gray-200
                            bg-white p-2 shadow-lg z-50">
              {prompts.map((prompt: Prompt) => (
                <button
                  key={prompt.id}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setActiveTemplateName(prompt.name);
                    setShowTemplatesDropdown(false);
                  }}
                >
                  {prompt.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-2
                       text-sm font-semibold text-gray-700 hover:bg-gray-300"
            onClick={() => setShowModelsDropdown(!showModelsDropdown)}
          >
            {`${t('Model')}: ${activeModelName}`}
            <IconChevronDown size={16} />
          </button>
          {showModelsDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-gray-200
                            bg-white p-2 shadow-lg z-50">
              {models.map((m) => (
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pb-40"
        onScroll={() => {
          if (!chatContainerRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          if (scrollTop + clientHeight < scrollHeight - 80) {
            setAutoScrollEnabled(false);
          } else {
            setAutoScrollEnabled(true);
          }
        }}
      >
        {modelError && <ErrorMessageDiv error={modelError} />}
        {mainContent}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      <div className="px-2 pb-2">
        <ChatInput
          stopConversationRef={stopConversationRef}
          textareaRef={null as any}
          onSend={(msg) => {
            setTranscript(msg.content);
            handleCreateDocFromTranscript(msg.content);
          }}
          onRegenerate={() => handleRegenerate()}
          onScrollDownClick={() => {
            if (autoScrollEnabled && messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          showScrollDownButton={false}
        />
      </div>

      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat;
