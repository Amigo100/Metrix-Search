// file: /components/Chat/Chat.tsx (or potentially pages/clinical-scribe.tsx if it's a full page)

import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit,
  IconCheck,
  IconChevronUp, // Added for toggle
} from '@tabler/icons-react'; // Using Tabler icons
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
import { useTranslation } from 'next-i18next'; // Assuming i18n setup

import ReactMarkdown from 'react-markdown'; // For rendering Markdown content

// Assuming context setup exists elsewhere
import HomeContext from '@/pages/api/home/home.context'; // Adjust path as needed
import { throttle } from '@/utils/data/throttle';
import { saveConversation, saveConversations } from '@/utils/app/conversation'; // Adjust path

// Assuming child components exist and are styled appropriately or accept styling props
import { ChatInput } from './ChatInput'; // Adjust path
import { ErrorMessageDiv } from './ErrorMessageDiv'; // Adjust path
import { ChatTextToSpeech } from './ChatTextToSpeech'; // Adjust path
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit'; // Adjust path

// Assuming Modal components exist
import { ProfileModal } from '@/components/Modals/ProfileModal'; // Adjust path
import { TemplatesModal } from '@/components/Modals/TemplatesModal'; // Adjust path
import { HelpModal } from '@/components/Modals/HelpModal'; // Adjust path
import { SettingsModal } from '@/components/Modals/SettingsModal'; // Adjust path

import { Conversation, Message } from '@/types/chat'; // Adjust path
import { Prompt } from '@/types/prompt'; // Adjust path

// PDF generation (ensure setup is correct in your project)
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

  // MAIN local states: (Logic preserved)
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4'); // Default model
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');

  // Refs and Auto-scroll state (Logic preserved)
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Throttled scroll function (Logic preserved)
  const throttledScrollDown = throttle(() => {
    if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, 250);

  // Effect to scroll down (Logic preserved)
  useEffect(() => {
    if (clinicalDoc || analysis || !loading) {
      throttledScrollDown();
    }
  }, [clinicalDoc, analysis, loading, throttledScrollDown]);

  // Effect for auto-scroll enable/disable (Logic preserved)
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

  // Function to manually scroll (Logic preserved)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setAutoScrollEnabled(true);
    }
  };

  // --- API Call Functions (Logic preserved, ensure dispatch has 'type') ---

  const handleCreateDocFromTranscript = async (text: string) => {
    const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
    const templateContent = selectedTemplate?.content || '';
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
      dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });
      setClinicalDoc('');
      setAnalysis('');
      setIsTranscriptExpanded(true);
      const payload = { message: docPrompt, history: [], mode: 'scribe', template_name: activeTemplateName };
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload); // Ensure endpoint is correct
      const docMarkdown = res.data.response || '';
      setClinicalDoc(docMarkdown);
      setIsEditingDoc(false);
      setLastDocPrompt(docPrompt);
      setLastOutputType('doc');
      await handleAnalyzeDoc(docMarkdown, text); // Run analysis after doc creation
    } catch (err) {
      console.error('[handleCreateDocFromTranscript] error =>', err);
      dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to create document.' } });
      setClinicalDoc('');
      setAnalysis('');
      // Need to set loading false here if analysis doesn't run
      dispatch({ type: 'change', field: 'loading', value: false });
    } finally {
      // Loading state is handled within handleAnalyzeDoc or the catch block above
    }
  };

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
      if (!loading) { // Only set loading if not already loading (e.g., from doc creation)
        dispatch({ type: 'change', field: 'loading', value: true });
      }
      dispatch({ type: 'change', field: 'modelError', value: null });
      const payload = { message: analysisPrompt, history: [], mode: 'analysis' };
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload); // Ensure endpoint is correct
      const analysisOutput = res.data.response || '';
      setAnalysis(analysisOutput);
      setLastAnalysisPrompt(analysisPrompt);
      // Don't set lastOutputType here, let doc creation handle it if called sequentially
    } catch (err) {
      console.error('[handleAnalyzeDoc] error =>', err);
      dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to analyze document.' } });
      setAnalysis('');
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false }); // Always set loading false here
    }
  };

  const handleTranscriptReceived = async (text: string) => {
    setTranscript(text);
    await handleCreateDocFromTranscript(text);
  };

  const handleRegenerate = async () => {
    dispatch({ type: 'change', field: 'modelError', value: null });
    setIsTranscriptExpanded(true);

    if (lastOutputType === 'doc' && transcript) {
      if (!lastDocPrompt) return;
      try {
        dispatch({ type: 'change', field: 'loading', value: true });
        setClinicalDoc('');
        setAnalysis('');
        const payload = { message: lastDocPrompt, history: [], mode: 'scribe', template_name: activeTemplateName };
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        const docMarkdown = res.data.response || '';
        setClinicalDoc(docMarkdown);
        await handleAnalyzeDoc(docMarkdown, transcript); // Re-analyze after regenerating doc
      } catch (err) {
        console.error('[handleRegenerate - doc] error =>', err);
        dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to regenerate document.' } });
        setClinicalDoc('');
        setAnalysis('');
        dispatch({ type: 'change', field: 'loading', value: false }); // Ensure loading stops on error
      }
    } else if (lastOutputType === 'analysis' && clinicalDoc && transcript) {
      // If only analysis failed or needs regenerating
      if (!lastAnalysisPrompt) return;
      try {
        dispatch({ type: 'change', field: 'loading', value: true });
        setAnalysis('');
        const payload = { message: lastAnalysisPrompt, history: [], mode: 'analysis' };
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        setAnalysis(res.data.response || '');
      } catch (err) {
        console.error('[handleRegenerate - analysis] error =>', err);
        dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to regenerate analysis.' } });
        setAnalysis('');
      } finally {
        dispatch({ type: 'change', field: 'loading', value: false });
      }
    } else if (transcript) {
        // Fallback: if lastOutputType is somehow null but we have a transcript, try generating doc+analysis
        await handleCreateDocFromTranscript(transcript);
    }
  };


  // --- Utility Functions (Logic preserved) ---
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;

  const handleCopyDoc = async () => {
    if (!clinicalDoc) return;
    try {
      await navigator.clipboard.writeText(clinicalDoc);
      alert('Document copied to clipboard!'); // Consider using a less intrusive notification/toast
    } catch (err) {
      console.error('[handleCopyDoc] failed =>', err);
      alert('Failed to copy document.');
    }
  };

  const handleDownloadPDF = () => {
    if (!clinicalDoc) return;
    const now = new Date();
    const timeStamp = [ now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'), '_', String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0'), ].join('');
    const pdfDefinition = { content: [ { text: 'Clinical Document', style: 'header', margin: [0, 0, 0, 10] as [number, number, number, number], }, { text: clinicalDoc, margin: [0, 0, 0, 10] as [number, number, number, number], }, ], styles: { header: { fontSize: 14, bold: true }, }, };
    pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`);
  };

  const handleStartEdit = () => {
    if (!clinicalDoc) return;
    setIsEditingDoc(true);
    setEditDocText(clinicalDoc);
  };

  const handleSaveEdit = () => {
    setIsEditingDoc(false);
    setClinicalDoc(editDocText);
    if (transcript) {
      handleAnalyzeDoc(editDocText, transcript); // Re-analyze after saving edits
    }
  };

  // --- Conditional Rendering Logic (Preserved) ---
  const noTranscript = !transcript;
  let mainContent: ReactNode;

  if (modelError && !loading) {
    mainContent = <ErrorMessageDiv error={modelError} />;
  } else if (noTranscript && !loading) {
    // --- Updated "No Transcript" View Styling ---
    mainContent = (
      <div className="px-4 md:px-6 py-6 w-full h-full flex flex-col items-center"> {/* Centered items */}
        <div className="mb-6 text-center">
          {/* Updated heading/paragraph styles */}
          <h1 className="text-xl font-bold text-teal-700">
            Metrix AI Clinical Scribe
          </h1>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
            Use the clinical scribe to record speech or consultations. Select a template from the options above and produce a professional clinical document with associated recommendations. You can then download or copy it into the patient's EHR.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch justify-center flex-1 gap-6 md:gap-8 mt-4 w-full max-w-4xl"> {/* Adjusted width and gap */}
          {/* Updated card styles */}
          <div
            className="w-full md:w-1/2 flex flex-col items-center justify-center border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/voice-mode.png')" }} // Use local image
          >
            {/* Updated overlay */}
            <div className="bg-white/90 p-6 rounded-lg backdrop-blur-sm text-center">
              <h3 className="font-semibold mb-3 text-gray-800">Record Audio</h3>
              <ChatTextToSpeech
                onSend={(msg) => { handleTranscriptReceived(msg.content); }}
              />
            </div>
          </div>

          <div
            className="w-full md:w-1/2 flex flex-col items-center justify-center border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/office-visit.png')" }} // Use local image
          >
             {/* Updated overlay */}
            <div className="bg-white/90 p-6 rounded-lg backdrop-blur-sm text-center">
               <h3 className="font-semibold mb-3 text-gray-800">Start Office Visit</h3>
              <ChatStartOfficeVisit
                onSend={(msg) => { handleTranscriptReceived(msg.content); }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // --- Updated Main View Styling ---
    mainContent = (
      <>
        {/* === Collapsible Transcript Section === */}
        <div className="px-4 md:px-6 pt-2 mb-6">
          <div className="flex items-center justify-between mb-2">
            {/* Updated heading/button styles */}
            <h2 className="text-lg font-semibold text-teal-700">
              Transcript
            </h2>
            <button
              onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
              className="p-1 rounded text-teal-600 hover:bg-teal-100"
              title={isTranscriptExpanded ? 'Minimize Transcript' : 'Expand Transcript'}
              aria-expanded={isTranscriptExpanded}
            >
              {isTranscriptExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </button>
          </div>

          {/* Updated transcript container styles */}
          <div
            className={`
              w-full bg-gray-50 text-gray-800
              rounded-lg shadow-inner border border-gray-200 transition-all duration-300 ease-in-out
              ${isTranscriptExpanded ? 'p-4 max-h-48 overflow-y-auto' : 'p-2 h-10 overflow-hidden whitespace-nowrap cursor-pointer'}
            `}
            onClick={!isTranscriptExpanded ? () => setIsTranscriptExpanded(true) : undefined} // Allow clicking minimized bar to expand
          >
            <span className={`${!isTranscriptExpanded ? 'block truncate text-sm' : 'whitespace-pre-wrap text-sm'}`}>
              {transcript || <span className="italic text-gray-400">No transcript available.</span>}
            </span>
          </div>
        </div>
        {/* === End Collapsible Transcript Section === */}

        {/* Main Two columns layout: Document (left) and Analysis Boxes (right) */}
        {/* Adjusted padding and gap */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow px-4 md:px-6 pb-4 overflow-hidden">
          {/* Document Panel */}
          {/* Updated card styles */}
          <div className="flex-1 md:w-2/3 flex flex-col border border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-xl">
              {/* Updated heading style */}
              <h2 className="font-semibold text-md text-gray-800">
                Clinical Documentation
              </h2>
              {/* Updated button styles */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500"> {docWordCount} words </span>
                <button onClick={handleCopyDoc} title="Copy" disabled={!clinicalDoc || isEditingDoc} className="p-1 rounded text-teal-600 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed" > <IconCopy size={16} /> </button>
                <button onClick={handleDownloadPDF} title="Download PDF" disabled={!clinicalDoc || isEditingDoc} className="p-1 rounded text-teal-600 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed" > <IconDownload size={16} /> </button>
                {isEditingDoc ? (
                  <button onClick={handleSaveEdit} title="Save Edits" className="p-1 rounded text-teal-600 hover:bg-teal-100" > <IconCheck size={16} /> </button>
                ) : (
                  <button onClick={handleStartEdit} title="Edit Document" disabled={!clinicalDoc || loading} className="p-1 rounded text-teal-600 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed" > <IconEdit size={16} /> </button>
                )}
              </div>
            </div>

            {/* Document Content Area */}
            <div className="flex-1 overflow-auto p-4">
              {isEditingDoc ? (
                 // Updated textarea style to match form inputs
                <textarea
                  className="w-full h-full border border-gray-300 rounded-lg p-3 text-sm whitespace-pre-wrap bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 min-h-[200px]"
                  value={editDocText}
                  onChange={(e) => setEditDocText(e.target.value)}
                />
              ) : (
                 // Updated prose styles for light theme
                <div className="prose prose-sm max-w-none h-full text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-teal-600 hover:prose-a:text-teal-700">
                  {loading && !clinicalDoc ? (
                    <p className="italic text-gray-500"> Generating document... </p>
                  ) : clinicalDoc ? (
                    <ReactMarkdown>{clinicalDoc}</ReactMarkdown>
                  ) : (
                    <p className="italic text-gray-500"> Document will appear here. </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Panels */}
          {/* Updated card styles */}
          <div className="w-full md:w-1/3 flex flex-col gap-6 md:gap-8 overflow-hidden">
            {/* Simplified Analysis Display - Combined into one scrollable area */}
            <div className="flex-1 border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col bg-white overflow-hidden min-h-[150px]">
               {/* Updated heading style */}
              <h2 className="font-semibold text-md mb-2 text-gray-800 flex-shrink-0">
                AI Analysis & Recommendations
              </h2>
              {/* Updated prose styles */}
              <div className="flex-1 overflow-auto prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-teal-600 hover:prose-a:text-teal-700">
                {loading && !analysis ? (
                  <p className="italic text-gray-500"> Generating analysis... </p>
                ) : analysis ? (
                  <ReactMarkdown>{analysis}</ReactMarkdown> // Assumes analysis markdown includes headings
                ) : (
                  <p className="italic text-gray-500"> Analysis and recommendations will appear here. </p>
                )}
              </div>
            </div>

             {/* Placeholder for potential other panels if needed, or remove this div */}
             {/* <div className="flex-1 border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col bg-white overflow-hidden min-h-[150px]">
                 <h2 className="font-semibold text-md mb-2 text-gray-800 flex-shrink-0">
                    Another Panel (Example)
                 </h2>
                 <div className="flex-1 overflow-auto prose prose-sm max-w-none text-gray-700">
                    Content...
                 </div>
             </div> */}
          </div>
        </div>
      </>
    );
  }

  return (
    // Updated main container styles
    <div className="flex flex-col w-full h-full bg-gray-50 text-gray-900">
      {/* Top bar: Template and Model selection dropdowns */}
      {/* Updated styles for top bar */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-4 flex-wrap flex-shrink-0 bg-white shadow-sm">
        {/* Template Dropdown */}
        <div className="relative">
          {/* Updated button styles */}
          <button
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50"
            onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)} aria-haspopup="true" aria-expanded={showTemplatesDropdown} disabled={loading}
          >
            {`${t('Template')}: ${activeTemplateName}`}
            <IconChevronDown size={16} className={`${showTemplatesDropdown ? 'transform rotate-180' : ''} transition-transform`} />
          </button>
          {/* Updated dropdown styles */}
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-gray-300 bg-white p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
              {prompts.map((prompt: Prompt) => (
                <button
                  key={prompt.id}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => { setActiveTemplateName(prompt.name); setShowTemplatesDropdown(false); if (transcript) { handleCreateDocFromTranscript(transcript); } }}
                >
                  {prompt.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative">
           {/* Updated button styles */}
          <button
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50"
            onClick={() => setShowModelsDropdown(!showModelsDropdown)} aria-haspopup="true" aria-expanded={showModelsDropdown} disabled={loading}
          >
            {`${t('Model')}: ${activeModelName}`}
            <IconChevronDown size={16} className={`${showModelsDropdown ? 'transform rotate-180' : ''} transition-transform`} />
          </button>
          {/* Updated dropdown styles */}
          {showModelsDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-gray-300 bg-white p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
              {models.map((m) => (
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 rounded"
                  onClick={() => { setActiveModelName(m.name); setShowModelsDropdown(false); if (transcript && clinicalDoc) { handleAnalyzeDoc(clinicalDoc, transcript); } else if (transcript) { handleCreateDocFromTranscript(transcript); } }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable main content area */}
      {/* Ensure container allows flex-grow */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col">
        {mainContent}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" /> {/* Scroll target */}
      </div>

      {/* Chat Input at the bottom */}
      {/* Assuming ChatInput component is styled separately or accepts theme props */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <ChatInput
          stopConversationRef={stopConversationRef}
          textareaRef={null as any} // Adjust if textareaRef is needed
          onSend={(msg) => { handleTranscriptReceived(msg.content); }}
          onRegenerate={handleRegenerate}
          onScrollDownClick={scrollToBottom}
          showScrollDownButton={!autoScrollEnabled && Boolean(chatContainerRef.current && chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight)}
        />
      </div>

      {/* Modals (Assuming they are styled consistently elsewhere) */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat; // Ensure this is the correct export for your file structure
