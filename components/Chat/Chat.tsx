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
  const [transcript, setTranscript] = useState('');       // The raw user transcript
  const [clinicalDoc, setClinicalDoc] = useState('');     // The markdown doc
  const [analysis, setAnalysis] = useState('');           // The doc comparison output

  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');

  // Template & Model states
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);

  // For re-running the last output:
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Throttled scroll
  const throttledScrollDown = throttle(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, 250);

  useEffect(() => {
    throttledScrollDown();
  }, [clinicalDoc, analysis, throttledScrollDown, loading]);

  // Intersection observer for auto scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
      },
      { root: null, threshold: 0.3 }
    );
    if (messagesEndRef.current) observer.observe(messagesEndRef.current);
    return () => {
      if (messagesEndRef.current) observer.unobserve(messagesEndRef.current);
    };
  }, []);

  const scrollToBottom = () => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // -----------------------------------------------
  // Create doc from transcript (Markdown output)
  // -----------------------------------------------
  const handleCreateDocFromTranscript = async (text: string) => {
    const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
    const templateContent = selectedTemplate?.content || '';

    // Prompt for doc creation, ensuring Markdown format with headings/bullet points
    const docPrompt = `
You are a helpful clinical scribe AI. Return your output in Markdown format with headings in **bold** or '#' style, bullet points, etc.

Template (headings/format):
--------------------------
${templateContent}

User Transcript:
--------------------------
${text}

Instructions:
- Fill in or expand on the above template headings using the transcript details.
- Ensure final answer is Markdown (headings in **bold** or using #).
`.trim();

    try {
      const payload = {
        message: docPrompt,
        history: [],
        mode: 'scribe',
        template_name: activeTemplateName,
      };
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
      const docMarkdown = res.data.response || '';

      setClinicalDoc(docMarkdown);
      setAnalysis('');
      setIsEditingDoc(false);

      // Store prompt for possible regenerate
      setLastDocPrompt(docPrompt);
      setLastOutputType('doc');

      // After doc creation, automatically run analysis
      await handleAnalyzeDoc(docMarkdown, text);
    } catch (err) {
      console.error('[handleCreateDocFromTranscript] error =>', err);
    }
  };

  // ------------------------------------------------------------
  // Compare doc vs transcript => highlight errors, inferred terms
  // ------------------------------------------------------------
  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => {
    const analysisPrompt = `
You are a clinical summarizer focusing on:
1) **Potential Transcription Errors**: output as a list
2) **Inferred Terms** 
3) **Recommendations** (relevant to the active template)

Please return your result in **Markdown** format with clear headings.

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}
`.trim();

    try {
      const payload = {
        message: analysisPrompt,
        history: [],
        mode: 'analysis',
      };
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
      const analysisOutput = res.data.response || '';

      setAnalysis(analysisOutput);
      setLastAnalysisPrompt(analysisPrompt);
      setLastOutputType('analysis');
    } catch (err) {
      console.error('[handleAnalyzeDoc] error =>', err);
    }
  };

  // ------------------------------------------------------------
  // Called when we get a transcript (from dictation or typed)
  // ------------------------------------------------------------
  const handleTranscriptReceived = async (text: string) => {
    setTranscript(text);
    await handleCreateDocFromTranscript(text);
  };

  // ------------------------------------------------------------
  // Regenerate => re-call the last prompt (doc or analysis)
  // ------------------------------------------------------------
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
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        const docMarkdown = res.data.response || '';
        setClinicalDoc(docMarkdown);
        setAnalysis('');
        // After doc re-generation, run analysis again
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
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        setAnalysis(res.data.response || '');
      } catch (err) {
        console.error('[handleRegenerate - analysis] error =>', err);
      }
    }
  };

  // Word count for doc
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;

  // Copy doc
  const handleCopyDoc = async () => {
    try {
      await navigator.clipboard.writeText(clinicalDoc);
      alert('Document copied to clipboard!');
    } catch (err) {
      console.error('[handleCopyDoc] failed =>', err);
    }
  };

  // Download doc as PDF
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

  // Edit doc toggles
  const handleStartEdit = () => {
    setIsEditingDoc(true);
    setEditDocText(clinicalDoc);
  };
  const handleSaveEdit = () => {
    setIsEditingDoc(false);
    setClinicalDoc(editDocText);
  };

  // Decide what to render as mainContent
  const noTranscript = !transcript;
  let mainContent: ReactNode;

  if (modelError) {
    mainContent = <ErrorMessageDiv error={modelError} />;
  } else if (noTranscript) {
    // Show initial dictation or consultation buttons, plus heading & explainer
    mainContent = (
      <div className="px-4 py-6 w-full h-full flex flex-col">
        {/* New heading & explainer text */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-center">Metrix AI Clinical Scribe</h1>
          <p className="text-center text-gray-800 mt-2">
            Use the clinical scribe to record speech or consultations. 
            Select a template from the options above and produce a 
            professional clinical document with associated recommendations. 
            You can then download or copy it into the patient's EHR.
          </p>
        </div>

        {/* The two main buttons */}
        <div className="flex flex-row items-center justify-evenly flex-1">
          <div
            className="w-[45%] flex flex-col items-center justify-center border-gray-400 rounded-lg p-36 shadow"
            style={{
              backgroundImage: "url('/VoiceMode.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatTextToSpeech
              onSend={(msg) => {
                handleTranscriptReceived(msg.content);
              }}
            />
          </div>
          <div
            className="w-[45%] flex flex-col items-center justify-center border-gray-400 rounded-lg p-36 shadow"
            style={{
              backgroundImage: "url('/StartOfficeVisit.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatStartOfficeVisit
              onSend={(msg) => {
                handleTranscriptReceived(msg.content);
              }}
            />
          </div>
        </div>
      </div>
    );
  } else {
    // We have a transcript => show it, doc on left, analysis on right
    mainContent = (
      <div className="px-4 py-2 w-full h-full">
        {/* Transcript at top */}
        <div className="text-center text-lg font-semibold mb-2">Transcript</div>
        <div className="flex justify-center mb-6">
          <div className="max-w-2xl bg-gray-100 text-black p-4 rounded shadow whitespace-pre-wrap">
            {transcript}
          </div>
        </div>

        {/* Two columns: doc (left) and analysis (right) */}
        <div className="flex flex-row gap-4 h-[65vh]">
          {/* Clinical doc => now rendered via ReactMarkdown */}
          <div className="flex-1 border rounded-md p-4 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-md">Clinical Documentation</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">{docWordCount} words</span>
                <button
                  onClick={handleCopyDoc}
                  title="Copy"
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <IconCopy size={16} />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  title="Download PDF"
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <IconDownload size={16} />
                </button>
                {isEditingDoc ? (
                  <button
                    onClick={handleSaveEdit}
                    title="Save Edits"
                    className="p-1 rounded hover:bg-gray-200 text-green-600"
                  >
                    <IconCheck size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    title="Edit Document"
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
              // Render Markdown as formatted HTML via ReactMarkdown
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown>{clinicalDoc}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Analysis => also rendered via ReactMarkdown */}
          <div className="flex-1 border rounded-md p-4 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-md">Analysis &amp; Recommendations</h2>
            </div>
            <div className="prose prose-sm dark:prose-invert">
              {analysis ? (
                <ReactMarkdown>{analysis}</ReactMarkdown>
              ) : (
                <p className="italic text-gray-800">
                  Generating comparison and recommendations...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the chat UI
  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-[#343541] text-black dark:text-white">
      {/* Top bar => template & model */}
      <div className="border-b border-white dark:border-gray-400 px-4 py-2 flex items-center gap-4">
        {/* Template dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md border border-gray-400 bg-neutral-50 px-3 py-2
                       text-sm font-semibold text-gray-700 hover:bg-gray-100"
            onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
          >
            {`${t('Template')}: ${activeTemplateName}`}
            <IconChevronDown size={16} />
          </button>
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-gray-400
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

        {/* Model dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md bg-neutral-50 px-3 py-2
                       text-sm font-semibold text-gray-700 hover:bg-gray-100"
            onClick={() => setShowModelsDropdown(!showModelsDropdown)}
          >
            {`${t('Model')}: ${activeModelName}`}
            <IconChevronDown size={16} />
          </button>
          {showModelsDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-gray-400
                            bg-white p-2 shadow-lg z-50">
              {models.map((m) => (
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700
                             hover:bg-gray-100"
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

      {/* Scrollable main content */}
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

      {/* 
        BOTTOM BAR — updated to match the style from diagnostic-assistance.tsx.
        We keep the ChatInput functionality but apply the same 'sticky' & border layout.
      */}
      <div className="sticky bottom-0 bg-white border-t border-gray-400 px-4 py-3">
        <div className="w-full max-w-4xl mx-auto flex items-center space-x-3">
          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={null as any}
            onSend={(msg) => {
              // user typed something => treat as new transcript
              setTranscript(msg.content);
              handleCreateDocFromTranscript(msg.content);
            }}
            onRegenerate={() => handleRegenerate()}
            onScrollDownClick={scrollToBottom}
            showScrollDownButton={false}
          />
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
