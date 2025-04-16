// /components/Chat/Chat.tsx
// CORRECTED VERSION 2 (Removes incorrect ErrorMessage import)

import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit,
  IconCheck,
  IconChevronUp,
  IconAlertTriangle, // For errors
  IconInfoCircle, // For info messages
  IconLoader2, // For loading states
  IconX, // Added for Cancel Edit button
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
import { useTranslation } from 'next-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Added for better Markdown table/strikethrough support

import HomeContext from '@/pages/api/home/home.context'; // Adjust path as needed
import { throttle } from '@/utils/data/throttle';
import { saveConversation, saveConversations } from '@/utils/app/conversation'; // Adjust path

// Child Components (ensure paths are correct)
import { ChatInput } from './ChatInput';
import { ChatTextToSpeech } from './ChatTextToSpeech';
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit';

// Modal Components (ensure paths are correct)
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

// *** CORRECTED IMPORT: Removed ErrorMessage ***
import { Conversation, Message } from '@/types/chat'; // Adjust path
import { Prompt } from '@/types/prompt'; // Adjust path

// PDF generation
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// --- Helper: Error Message Display ---
// This component now strictly expects { message: string } | null
const ErrorMessageDivComponent = ({ error }: { error: { message: string } | null }) => {
  if (!error) return null;
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center space-x-3 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-sm max-w-3xl mx-auto">
        <IconAlertTriangle size={20} className="flex-shrink-0" />
        <span className="text-sm">{error.message || 'An unexpected error occurred.'}</span>
      </div>
    </div>
  );
};

// --- Helper: Loading Indicator ---
const LoadingIndicator = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center space-x-2 text-gray-500 py-4">
    <IconLoader2 size={18} className="animate-spin" />
    <span className="text-sm italic">{text}</span>
  </div>
);


interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

type OutputType = 'doc' | 'analysis' | null;

export const Chat = memo(function Chat({ stopConversationRef }: Props) {
  const { t } = useTranslation('chat');

  const {
    state: {
      modelError, // Type is determined by context, not imported here
      loading,
      conversations,
      selectedConversation,
      openModal,
      models,
      prompts,
      textInputContent, // Get textInputContent from context
    },
    dispatch,
    handleUpdateConversation,
  } = useContext(HomeContext);

  // --- LOCAL STATES (Logic Preserved) ---
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note'); // Default template
  const [activeModelName, setActiveModelName] = useState('GPT-4'); // Default model
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');
  const [copySuccessDoc, setCopySuccessDoc] = useState(false); // State for copy feedback

  // --- REFS & SCROLL (Logic Preserved) ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialInputRef = useRef<HTMLTextAreaElement | null>(null); // Ref for initial text input
  const followUpInputRef = useRef<HTMLTextAreaElement | null>(null); // Ref for follow-up text input
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const throttledScrollDown = throttle(() => {
    if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // Scroll if near bottom or content height is less than container height
      if (scrollHeight - scrollTop - clientHeight < 150 || scrollHeight <= clientHeight) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, 250);

  useEffect(() => {
    if (clinicalDoc || analysis || loading) { // Scroll when content appears or loading starts
      throttledScrollDown();
    }
  }, [clinicalDoc, analysis, loading, throttledScrollDown]);

  useEffect(() => {
    const currentChatContainer = chatContainerRef.current;
    const handleScroll = () => {
      if (!currentChatContainer) return;
      const { scrollTop, scrollHeight, clientHeight } = currentChatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // Threshold
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
  }, []); // Only run on mount and unmount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScrollEnabled(true);
  };

  // --- API Call Functions (Logic Preserved - Minor Refinements) ---

  const handleCreateDocFromTranscript = async (text: string) => {
    const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
    const templateContent = selectedTemplate?.content || 'Default template if not found: Structure the notes clearly.'; // Fallback
    const docPrompt = `
You are a helpful clinical scribe AI. Return your output in Markdown format with headings in **bold** or '#' style, bullet points, etc.

Template (headings/format):
--------------------------
${templateContent}

User Transcript/Input:
--------------------------
${text}

Instructions:
- Fill in or expand on the above template headings using the transcript/input details.
- Ensure final answer is Markdown (headings in **bold** or using #).
`.trim();

    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });
      setClinicalDoc(''); // Clear previous doc
      setAnalysis(''); // Clear previous analysis
      setIsTranscriptExpanded(true); // Expand transcript view
      setLastOutputType(null); // Reset last output type

      const payload = { message: docPrompt, history: [], mode: 'scribe', template_name: activeTemplateName, model_name: activeModelName }; // Added model_name
      console.log("Sending to scribe endpoint:", payload);
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload); // Ensure endpoint is correct
      const docMarkdown = res.data.response || '';
      setClinicalDoc(docMarkdown);
      setIsEditingDoc(false); // Ensure not in edit mode
      setLastDocPrompt(docPrompt); // Store prompt for potential regeneration
      setLastOutputType('doc'); // Set last output type
      await handleAnalyzeDoc(docMarkdown, text); // Run analysis after doc creation
    } catch (err: any) { // Explicitly type err
      console.error('[handleCreateDocFromTranscript] error =>', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create document. Please check the API connection and try again.';
      // Dispatch an object that likely matches the structure your reducer expects for modelError
      dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
      setClinicalDoc('');
      setAnalysis('');
      dispatch({ type: 'change', field: 'loading', value: false });
    } finally {
      // Loading state is handled within handleAnalyzeDoc or the catch block above
    }
  };

  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => {
    const analysisPrompt = `
You are a clinical summarizer focusing on:
1) **Potential Transcription Errors**: Highlight words/phrases that might be inaccurate based on clinical context (output as a list).
2) **Inferred Clinical Terms**: Identify potential diagnoses, signs, symptoms not explicitly stated but implied (output as a list).
3) **Recommendations**: Suggest relevant next steps based on the active template (${activeTemplateName}) and clinical context. Include potential scoring tools, investigations (labs/imaging), and basic management considerations if appropriate (output as lists or paragraphs under clear headings).

Please return your result in **Markdown** format with clear headings for each section (e.g., ## Potential Transcription Errors, ## Inferred Clinical Terms, ## Recommendations).

Transcript/Input:
-----------
${rawTranscript}

Clinical Document:
------------------
${doc}
`.trim();

    try {
      if (!loading) {
        dispatch({ type: 'change', field: 'loading', value: true });
      }
      dispatch({ type: 'change', field: 'modelError', value: null });

      const payload = { message: analysisPrompt, history: [], mode: 'analysis', model_name: activeModelName }; // Added model_name
      console.log("Sending to analysis endpoint:", payload);
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload); // Ensure endpoint is correct
      const analysisOutput = res.data.response || '';
      setAnalysis(analysisOutput);
      setLastAnalysisPrompt(analysisPrompt); // Store for regeneration
    } catch (err: any) { // Explicitly type err
      console.error('[handleAnalyzeDoc] error =>', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to analyze document.';
       // Dispatch an object that likely matches the structure your reducer expects for modelError
      dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
      setAnalysis(''); // Clear analysis on error
    } finally {
      dispatch({ type: 'change', field: 'loading', value: false }); // Always set loading false when analysis finishes/errors
    }
  };

  // Handler for initial input (Dictation, Consultation, or Text Input)
  const handleInitialInput = async (text: string) => {
    if (!text.trim()) return; // Ignore empty input
    setTranscript(text); // Set the transcript state
    dispatch({ type: 'change', field: 'textInputContent', value: '' }); // Clear context input bar after sending
    await handleCreateDocFromTranscript(text); // Generate document and analysis
  };

  // Handler specifically for the follow-up input bar
  const handleSendFollowUp = async (message: Message) => {
     // Basic placeholder - ideally, this would interact with the existing doc/analysis
    console.log("Follow-up message received (needs implementation):", message.content);
    alert("Follow-up functionality not fully implemented in this example.");
    dispatch({ type: 'change', field: 'textInputContent', value: '' }); // Clear context input bar
  };


  const handleRegenerate = async () => {
    dispatch({ type: 'change', field: 'modelError', value: null }); // Clear errors
    setIsTranscriptExpanded(true); // Expand transcript view

    if (lastOutputType === 'doc' && transcript && lastDocPrompt) {
      // Regenerate Document (and subsequently Analysis)
      try {
        dispatch({ type: 'change', field: 'loading', value: true });
        setClinicalDoc('');
        setAnalysis('');
        const payload = { message: lastDocPrompt, history: [], mode: 'scribe', template_name: activeTemplateName, model_name: activeModelName };
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        const docMarkdown = res.data.response || '';
        setClinicalDoc(docMarkdown);
        await handleAnalyzeDoc(docMarkdown, transcript); // Re-analyze after regenerating doc
      } catch (err: any) { // Explicitly type err
        console.error('[handleRegenerate - doc] error =>', err);
         const errorMsg = err.response?.data?.detail || err.message || 'Failed to regenerate document.';
        // Dispatch an object that likely matches the structure your reducer expects for modelError
        dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
        setClinicalDoc('');
        setAnalysis('');
        dispatch({ type: 'change', field: 'loading', value: false });
      }
    } else if (lastOutputType === 'analysis' && clinicalDoc && transcript && lastAnalysisPrompt) {
      // Regenerate Only Analysis
       if (!lastAnalysisPrompt) return;
       try {
         dispatch({ type: 'change', field: 'loading', value: true });
         setAnalysis(''); // Clear previous analysis
         const payload = { message: lastAnalysisPrompt, history: [], mode: 'analysis', model_name: activeModelName };
         const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
         setAnalysis(res.data.response || '');
       } catch (err: any) { // Explicitly type err
         console.error('[handleRegenerate - analysis] error =>', err);
         const errorMsg = err.response?.data?.detail || err.message || 'Failed to regenerate analysis.';
        // Dispatch an object that likely matches the structure your reducer expects for modelError
         dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
         setAnalysis('');
       } finally {
         dispatch({ type: 'change', field: 'loading', value: false });
       }
    } else if (transcript) {
      // Fallback: If state is unclear but we have a transcript, regenerate doc & analysis
      await handleCreateDocFromTranscript(transcript);
    } else {
        // Nothing to regenerate
        // Dispatch an object that likely matches the structure your reducer expects for modelError
        dispatch({ type: 'change', field: 'modelError', value: { message: 'No previous input found to regenerate.' } });
    }
  };

  // --- Utility Functions (Logic Preserved, minor UI feedback added) ---
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;

  const handleCopyDoc = async () => {
    if (!clinicalDoc || isEditingDoc) return;
    try {
      await navigator.clipboard.writeText(clinicalDoc);
      setCopySuccessDoc(true); // Set success state
      setTimeout(() => setCopySuccessDoc(false), 1500); // Reset after 1.5s
    } catch (err) {
      console.error('[handleCopyDoc] failed =>', err);
      alert('Failed to copy document.'); // Simple alert fallback
    }
  };

  const handleDownloadPDF = () => {
    if (!clinicalDoc || isEditingDoc) return;
    try {
        const now = new Date();
        const timeStamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

        const content = clinicalDoc.split('\n').map(line => {
            if (line.startsWith('# ')) return { text: line.substring(2), style: 'h1', margin: [0, 5, 0, 5] as [number, number, number, number] };
            if (line.startsWith('## ')) return { text: line.substring(3), style: 'h2', margin: [0, 5, 0, 5] as [number, number, number, number] };
            if (line.startsWith('**') && line.endsWith('**')) return { text: line.substring(2, line.length - 2), bold: true };
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                return { ul: [ line.trim().substring(2) ], margin: [10, 0, 0, 2] as [number, number, number, number] }; // Use ul for bullets
            }
            return { text: line, margin: [0, 0, 0, 5] as [number, number, number, number] };
        });

        // Attempt to group bullet points
        const groupedContent: any[] = [];
        let currentList: any[] | null = null;

        content.forEach(item => {
            if (item.ul) {
                if (!currentList) {
                    currentList = item.ul;
                    groupedContent.push({ ul: currentList, margin: [10, 0, 0, 2] });
                } else {
                    currentList.push(item.ul[0]); // Add item to existing list
                }
            } else {
                currentList = null; // End of list
                groupedContent.push(item);
            }
        });


        const pdfDefinition: any = { // Use any for flexibility with pdfmake types
            content: groupedContent,
            styles: {
                h1: { fontSize: 16, bold: true },
                h2: { fontSize: 14, bold: true },
            },
            defaultStyle: {
                fontSize: 10,
                lineHeight: 1.3,
            }
        };
        pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Document content might be too complex for basic conversion.");
    }
  };


  const handleStartEdit = () => {
    if (!clinicalDoc || loading) return;
    setIsEditingDoc(true);
    setEditDocText(clinicalDoc);
  };

  const handleSaveEdit = async () => {
    setIsEditingDoc(false);
    setClinicalDoc(editDocText); // Update the main doc state
    if (transcript) {
      // Re-analyze the *edited* document content
      await handleAnalyzeDoc(editDocText, transcript);
    }
  };

  const handleCancelEdit = () => {
      setIsEditingDoc(false);
      setEditDocText(''); // Clear edit buffer
  };

  // --- Conditional Rendering Logic (Redesigned) ---
  const hasTranscript = Boolean(transcript);
  let mainContent: ReactNode;

   // Prepare the error prop for ErrorMessageDivComponent, ensuring it matches the expected type.
   const errorForDiv = modelError
     ? { message: (modelError as any)?.message || 'An unexpected error occurred.' }
     : null;


  if (!hasTranscript && !loading && !modelError) {
    // --- REDESIGNED "Initial Screen / No Transcript" View ---
    mainContent = (
      <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 text-center">
        <div className="w-full max-w-4xl">
          {/* Title and Instructions */}
          <h1 className="text-3xl font-bold text-teal-800 mb-2 animate-fadeInUp">
            Clinical Scribe Assistant
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Select a template and model above. Then, start by recording audio, initiating a consultation, or typing your summary below.
          </p>

          {/* Action Buttons: Dictation & Consultation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            {/* Dictation Button */}
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white">
              <ChatTextToSpeech
                 onSend={(msg) => { handleInitialInput(msg.content); }}
              />
            </div>

            {/* Consultation Button */}
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white">
              <ChatStartOfficeVisit
                 onSend={(msg) => { handleInitialInput(msg.content); }}
              />
            </div>
          </div>

          {/* Separator */}
           <div className="relative flex items-center justify-center my-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                  <span className="bg-gray-50 px-3 text-sm text-gray-500">Or type directly</span>
              </div>
          </div>


          {/* Initial Text Input */}
          <div className="mt-6 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={initialInputRef} // Use specific ref for this input
              onSend={(msg) => handleInitialInput(msg.content)} // Use initial input handler
              onRegenerate={() => { /* No regenerate action here */ }}
              onScrollDownClick={() => { /* No scroll down here */ }}
              showScrollDownButton={false}
              placeholder="Type or paste your clinical summary, notes, or transcription here..." // Context-specific placeholder
              showRegenerateButton={false} // Hide regenerate on initial screen
            />
          </div>
        </div>
      </div>
    );
  } else {
     // --- REDESIGNED "Main View / Transcript Exists" Styling ---
    mainContent = (
      <>
        {/* === Error Display (if any) === */}
        <ErrorMessageDivComponent error={errorForDiv} />

        {/* === Collapsible Transcript Section === */}
        {hasTranscript && (
            <div className="px-4 md:px-6 pt-3 mb-4 border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-teal-800">
                    Input Transcript
                    </h2>
                    <button
                    onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                    className="p-1 rounded text-teal-600 hover:bg-teal-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    title={isTranscriptExpanded ? 'Collapse Transcript' : 'Expand Transcript'}
                    aria-expanded={isTranscriptExpanded}
                    >
                    {isTranscriptExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </button>
                </div>
                <div
                    className={`
                    w-full bg-gray-100 text-gray-800
                    rounded-md shadow-inner border border-gray-200 transition-all duration-300 ease-in-out
                    ${isTranscriptExpanded ? 'p-3 max-h-40 overflow-y-auto text-sm' : 'p-2 h-9 overflow-hidden whitespace-nowrap cursor-pointer text-xs'}
                    `}
                    onClick={!isTranscriptExpanded ? () => setIsTranscriptExpanded(true) : undefined}
                >
                    <span className={`${!isTranscriptExpanded ? 'block truncate' : 'whitespace-pre-wrap'}`}>
                    {transcript || <span className="italic text-gray-500">No transcript available.</span>}
                    </span>
                </div>
            </div>
        )}
        {/* === End Collapsible Transcript Section === */}

        {/* Main Two columns layout */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow px-4 md:px-6 pb-4 overflow-hidden">

          {/* === Document Panel (Left) === */}
          <div className="flex-1 md:w-3/5 lg:w-2/3 flex flex-col border border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-xl">
              <h2 className="font-semibold text-md text-gray-800">
                Clinical Documentation
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 hidden sm:inline"> {docWordCount} words </span>
                 {/* Edit / Save / Cancel Buttons */}
                {isEditingDoc ? (
                    <>
                    <button onClick={handleSaveEdit} title="Save Edits" className="p-1.5 rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"> <IconCheck size={16} /> </button>
                    <button onClick={handleCancelEdit} title="Cancel Edits" className="p-1.5 rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"> <IconX size={16}/> </button> {/* Use IconX */}
                    </>
                ) : (
                    <button onClick={handleStartEdit} title="Edit Document" disabled={!clinicalDoc || loading || isEditingDoc} className="p-1 rounded text-teal-600 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed" > <IconEdit size={16} /> </button>
                )}
                {/* Copy Button */}
                <button onClick={handleCopyDoc} title="Copy" disabled={!clinicalDoc || isEditingDoc || loading} className={`p-1 rounded transition-colors duration-200 ${ copySuccessDoc ? 'bg-green-100 text-green-700' : 'text-teal-600 hover:bg-teal-100' } disabled:opacity-50 disabled:cursor-not-allowed`} > {copySuccessDoc ? <IconCheck size={16} /> : <IconCopy size={16} />} </button>
                {/* Download Button */}
                <button onClick={handleDownloadPDF} title="Download PDF" disabled={!clinicalDoc || isEditingDoc || loading} className="p-1 rounded text-teal-600 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed" > <IconDownload size={16} /> </button>

              </div>
            </div>

            {/* Document Content Area */}
            <div className="flex-1 overflow-auto p-4">
              {isEditingDoc ? (
                <textarea
                  className="w-full h-full border border-gray-300 rounded-lg p-3 text-sm whitespace-pre-wrap bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 min-h-[300px] font-mono" // Added font-mono for editing
                  value={editDocText}
                  onChange={(e) => setEditDocText(e.target.value)}
                  autoFocus
                />
              ) : (
                <div className="prose prose-sm max-w-none h-full text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5">
                  {loading && !clinicalDoc ? (
                    <LoadingIndicator text="Generating document..." />
                  ) : clinicalDoc ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{clinicalDoc}</ReactMarkdown>
                  ) : !modelError && hasTranscript ? ( // Only show placeholder if no error *and* transcript exists
                     <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
                       <IconInfoCircle size={24} className="mb-2"/>
                       <span>Document will appear here once generated.</span>
                    </div>
                  ) : null } {/* Don't show placeholder if there's an error or no transcript yet */}
                </div>
              )}
            </div>
          </div>

          {/* === Analysis Panel (Right) === */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col border border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden min-h-[300px]">
            {/* Panel Header */}
             <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-xl">
                <h2 className="font-semibold text-md text-gray-800">
                    AI Analysis & Recommendations
                </h2>
                {/* Optional: Add regenerate analysis button? */}
             </div>
            {/* Analysis Content Area */}
            <div className="flex-1 overflow-auto p-4 prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5">
              {loading && clinicalDoc && !analysis ? ( // Show loading only if doc exists but analysis is pending
                <LoadingIndicator text="Generating analysis..." />
              ) : analysis ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown> // Assumes analysis markdown includes headings
              ) : clinicalDoc && !modelError ? ( // Only show placeholder if doc generated and no error
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
                     <IconInfoCircle size={24} className="mb-2"/>
                    <span>Analysis will appear here.</span>
                 </div>
              ) : !clinicalDoc && hasTranscript && !modelError ? ( // Show waiting message if transcript exists but doc doesn't (and no error)
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
                     <IconInfoCircle size={24} className="mb-2"/>
                    <span>Generate a document first.</span>
                 </div>
              ): null } {/* Don't show placeholder if there's an error or no transcript */}
            </div>
          </div>
        </div>
      </>
    );
  }


  // --- Main Return Structure ---
  return (
    <div className="flex flex-col w-full h-full bg-gray-50 text-gray-900">
      {/* === Top bar: Template and Model selection === */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-start gap-4 flex-wrap flex-shrink-0 bg-white shadow-sm z-10"> {/* Added z-index */}
        {/* Template Dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => !loading && setShowTemplatesDropdown(!showTemplatesDropdown)}
            aria-haspopup="true"
            aria-expanded={showTemplatesDropdown}
            disabled={loading}
          >
            <span className="font-medium">Template:</span> {activeTemplateName}
            <IconChevronDown size={16} className={`${showTemplatesDropdown ? 'transform rotate-180' : ''} transition-transform text-gray-500`} />
          </button>
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-2 w-60 rounded-md border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto focus:outline-none">
              {prompts.length > 0 ? prompts.map((prompt: Prompt) => (
                <button
                  key={prompt.id}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded focus:bg-teal-100 focus:outline-none"
                  onClick={() => {
                      setActiveTemplateName(prompt.name);
                      setShowTemplatesDropdown(false);
                      // Optional: Re-generate doc if transcript exists when template changes?
                      if (transcript) { handleInitialInput(transcript); }
                   }}
                >
                  {prompt.name}
                </button>
              )) : <span className="block px-3 py-1.5 text-sm text-gray-500 italic">No templates loaded.</span>}
            </div>
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => !loading && setShowModelsDropdown(!showModelsDropdown)}
            aria-haspopup="true"
            aria-expanded={showModelsDropdown}
            disabled={loading}
          >
             <span className="font-medium">Model:</span> {activeModelName}
            <IconChevronDown size={16} className={`${showModelsDropdown ? 'transform rotate-180' : ''} transition-transform text-gray-500`} />
          </button>
          {showModelsDropdown && (
            <div className="absolute left-0 mt-2 w-60 rounded-md border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto focus:outline-none">
              {models.length > 0 ? models.map((m: any) => ( // Use any for models if type isn't defined yet
                <button
                  key={m.id} // Assuming model object has an id property
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded focus:bg-teal-100 focus:outline-none"
                  onClick={() => {
                      setActiveModelName(m.name); // Assuming model object has a name property
                      setShowModelsDropdown(false);
                      // Optional: Re-generate analysis/doc if content exists?
                       if (clinicalDoc && transcript) { handleAnalyzeDoc(clinicalDoc, transcript); }
                       else if (transcript) { handleInitialInput(transcript); }
                   }}
                >
                  {m.name} {/* Assuming model object has a 'name' property */}
                </button>
              )): <span className="block px-3 py-1.5 text-sm text-gray-500 italic">No models available.</span>}
            </div>
          )}
        </div>
      </div>

      {/* === Scrollable main content area === */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col">
        {mainContent}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* === Bottom Chat Input (for follow-up actions when transcript exists) === */}
      {hasTranscript && !isEditingDoc && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <ChatInput
                  stopConversationRef={stopConversationRef}
                  textareaRef={followUpInputRef}
                  onSend={handleSendFollowUp} // Needs proper implementation
                  onRegenerate={handleRegenerate}
                  onScrollDownClick={scrollToBottom}
                  showScrollDownButton={!autoScrollEnabled && Boolean(chatContainerRef.current && chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight + 50)}
                  placeholder="Ask a follow-up question or give refinement instructions..."
                  showRegenerateButton={!loading && Boolean(clinicalDoc || analysis)}
              />
          </div>
      )}

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
