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
    // Only scroll the main container, not individual boxes
    if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) {
       // Check if user hasn't scrolled up significantly before auto-scrolling
       const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
       if (scrollHeight - scrollTop - clientHeight < 100) { // Only scroll if near the bottom
         messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
       }
    }
  }, 250); // Throttle calls to every 250ms


  // Effect to scroll down when content changes or loading state updates
  useEffect(() => {
    // Scroll down when new doc/analysis is generated, or loading finishes
    if (clinicalDoc || analysis || !loading) {
        throttledScrollDown();
    }
  }, [clinicalDoc, analysis, loading, throttledScrollDown]);


  // Effect to set up an Intersection Observer to disable/enable auto-scroll
  useEffect(() => {
      const currentChatContainer = chatContainerRef.current; // Capture ref value

      const handleScroll = () => {
          if (!currentChatContainer) return;
          const { scrollTop, scrollHeight, clientHeight } = currentChatContainer;
          // Disable auto-scroll if user scrolls up more than a threshold from the bottom
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
          setAutoScrollEnabled(isNearBottom);
      };

      if (currentChatContainer) {
          currentChatContainer.addEventListener('scroll', handleScroll);
      }

      // Cleanup function
      return () => {
          if (currentChatContainer) {
              currentChatContainer.removeEventListener('scroll', handleScroll);
          }
      };
  }, []); // Re-run if chatContainerRef changes (though unlikely)


  // Function to manually scroll the main container to the bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setAutoScrollEnabled(true); // Re-enable auto-scroll on manual scroll down
    }
  };

  // -----------------------------------------------
  // Create doc from transcript (Markdown output)
  // -----------------------------------------------
  const handleCreateDocFromTranscript = async (text: string) => {
    // Find the selected template content
    const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
    const templateContent = selectedTemplate?.content || ''; // Default to empty string if not found

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
`.trim(); // Use trim() to remove leading/trailing whitespace

    try {
      dispatch({ field: 'loading', value: true }); // Set loading state
      dispatch({ field: 'modelError', value: null }); // Clear previous errors
      setClinicalDoc(''); // Clear previous doc
      setAnalysis(''); // Clear previous analysis
      setIsTranscriptExpanded(true); // Expand transcript when new one is generated

      // Prepare the payload for the API call
      const payload = {
        message: docPrompt,
        history: [], // Assuming no history is needed for this specific call
        mode: 'scribe', // Specify the mode for the backend
        template_name: activeTemplateName, // Pass the active template name
      };
      // Make the API call to the backend endpoint
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
      const docMarkdown = res.data.response || ''; // Extract the Markdown response

      // Update local state with the generated document
      setClinicalDoc(docMarkdown);
      setIsEditingDoc(false); // Exit editing mode if active

      // Store the prompt and output type for potential regeneration
      setLastDocPrompt(docPrompt);
      setLastOutputType('doc');

      // Automatically run analysis after document creation
      await handleAnalyzeDoc(docMarkdown, text); // Pass newly created doc

    } catch (err) {
      console.error('[handleCreateDocFromTranscript] error =>', err);
      // Handle potential errors (e.g., display an error message)
      dispatch({ field: 'modelError', value: { message: 'Failed to create document.' } });
      setClinicalDoc(''); // Clear doc on error
      setAnalysis(''); // Clear analysis on error
    } finally {
       // Loading state for analysis is handled within handleAnalyzeDoc
       // dispatch({ field: 'loading', value: false }); // Remove this line
    }
  };

  // ------------------------------------------------------------
  // Compare doc vs transcript => highlight errors, inferred terms
  // ------------------------------------------------------------
  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => {
    // Construct the prompt for analysis
    // TODO: Consider modifying this prompt or backend to return structured data
    // for inferred terms, scoring tools, and imaging separately.
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
      // Keep loading true if it was set by the caller (handleCreateDocFromTranscript)
      // If called directly (e.g., regenerate analysis), set loading to true.
      if (!loading) dispatch({ field: 'loading', value: true });
      dispatch({ field: 'modelError', value: null }); // Clear previous errors

      // Prepare the payload for the analysis API call
      const payload = {
        message: analysisPrompt,
        history: [],
        mode: 'analysis', // Specify the analysis mode
      };
      // Make the API call
      const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
      const analysisOutput = res.data.response || ''; // Extract the analysis response

      // Update local state with the analysis output
      setAnalysis(analysisOutput);
      // Store the prompt and output type for potential regeneration
      setLastAnalysisPrompt(analysisPrompt);
      setLastOutputType('analysis'); // Set last output type to analysis
    } catch (err) {
      console.error('[handleAnalyzeDoc] error =>', err);
      // Handle potential errors
       dispatch({ field: 'modelError', value: { message: 'Failed to analyze document.' } });
       setAnalysis(''); // Clear analysis on error
    } finally {
       dispatch({ field: 'loading', value: false }); // Ensure loading state is turned off
    }
  };

  // ------------------------------------------------------------
  // Called when we get a transcript (from dictation or typed)
  // ------------------------------------------------------------
  const handleTranscriptReceived = async (text: string) => {
    setTranscript(text); // Update the transcript state
    await handleCreateDocFromTranscript(text); // Trigger document creation and analysis
  };

  // ------------------------------------------------------------
  // Regenerate => re-call the last prompt (doc or analysis)
  // ------------------------------------------------------------
  const handleRegenerate = async () => {
    dispatch({ field: 'modelError', value: null }); // Clear any previous errors
    setIsTranscriptExpanded(true); // Expand transcript on regenerate

    if (lastOutputType === 'doc' && transcript) { // Ensure transcript exists for doc regen
      // Regenerate the clinical document (which will also trigger analysis)
      if (!lastDocPrompt) return; // Do nothing if there's no previous doc prompt
      try {
        dispatch({ field: 'loading', value: true });
        setClinicalDoc(''); // Clear current doc
        setAnalysis(''); // Clear current analysis
        const payload = {
          message: lastDocPrompt,
          history: [],
          mode: 'scribe',
          template_name: activeTemplateName,
        };
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        const docMarkdown = res.data.response || '';
        setClinicalDoc(docMarkdown);
        // After doc re-generation, run analysis again
        await handleAnalyzeDoc(docMarkdown, transcript); // Pass the regenerated doc and original transcript
      } catch (err) {
        console.error('[handleRegenerate - doc] error =>', err);
         dispatch({ field: 'modelError', value: { message: 'Failed to regenerate document.' } });
         setClinicalDoc(''); // Clear doc on error
         setAnalysis(''); // Clear analysis on error
         dispatch({ field: 'loading', value: false }); // Turn off loading on error
      } // finally is handled by handleAnalyzeDoc
    } else if (lastOutputType === 'analysis' && clinicalDoc && transcript) { // Ensure doc and transcript exist for analysis regen
      // Regenerate the analysis only
      if (!lastAnalysisPrompt) return; // Need analysis prompt
      try {
        dispatch({ field: 'loading', value: true });
        setAnalysis(''); // Clear current analysis
        const payload = {
          message: lastAnalysisPrompt, // Use the stored analysis prompt
          history: [],
          mode: 'analysis',
        };
        const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
        setAnalysis(res.data.response || ''); // Update only the analysis state
      } catch (err) {
        console.error('[handleRegenerate - analysis] error =>', err);
         dispatch({ field: 'modelError', value: { message: 'Failed to regenerate analysis.' } });
         setAnalysis(''); // Clear analysis on error
      } finally {
         dispatch({ field: 'loading', value: false });
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
      // Consider using a less intrusive notification (e.g., toast) instead of alert
      alert('Document copied to clipboard!');
    } catch (err) {
      console.error('[handleCopyDoc] failed =>', err);
      alert('Failed to copy document.'); // Inform user about failure
    }
  };

  // Function to download the clinical document as a PDF
  const handleDownloadPDF = () => {
    if (!clinicalDoc) return;
    // Generate a timestamp for the filename
    const now = new Date();
    const timeStamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'), // Month is 0-indexed
      String(now.getDate()).padStart(2, '0'),
      '_',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    // Define the PDF structure using pdfMake
    const pdfDefinition = {
      content: [
        { text: 'Clinical Document', style: 'header', margin: [0, 0, 0, 10] as [number, number, number, number] }, // Add margin type assertion
        { text: clinicalDoc, margin: [0, 0, 0, 10] as [number, number, number, number] }, // Add margin type assertion
      ],
      styles: {
        header: { fontSize: 14, bold: true },
      },
    };
    // Create and download the PDF
    pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`);
  };

  // Toggle functions for editing the document
  const handleStartEdit = () => {
    if (!clinicalDoc) return;
    setIsEditingDoc(true);
    setEditDocText(clinicalDoc); // Initialize textarea with current doc content
  };
  const handleSaveEdit = () => {
    setIsEditingDoc(false);
    setClinicalDoc(editDocText); // Save the edited text
    // Re-run analysis after saving edits, using the updated doc
    if (transcript) {
        handleAnalyzeDoc(editDocText, transcript);
    }
  };

  // Decide what content to render in the main area based on state
  const noTranscript = !transcript; // Check if a transcript exists
  let mainContent: ReactNode; // Variable to hold the main content JSX

  if (modelError && !loading) { // Only show error if not loading
    // Display error message if there's a model error
    mainContent = <ErrorMessageDiv error={modelError} />;
  } else if (noTranscript && !loading) { // Show initial state only if not loading
    // Initial state: Show options to start dictation or office visit
    mainContent = (
      <div className="px-4 py-6 w-full h-full flex flex-col">
        {/* Heading and introductory text */}
        <div className="mb-4 text-center">
          {/* Updated heading color */}
          <h1 className="text-xl font-bold text-[#2D4F6C] dark:text-[#68A9A9]">Metrix AI Clinical Scribe</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-xl mx-auto">
            Use the clinical scribe to record speech or consultations.
            Select a template from the options above and produce a
            professional clinical document with associated recommendations.
            You can then download or copy it into the patient's EHR.
          </p>
        </div>

        {/* Buttons for starting actions */}
        <div className="flex flex-col md:flex-row items-center justify-evenly flex-1 gap-4 md:gap-8 mt-4">
          {/* Voice Mode Button/Area - Updated border */}
          <div
            className="w-full md:w-[45%] flex flex-col items-center justify-center border border-[#3D7F80] rounded-lg p-4 shadow-md hover:shadow-lg hover:border-[#2D4F6C] transition-all duration-200"
            style={{
              backgroundImage: "url('/VoiceMode.png')", // Ensure this path is correct
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '200px', // Ensure minimum height
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
          {/* Start Office Visit Button/Area - Updated border */}
          <div
            className="w-full md:w-[45%] flex flex-col items-center justify-center border border-[#3D7F80] rounded-lg p-4 shadow-md hover:shadow-lg hover:border-[#2D4F6C] transition-all duration-200"
            style={{
              backgroundImage: "url('/StartOfficeVisit.png')", // Ensure this path is correct
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '200px', // Ensure minimum height
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
    // State when transcript exists OR when loading: Show transcript, doc, and analysis layout
    mainContent = (
       // Use a fragment <> to avoid extra div here if not needed
       <>
         {/* === Collapsible Transcript Section === */}
         <div className="px-4 pt-2 mb-6"> {/* Container for transcript area */}
            <div className="flex items-center justify-between mb-2"> {/* Header with label and toggle */}
                <h2 className="text-lg font-semibold text-[#2D4F6C] dark:text-[#68A9A9]">Transcript</h2>
                <button
                    onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                    className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30"
                    title={isTranscriptExpanded ? "Minimize Transcript" : "Expand Transcript"}
                    aria-expanded={isTranscriptExpanded}
                >
                    {isTranscriptExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </button>
            </div>
            {/* Transcript Content Box */}
            <div className={`
                w-full bg-gray-100 dark:bg-gray-700 text-black dark:text-white
                rounded shadow border border-[#68A9A9]/30 transition-all duration-300 ease-in-out
                ${isTranscriptExpanded
                    ? 'p-4 h-auto max-h-48 overflow-y-auto' // Expanded: padding, auto height, max height, scroll
                    : 'p-2 h-7 overflow-hidden whitespace-nowrap' // Minimized: less padding, fixed height, no wrap
                }
            `}>
                 {/* Use span with truncate for minimized state */}
                 <span className={`${!isTranscriptExpanded ? 'block truncate' : 'whitespace-pre-wrap'}`}> {/* Use pre-wrap when expanded */}
                    {transcript || <span className="italic text-gray-400">No transcript available.</span>}
                 </span>
            </div>
         </div>
         {/* === End Collapsible Transcript Section === */}


         {/* Main Two columns layout: Document (left) and Analysis Boxes (right) */}
         {/* Height constrained on medium+ screens */}
         <div className="flex flex-col md:flex-row gap-4 md:h-[58vh] px-4 pb-4">

             {/* Left Column: Clinical Document - Updated border */}
             <div className="flex-1 md:w-2/3 flex flex-col border border-[#2D4F6C] rounded-md shadow bg-white dark:bg-gray-800 overflow-hidden">
                 {/* Sticky Header for Doc Actions - Updated border and text */}
                 <div className="flex items-center justify-between p-3 border-b border-[#68A9A9]/50 flex-shrink-0">
                     <h2 className="font-semibold text-md text-[#2D4F6C] dark:text-[#68A9A9]">Clinical Documentation</h2>
                     <div className="flex items-center space-x-2">
                         <span className="text-xs text-gray-500 dark:text-gray-400">{docWordCount} words</span>
                         {/* Updated Icons Color and Hover */}
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
                         {/* Toggle between Edit and Save icons */}
                         {isEditingDoc ? (
                             <button
                                 onClick={handleSaveEdit}
                                 title="Save Edits"
                                 className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30" // Use teal for save
                             >
                                 <IconCheck size={16} />
                             </button>
                         ) : (
                             <button
                                 onClick={handleStartEdit}
                                 title="Edit Document"
                                 disabled={!clinicalDoc || loading} // Disable edit if no doc or loading
                                 className="p-1 rounded text-[#3D7F80] hover:bg-[#68A9A9]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 <IconEdit size={16} />
                             </button>
                         )}
                     </div>
                 </div>

                 {/* Scrollable Content Area for Doc */}
                 <div className="flex-1 overflow-auto p-4">
                     {isEditingDoc ? (
                         <textarea
                             // Updated focus ring color
                             className="w-full h-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3D7F80] min-h-[200px]"
                             value={editDocText}
                             onChange={(e) => setEditDocText(e.target.value)}
                         />
                     ) : (
                         // Render Markdown using ReactMarkdown with prose styling
                         <div className="prose prose-sm dark:prose-invert max-w-none h-full">
                             {loading && !clinicalDoc ? (
                                 <p className="italic text-gray-500 dark:text-gray-400">Generating document...</p>
                             ) : clinicalDoc ? (
                                 <ReactMarkdown>{clinicalDoc}</ReactMarkdown>
                             ) : (
                                 <p className="italic text-gray-500 dark:text-gray-400">Document will appear here.</p>
                             )}
                         </div>
                     )}
                 </div>
             </div>

             {/* Right Column: Analysis Boxes - Updated border */}
             <div className="w-full md:w-1/3 flex flex-col gap-4">

                 {/* Box 1: Inferred Terms - Updated border and header text */}
                 <div className="flex-1 border border-[#3D7F80] rounded-md shadow p-4 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-[100px]">
                     <h2 className="font-semibold text-md mb-2 text-[#2D4F6C] dark:text-[#68A9A9] flex-shrink-0">Suspect/Inferred Terms</h2>
                     <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                         {/* TODO: Replace this with specifically parsed inferred terms content */}
                         {loading && !analysis ? (
                             <p className="italic text-gray-500 dark:text-gray-400">Generating analysis...</p>
                         ) : analysis ? (
                             <ReactMarkdown>{analysis}</ReactMarkdown>
                         ) : (
                             <p className="italic text-gray-500 dark:text-gray-400">Analysis will appear here.</p>
                         )}
                     </div>
                 </div>

                 {/* Box 2: Scoring Tools - Updated border and header text */}
                 <div className="flex-1 border border-[#3D7F80] rounded-md shadow p-4 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-[100px]">
                     <h2 className="font-semibold text-md mb-2 text-[#2D4F6C] dark:text-[#68A9A9] flex-shrink-0">Clinical Scoring Tools</h2>
                     <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                         {/* TODO: Replace this with specifically parsed scoring tools content */}
                          {loading && !analysis ? (
                             <p className="italic text-gray-500 dark:text-gray-400">Generating analysis...</p>
                         ) : analysis ? (
                             <ReactMarkdown>{analysis}</ReactMarkdown>
                         ) : (
                             <p className="italic text-gray-500 dark:text-gray-400">Analysis will appear here.</p>
                         )}
                     </div>
                 </div>

                 {/* Box 3: Imaging Recommendations - Updated border and header text */}
                 <div className="flex-1 border border-[#3D7F80] rounded-md shadow p-4 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-[100px]">
                     <h2 className="font-semibold text-md mb-2 text-[#2D4F6C] dark:text-[#68A9A9] flex-shrink-0">Early Imaging Recommendations</h2>
                     <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                         {/* TODO: Replace/augment this with specifically parsed imaging recommendations from analysis */}
                         {loading && !analysis ? (
                             <p className="italic text-gray-500 dark:text-gray-400">Generating analysis...</p>
                         ) : (
                            // Display static recommendations + AI analysis if available
                            <>
                                {/* Use prose styles for list */}
                                <p>Consider early imaging based on clinical presentation:</p>
                                <ul>
                                    <li><strong>Chest X-ray:</strong> Chest pain, shortness of breath, worsening cough.</li>
                                    <li><strong>CT Head:</strong> Severe headache, high-risk falls, unexplained neurological symptoms.</li>
                                    <li><strong>Point-of-Care Ultrasound (POCUS):</strong> Peritonitic abdominal pain, trauma-related abdominal pain, suspected gallstones, hydronephrosis concerns, pregnancy complications.</li>
                                </ul>
                                {analysis && (
                                    <>
                                        {/* Updated divider color */}
                                        <hr className="my-2 border-[#68A9A9]/50"/>
                                        <p><strong className="text-[#2D4F6C] dark:text-[#68A9A9]">AI Suggestions:</strong></p>
                                        {/* Render the full analysis again here, assuming imaging is part of it */}
                                        <ReactMarkdown>{analysis}</ReactMarkdown>
                                    </>
                                )}
                            </>
                         ) }
                     </div>
                 </div>
             </div> {/* End Right Column */}
         </div> {/* End Main Two Column Layout */}
       </> // End fragment
    );
  }

  // Render the main chat UI structure
  return (
    // Main container takes full height and width, flex column layout
    <div className="flex flex-col w-full h-full bg-white dark:bg-[#343541] text-black dark:text-white">
      {/* Top bar: Template and Model selection dropdowns - Updated border */}
      <div className="border-b border-[#68A9A9]/50 px-4 py-2 flex items-center gap-4 flex-wrap flex-shrink-0">
        {/* Template Dropdown - Updated styles */}
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md border border-[#3D7F80] bg-white dark:bg-gray-800 px-3 py-2
                       text-sm font-semibold text-[#2D4F6C] dark:text-gray-100 hover:bg-[#68A9A9]/20 dark:hover:bg-[#3D7F80]/30 disabled:opacity-50"
            onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
            aria-haspopup="true"
            aria-expanded={showTemplatesDropdown}
            disabled={loading} // Disable while loading
          >
            {`${t('Template')}: ${activeTemplateName}`}
            <IconChevronDown size={16} className={`${showTemplatesDropdown ? 'transform rotate-180' : ''} transition-transform`} />
          </button>
          {/* Dropdown Menu - Updated styles */}
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-[#3D7F80]
                           bg-white dark:bg-gray-800 p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
              {prompts.map((prompt: Prompt) => (
                <button
                  key={prompt.id}
                  className="block w-full text-left px-3 py-2 text-sm text-[#2D4F6C] dark:text-gray-200
                             hover:bg-[#68A9A9]/30 dark:hover:bg-[#3D7F80]/50 rounded"
                  onClick={() => {
                    setActiveTemplateName(prompt.name);
                    setShowTemplatesDropdown(false);
                    // Trigger regeneration if template changes and transcript exists
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

        {/* Model Dropdown - Updated styles */}
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-md border border-[#3D7F80] bg-white dark:bg-gray-800 px-3 py-2
                       text-sm font-semibold text-[#2D4F6C] dark:text-gray-100 hover:bg-[#68A9A9]/20 dark:hover:bg-[#3D7F80]/30 disabled:opacity-50"
            onClick={() => setShowModelsDropdown(!showModelsDropdown)}
             aria-haspopup="true"
             aria-expanded={showModelsDropdown}
             disabled={loading} // Disable while loading
          >
            {`${t('Model')}: ${activeModelName}`}
             <IconChevronDown size={16} className={`${showModelsDropdown ? 'transform rotate-180' : ''} transition-transform`} />
          </button>
          {/* Dropdown Menu - Updated styles */}
          {showModelsDropdown && (
            <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-[#3D7F80]
                           bg-white dark:bg-gray-800 p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
              {models.map((m) => (
                <button
                  key={m.id}
                  className="block w-full text-left px-3 py-2 text-sm text-[#2D4F6C] dark:text-gray-200
                             hover:bg-[#68A9A9]/30 dark:hover:bg-[#3D7F80]/50 rounded"
                  onClick={() => {
                    setActiveModelName(m.name);
                    setShowModelsDropdown(false);
                    // Note: Changing the model might require re-running logic.
                    // Consider triggering regeneration if needed, similar to template change.
                     if (transcript && clinicalDoc) { // Regenerate analysis if doc exists
                         handleAnalyzeDoc(clinicalDoc, transcript);
                     } else if (transcript) { // Regenerate doc if only transcript exists
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
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pb-40 flex flex-col" // Added flex flex-col
      >
        {/* Render the main content determined earlier */}
        {mainContent}

        {/* Empty div at the bottom to act as a scroll target for the main container */}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* Chat Input component at the bottom */}
       <div className="flex-shrink-0"> {/* Wrap ChatInput to prevent it from shrinking */}
        <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={null as any} // Assuming ChatInput handles its own ref if needed
            onSend={(msg) => {
            // Treat user text input as a new transcript
            handleTranscriptReceived(msg.content);
            }}
            onRegenerate={handleRegenerate} // Pass regenerate handler
            onScrollDownClick={scrollToBottom} // Pass scroll handler
            // Show scroll down button only if auto-scroll is disabled AND content is scrollable
            showScrollDownButton={
                !autoScrollEnabled &&
                chatContainerRef.current &&
                chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight
            }
            isLoading={loading} // Pass loading state to ChatInput
            // Pass accent color to ChatInput if it accepts props for styling
            // accentColor="#3D7F80"
        />
       </div>

      {/* Modals (conditionally rendered based on openModal state) */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
});

// Set display name for React DevTools
Chat.displayName = 'Chat';
export default Chat; // Export the component
