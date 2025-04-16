// /components/Chat/Chat.tsx

import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit,
  IconCheck,
  IconChevronUp, // Added for toggle
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

// Memoized Chat component to prevent unnecessary re-renders
export const Chat = memo(function Chat({ stopConversationRef }: Props) {
  const { t } = useTranslation('chat'); // Translation hook

  // Global state and dispatch from HomeContext
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
  const [transcript, setTranscript] = useState(''); // Raw user transcript (from speech or text input)
  const [clinicalDoc, setClinicalDoc] = useState(''); // Generated clinical document in Markdown
  const [analysis, setAnalysis] = useState(''); // Analysis/comparison output in Markdown (currently holds all analysis)
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true); // State for transcript visibility

  // State for editing the clinical document
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');

  // Template & Model selection states
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note'); // Default template
  const [activeModelName, setActiveModelName] = useState('GPT-4'); // Default model
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);

  // State for re-running the last generation (doc or analysis)
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');

  // Refs for scrolling and DOM elements
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to the bottom of the chat area
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true); // State to control auto-scrolling

  // Throttled scroll function to avoid performance issues
  const throttledScrollDown = throttle(() => {
    if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) {
      // Only scroll if near the bottom
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, 250);

  // Effect to scroll down when content changes or loading state updates
  useEffect(() => {
    if (clinicalDoc || analysis || !loading) {
      throttledScrollDown();
    }
  }, [clinicalDoc, analysis, loading, throttledScrollDown]);

  // Effect to set up an Intersection Observer to disable/enable auto-scroll
  useEffect(() => {
    const currentChatContainer = chatContainerRef.current;

    const handleScroll = () => {
      if (!currentChatContainer) return;
      const { scrollTop, scrollHeight, clientHeight } = currentChatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
      setAutoScrollEnabled(isNearBottom);
    };

    if (currentChatContainer) {
      currentChatContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentChatContainer) {
        currentChatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Function to manually scroll the main container to the bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setAutoScrollEnabled(true);
    }
  };

  // -----------------------------------------------
  // Create doc from transcript (Markdown output)
  // -----------------------------------------------
  const handleCreateDocFromTranscript = async (text: string) => {
    // Find the selected template content
    const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
    const templateContent = selectedTemplate?.content || '';

    // Construct the prompt for document creation
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
      dispatch({ type: 'change', field: 'loading', value: true }); // <--- ADDED 'type' property
      dispatch({ type: 'change', field: 'modelError', value: null }); // <--- ADDED 'type' property
      setClinicalDoc('');
      setAnalysis('');
      setIsTranscriptExpanded(true);

      // Prepare the payload for the API call
      const payload = {
        message: docPrompt,
        history: [],
        mode: 'scribe',
        template_name: activeTemplateName,
      };

      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
      const docMarkdown = res.data.response || '';

      // Update local state with the generated document
      setClinicalDoc(docMarkdown);
      setIsEditingDoc(false);

      setLastDocPrompt(docPrompt);
      setLastOutputType('doc');

      // Automatically run analysis after document creation
      await handleAnalyzeDoc(docMarkdown, text);
    } catch (err) {
      console.error('[handleCreateDocFromTranscript] error =>', err);
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: 'Failed to create document.' },
      });
      setClinicalDoc('');
      setAnalysis('');
    } finally {
      // handleAnalyzeDoc handles turning off loading in its final block
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
3) **Recommendations** (relevant to the active template, including potential scoring tools and imaging)

Please return your result in **Markdown** format with clear headings for each section (e.g., ## Inferred Terms, ## Clinical Scoring Tools, ## Imaging Recommendations).

Transcript:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}
`.trim();

    try {
      // If we're not already loading, set loading to true
      if (!loading) {
        dispatch({ type: 'change', field: 'loading', value: true }); // <--- ADDED 'type'
      }
      dispatch({ type: 'change', field: 'modelError', value: null }); // <--- ADDED 'type'

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
      dispatch({
        type: 'change',
        field: 'modelError',
        value: { message: 'Failed to analyze document.' },
      });
      setAnalysis('');
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false }); // <--- ADDED 'type'
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
    dispatch({ type: 'change', field: 'modelError', value: null }); // <--- ADDED 'type'
    setIsTranscriptExpanded(true);

    if (lastOutputType === 'doc' && transcript) {
      if (!lastDocPrompt) return;
      try {
        dispatch({ type: 'change', field: 'loading', value: true }); // <--- ADDED 'type'
        setClinicalDoc('');
        setAnalysis('');
        const payload = {
          message: lastDocPrompt,
          history: [],
          mode: 'scribe',
          template_name: activeTemplateName,
        };
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        const docMarkdown = res.data.response || '';
        setClinicalDoc(docMarkdown);

        await handleAnalyzeDoc(docMarkdown, transcript);
      } catch (err) {
        console.error('[handleRegenerate - doc] error =>', err);
        dispatch({
          type: 'change',
          field: 'modelError',
          value: { message: 'Failed to regenerate document.' },
        });
        setClinicalDoc('');
        setAnalysis('');
        dispatch({ type: 'change', field: 'loading', value: false }); // <--- ADDED 'type'
      }
    } else if (lastOutputType === 'analysis' && clinicalDoc && transcript) {
      if (!lastAnalysisPrompt) return;
      try {
        dispatch({ type: 'change', field: 'loading', value: true }); // <--- ADDED 'type'
        setAnalysis('');
        const payload = {
          message: lastAnalysisPrompt,
          history: [],
          mode: 'analysis',
        };
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        setAnalysis(res.data.response || '');
      } catch (err) {
        console.error('[handleRegenerate - analysis] error =>', err);
        dispatch({
          type: 'change',
          field: 'modelError',
          value: { message: 'Failed to regenerate analysis.' },
        });
        setAnalysis('');
      } finally {
        dispatch({ type: 'change', field: 'loading', value: false }); // <--- ADDED 'type'
      }
    }
  };

  // Calculate word count for the clinical document
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;

  // Function to copy the clinical document text to the clipboard
  const handleCopyDoc = async () => {
    if (!clinicalDoc) return;
    try {
      await navigator.clipboard.writeText(clinicalDoc);
      alert('Document copied to clipboard!');
    } catch (err) {
      console.error('[handleCopyDoc] failed =>', err);
      alert('Failed to copy document.');
    }
  };

  // Function to download the clinical document as a PDF
  const handleDownloadPDF = () => {
    if (!clinicalDoc) return;
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
        {
          text: 'Clinical Document',
          style: 'header',
          margin: [0, 0, 0, 10] as [number, number, number, number],
        },
        {
          text: clinicalDoc,
          margin: [0, 0, 0, 10] as [number, number, number, number],
        },
      ],
      styles: {
        header: { fontSize: 14, bold: true },
      },
    };
    pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`);
  };

  // Toggle functions for editing the document
  const handleStartEdit = () => {
    if (!clinicalDoc) return;
    setIsEditingDoc(true);
    setEditDocText(clinicalDoc);
  };
  const handleSaveEdit = () => {
    setIsEditingDoc(false);
    setClinicalDoc(editDocText);
    if (transcript) {
      handleAnalyzeDoc(editDocText, transcript);
    }
  };

  // Decide what content to render in the main area based on state
  const noTranscript = !transcript;
  let mainContent: ReactNode;

  if (modelError && !loading) {
    mainContent = <ErrorMessageDiv error={modelError} />;
  } else if (noTranscript && !loading) {
    mainContent = (
      <div className="px-4 py-6 w-full h-full flex flex-col">
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold text-[#2D4F6C] dark:text-[#68A9A9]">
            Metrix AI Clinical Scribe
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-xl mx-auto">
            Use the clinical scribe to record speech or consultations.
            Select a template from the options above and produce a
            professional clinical document with associated recommendations.
            You can then download or copy it into the patient's EHR.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-evenly flex-1 gap-4 md:gap-8 mt-4">
          <div
            className="w-full md:w-[45%] flex flex-col items-center justify-center border border-[#3D7F80] rounded-lg p-4 shadow-md hover:shadow-lg hover:border-[#2D4F6C] transition-all duration-200"
            style={{
              backgroundImage: "url('/VoiceMode.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '200px',
            }}
          >
            <div className="bg-white/70 dark:bg-black/70 p-4 rounded-lg backdrop-blur-sm">
              <ChatTextToSpeech
                onSend={(msg) => {
                  handleTranscriptReceived(msg.content);
                }}
              />
            </div>
          </div>

          <div
            className="w-full md:w-[45%] flex flex-col items-center justify-center border border-[#3D7F80] rounded-lg p-4 shadow-md hover:shadow-lg hover:border-[#2D4F6C] transition-all duration-200"
            style={{
              backgroundImage: "url('/StartOfficeVisit.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '200px',
            }}
          >
            <div className="bg-white/70 dark:bg-black/70 p-4 rounded-lg backdrop-blur-sm">
              <ChatStartOfficeVisit
                onSend={(msg) => {
                  handleTranscriptReceived(msg.content);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    mainContent = (
      <>
        {/* === Collapsible Transcript Section === */}
        <div className="px-4 pt-2 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#2D4F6C] dark:text-[#68A9A9]">
              Transcript
            </h2>
            <button
              onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
              className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30"
              title={isTranscriptExpanded ? 'Minimize Transcript' : 'Expand Transcript'}
              aria-expanded={isTranscriptExpanded}
            >
              {isTranscriptExpanded ? (
                <IconChevronUp size={18} />
              ) : (
                <IconChevronDown size={18} />
              )}
            </button>
          </div>

          <div
            className={`
              w-full bg-gray-100 dark:bg-gray-700 text-black dark:text-white
              rounded shadow border border-[#68A9A9]/30 transition-all duration-300 ease-in-out
              ${isTranscriptExpanded
                ? 'p-4 h-auto max-h-48 overflow-y-auto'
                : 'p-2 h-7 overflow-hidden whitespace-nowrap'
              }
            `}
          >
            <span
              className={`${
                !isTranscriptExpanded ? 'block truncate' : 'whitespace-pre-wrap'
              }`}
            >
              {transcript || (
                <span className="italic text-gray-400">
                  No transcript available.
                </span>
              )}
            </span>
          </div>
        </div>
        {/* === End Collapsible Transcript Section === */}

        {/* Main Two columns layout: Document (left) and Analysis Boxes (right) */}
        <div className="flex flex-col md:flex-row gap-4 md:h-[58vh] px-4 pb-4">
          <div className="flex-1 md:w-2/3 flex flex-col border border-[#2D4F6C] rounded-md shadow bg-white dark:bg-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[#68A9A9]/50 flex-shrink-0">
              <h2 className="font-semibold text-md text-[#2D4F6C] dark:text-[#68A9A9]">
                Clinical Documentation
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {docWordCount} words
                </span>

                <button
                  onClick={handleCopyDoc}
                  title="Copy"
                  disabled={!clinicalDoc || isEditingDoc}
                  className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconCopy size={16} />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  title="Download PDF"
                  disabled={!clinicalDoc || isEditingDoc}
                  className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconDownload size={16} />
                </button>

                {isEditingDoc ? (
                  <button
                    onClick={handleSaveEdit}
                    title="Save Edits"
                    className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30"
                  >
                    <IconCheck size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    title="Edit Document"
                    disabled={!clinicalDoc || loading}
                    className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconEdit size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {isEditingDoc ? (
                <textarea
                  className="w-full h-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3D7F80] min-h-[200px]"
                  value={editDocText}
                  onChange={(e) => setEditDocText(e.target.value)}
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none h-full">
                  {loading && !clinicalDoc ? (
                    <p className="italic text-gray-500 dark:text-gray-400">
                      Generating document...
                    </p>
                  ) : clinicalDoc ? (
                    <ReactMarkdown>{clinicalDoc}</ReactMarkdown>
                  ) : (
                    <p className="italic text-gray-500 dark:text-gray-400">
                      Document will appear here.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="flex-1 border border-[#3D7F80] rounded-md shadow p-4 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-[100px]">
              <h2 className="font-semibold text-md mb-2 text-[#2D4F6C] dark:text-[#68A9A9] flex-shrink-0">
                Suspect/Inferred Terms
              </h2>
              <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                {loading && !analysis ? (
                  <p className="italic text-gray-500 dark:text-gray-400">
                    Generating analysis...
                  </p>
                ) : analysis ? (
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                ) : (
                  <p className="italic text-gray-500 dark:text-gray-400">
                    Analysis will appear here.
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 border border-[#3D7F80] rounded-md shadow p-4 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-[100px]">
              <h2 className="font-semibold text-md mb-2 text-[#2D4F6C] dark:text-[#68A9A9] flex-shrink-0">
                Clinical Scoring Tools
              </h2>
              <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                {loading && !analysis ? (
                  <p className="italic text-gray-500 dark:text-gray-400">
                    Generating analysis...
                  </p>
                ) : analysis ? (
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                ) : (
                  <p className="italic text-gray-500 dark:text-gray-400">
                    Analysis will appear here.
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 border border-[#3D7F80] rounded-md shadow p-4 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-[100px]">
              <h2 className="font-semibold text-md mb-2 text-[#2D4F6C] dark:text-[#68A9A9] flex-shrink-0">
                Early Imaging Recommendations
              </h2>
              <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                {loading && !analysis ? (
                  <p className="italic text-gray-500 dark:text-gray-400">
                    Generating analysis...
                  </p>
                ) : (
                  <>
                    <p>
                      Consider early imaging based on clinical presentation:
                    </p>
                    <ul>
                      <li>
                        <strong>Chest X-ray:</strong> Chest pain, shortness of
                        breath, worsening cough.
                      </li>
                      <li>
                        <strong>CT Head:</strong> Severe headache, high-risk
                        falls, unexplained neurological symptoms.
                      </li>
                      <li>
                        <strong>Point-of-Care Ultrasound (POCUS):</strong>{' '}
                        Peritonitic abdominal pain, trauma-related abdominal
                        pain, suspected gallstones, hydronephrosis concerns,
                        pregnancy complications.
                      </li>
                    </ul>
                    {analysis && (
                      <>
                        <hr className="my-2 border-[#68A9A9]/50" />
                        <p>
                          <strong className="text-[#2D4F6C] dark:text-[#68A9A9]">
                            AI Suggestions:
                          </strong>
                        </p>
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-[#343541] text-black dark:text-white">
      {/* Top bar: Template and Model selection dropdowns */}
      <div className="border-b border-[#68A9A9]/50 px-4 py-2 flex items-center gap-4 flex-wrap flex-shrink-0">
        {/* Template Dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md border border-[#3D7F80] bg-white dark:bg-gray-800 px-3 py-2
                       text-sm font-semibold text-[#2D4F6C] dark:text-gray-100 hover:bg-[#68A9A9]/20 dark:hover:bg-[#3D7F80]/30 disabled:opacity-50"
            onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
            aria-haspopup="true"
            aria-expanded={showTemplatesDropdown}
            disabled={loading}
          >
            {`${t('Template')}: ${activeTemplateName}`}
            <IconChevronDown
              size={16}
              className={`${
                showTemplatesDropdown ? 'transform rotate-180' : ''
              } transition-transform`}
            />
          </button>
          {showTemplatesDropdown && (
            <div
              className="absolute left-0 mt-2 w-[220px] rounded-md border border-[#3D7F80]
                           bg-white dark:bg-gray-800 p-2 shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {prompts.map((prompt: Prompt) => (
                <button
                  key={prompt.id}
                  className="block w-full text-left px-3 py-2 text-sm text-[#2D4F6C] dark:text-gray-200
                             hover:bg-[#68A9A9]/30 dark:hover:bg-[#3D7F80]/50 rounded"
                  onClick={() => {
                    setActiveTemplateName(prompt.name);
                    setShowTemplatesDropdown(false);
                    // If transcript exists, regenerate the doc with new template
                    if (transcript) {
                      handleCreateDocFromTranscript(transcript);
                    }
                  }}
                >
                  {prompt.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md border border-[#3D7F80] bg-white dark:bg-gray-800 px-3 py-2
                       text-sm font-semibold text-[#2D4F6C] dark:text-gray-100 hover:bg-[#68A9A9]/20 dark:hover:bg-[#3D7F80]/30 disabled:opacity-50"
            onClick={() => setShowModelsDropdown(!showModelsDropdown)}
            aria-haspopup="true"
            aria-expanded={showModelsDropdown}
            disabled={loading}
          >
            {`${t('Model')}: ${activeModelName}`}
            <IconChevronDown
              size={16}
              className={`${
                showModelsDropdown ? 'transform rotate-180' : ''
              } transition-transform`}
            />
          </button>
          {showModelsDropdown && (
            <div
              className="absolute left-0 mt-2 w-[220px] rounded-md border border-[#3D7F80]
                           bg-white dark:bg-gray-800 p-2 shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {models.map((m) => (
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-2 text-sm text-[#2D4F6C] dark:text-gray-200
                             hover:bg-[#68A9A9]/30 dark:hover:bg-[#3D7F80]/50 rounded"
                  onClick={() => {
                    setActiveModelName(m.name);
                    setShowModelsDropdown(false);
                    // Potentially re-run logic if model changes
                    if (transcript && clinicalDoc) {
                      handleAnalyzeDoc(clinicalDoc, transcript);
                    } else if (transcript) {
                      handleCreateDocFromTranscript(transcript);
                    }
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
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto pb-40 flex flex-col">
        {mainContent}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* Chat Input at the bottom */}
      <div className="flex-shrink-0">
        <ChatInput
          stopConversationRef={stopConversationRef}
          textareaRef={null as any}
          onSend={(msg) => {
            // Treat user text input as a new transcript
            handleTranscriptReceived(msg.content);
          }}
          onRegenerate={handleRegenerate}
          onScrollDownClick={scrollToBottom}
          showScrollDownButton={
            !autoScrollEnabled &&
            chatContainerRef.current &&
            chatContainerRef.current.scrollHeight >
              chatContainerRef.current.clientHeight
          }
          isLoading={loading}
        />
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
