// file: /components/Chat/Chat.tsx (or potentially pages/clinical-scribe.tsx if it's a full page)

import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit,
  IconCheck,
  IconChevronUp, // Added for toggle
  IconPlayerStop, // from ChatInput original
  IconRepeat,     // from ChatInput original
  IconSend,       // from ChatInput original
  IconArrowDown,  // from ChatInput original
  IconBolt,       // from ChatInput original
  IconBrandGoogle,// from ChatInput original
  IconMicrophone, // from ChatTextToSpeech original
  IconLoader2,    // from ChatTextToSpeech/ChatStartOfficeVisit original
  IconUsers,      // from ChatStartOfficeVisit original
  IconPlus,       // For Add Task Line
  IconFolderPlus, // For Add Folder
  IconMistOff,    // For No Data
  IconX,          // For Close/Remove
  IconSave,       // For Save
  IconSettings,   // For Settings icon if needed
  IconHelpCircle, // For Help icon if needed
  IconTemplate,   // For Template icon
  IconCpu,        // For Model icon
  IconInfoCircle, // For Analysis section header
  IconListCheck,  // For Scoring Tools section header
  IconCamera,     // For Imaging section header
  AlertTriangle,  // Added for Error Message
} from '@tabler/icons-react'; // Using Tabler icons
import React, {
  MutableRefObject,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
  KeyboardEvent, // Added for ChatInput logic
  ChangeEvent,   // Added for ChatInput logic
} from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'next-i18next'; // Assuming i18n setup

import ReactMarkdown from 'react-markdown'; // Use react-markdown component
import remarkGfm from 'remark-gfm'; // Added for better markdown support (tables, etc.)

// Assuming context setup exists elsewhere
import HomeContext from '@/pages/api/home/home.context'; // Adjust path as needed
import { throttle } from '@/utils/data/throttle';
import { saveConversation, saveConversations } from '@/utils/app/conversation'; // Adjust path

// Assuming child components exist and are styled appropriately or accept styling props
// *** Assuming these are now correctly exported from their respective files ***
import { ChatInput } from './ChatInput'; // Adjust path
// import { ErrorMessageDiv } from './ErrorMessageDiv'; // Defined locally now
import { ChatTextToSpeech } from './ChatTextToSpeech'; // Adjust path
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit'; // Adjust path

// Assuming Modal components exist
import { ProfileModal } from '@/components/Modals/ProfileModal'; // Adjust path
// *** FIX: Changed to default import ***
import TemplatesModal from '@/components/Modals/TemplatesModal'; // Adjust path
import { HelpModal } from '@/components/Modals/HelpModal'; // Adjust path
import { SettingsModal } from '@/components/Modals/SettingsModal'; // Adjust path

// Assuming these types exist
import { Conversation, Message, Role } from '@/types/chat'; // Adjust path
import { Prompt } from '@/types/prompt'; // Adjust path
import { Plugin } from '@/types/plugin'; // Adjust path (needed for ChatInput)

// PDF generation (ensure setup is correct in your project)
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// --- Style Constants (Consistent with Theme) ---
const primaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-sm disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed";
const ghostButtonStyles = "inline-flex items-center justify-center p-2 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed";
const formInputStyles = "block w-full rounded-full border border-gray-300 py-2 px-4 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-base"; // Rounded-full for chat input
const formTextareaStyles = "block w-full rounded-lg border border-gray-300 p-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm bg-white"; // For editing doc

// --- Helper Components ---
// Defined locally to avoid import issues if ErrorMessageDiv wasn't exported
const ErrorMessageDivComponent = ({ error }: { error: { message: string } | null }) => {
  if (!error?.message) return null; // Render nothing if no error message
  return (
    <div className="px-4 pt-4 md:px-6 mb-4">
      <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm max-w-4xl mx-auto">
        <AlertTriangle size={18} className="flex-shrink-0 text-red-500" />
        <span className="text-sm">{error.message}</span>
      </div>
    </div>
  );
};
const LoadingIndicator = ({ text }: { text: string }) => (
    <div className="flex items-center justify-center space-x-2 text-gray-500 py-4 text-sm">
        <IconLoader2 size={16} className="animate-spin" />
        <span className="italic">{text}</span>
    </div>
);
const InfoPlaceholder = ({ text, icon: Icon = IconInfoCircle }: { text: string, icon?: React.ElementType }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 italic p-4 text-center">
        <Icon size={24} className="mb-2 opacity-80"/>
        <span className="text-sm">{text}</span>
    </div>
);
const ScribeHeader = () => (
    <header className="flex flex-col items-center justify-center text-center pt-6 pb-4 md:pt-8 md:pb-6 px-4 flex-shrink-0">
        <img src="/images/metrix-logo.png" alt="Metrix Logo" width={56} height={56} className="mb-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900"> Clinical Scribe Assistant </h1>
    </header>
);
const ScribeDisclaimer = ({ centered = false }: { centered?: boolean }) => (
    <div className={`mt-6 mb-4 px-4 max-w-3xl mx-auto ${ centered ? 'text-center' : 'text-left' } text-xs text-gray-500 leading-relaxed`}>
        <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
    </div>
);

// --- Main Chat Component ---
interface ChatProps { stopConversationRef: MutableRefObject<boolean>; }
type OutputType = 'doc' | 'analysis' | null;

// Use memo for performance optimization
export const Chat = memo(function Chat({ stopConversationRef }: ChatProps) {
  const { t } = useTranslation('chat');

  // Global state and dispatch from HomeContext
  const {
    state: {
      modelError,
      loading,
      models,
      prompts,
      textInputContent, // Assuming ChatInput uses this from context now
      openModal,
      defaultModelId, // Needed for creating new template
      // conversations, // Uncomment if needed
      // selectedConversation, // Uncomment if needed
    },
    dispatch,
    // handleUpdateConversation, // Uncomment if needed
  } = useContext(HomeContext);


  // --- LOCAL STATES ---
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false); // Default collapsed
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');
  const [copySuccessDoc, setCopySuccessDoc] = useState(false); // State for copy success feedback

  // --- REFS & SCROLL ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null); // Ref for ChatInput textarea
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // --- Scroll Logic (preserved) ---
  const throttledScrollDown = throttle(() => { if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) { const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current; if (scrollHeight - scrollTop - clientHeight < 100) { messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); } } }, 250);
  useEffect(() => { if (clinicalDoc || analysis || loading) throttledScrollDown(); }, [clinicalDoc, analysis, loading, throttledScrollDown]);
  useEffect(() => { const currentChatContainer = chatContainerRef.current; const handleScroll = () => { if (!currentChatContainer) return; const { scrollTop, scrollHeight, clientHeight } = currentChatContainer; const isNearBottom = scrollHeight - scrollTop - clientHeight < 80; setAutoScrollEnabled(isNearBottom); }; if (currentChatContainer) { currentChatContainer.addEventListener('scroll', handleScroll); } return () => { if (currentChatContainer) { currentChatContainer.removeEventListener('scroll', handleScroll); } }; }, []);
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setAutoScrollEnabled(true); };

  // --- API Call Functions (preserved, ensure correct error dispatch) ---
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const API_ENDPOINT = `${API_BASE_URL}/rag/ask_rag`;

  const handleCreateDocFromTranscript = async (text: string) => {
      try {
          dispatch({ type: 'change', field: 'loading', value: true });
          dispatch({ type: 'change', field: 'modelError', value: null });
          setClinicalDoc(''); setAnalysis(''); setIsTranscriptExpanded(true); setLastOutputType(null);
          const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
          const templateContent = selectedTemplate?.content || 'Default template: Structure notes clearly.';
          const docPrompt = `\nYou are a helpful clinical scribe AI... \nTemplate:\n${templateContent}\nTranscript:\n${text}\nInstructions:\n- Fill in...`.trim();
          const payload = { message: docPrompt, history: [], mode: 'scribe', template_name: activeTemplateName, model_name: activeModelName };
          const res = await axios.post(API_ENDPOINT, payload);
          const docMarkdown = res.data.response || '';
          setClinicalDoc(docMarkdown); setIsEditingDoc(false); setLastDocPrompt(docPrompt); setLastOutputType('doc');
          await handleAnalyzeDoc(docMarkdown, text);
      } catch (err: any) {
          console.error('[handleCreateDocFromTranscript] error =>', err);
          const errorMsg = err.response?.data?.detail || err.message || 'Failed to create document.';
          dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
          setClinicalDoc(''); setAnalysis('');
          dispatch({ type: 'change', field: 'loading', value: false }); // Ensure loading stops on error
      }
  };
  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => {
      try {
          // Don't set loading true here if called sequentially by handleCreateDocFromTranscript
          // if (!loading) dispatch({ type: 'change', field: 'loading', value: true });
          dispatch({ type: 'change', field: 'modelError', value: null });
           const analysisPrompt = `\nYou are a clinical summarizer focusing on...\nTranscript:\n${rawTranscript}\nClinical Document:\n${doc}`.trim();
          const payload = { message: analysisPrompt, history: [], mode: 'analysis', model_name: activeModelName };
          const res = await axios.post(API_ENDPOINT, payload);
          const analysisOutput = res.data.response || '';
          setAnalysis(analysisOutput); setLastAnalysisPrompt(analysisPrompt);
      } catch (err: any) {
          console.error('[handleAnalyzeDoc] error =>', err);
          const errorMsg = err.response?.data?.detail || err.message || 'Failed to analyze document.';
          dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
          setAnalysis('');
      } finally {
          // Always set loading false at the end of the sequence
          dispatch({ type: 'change', field: 'loading', value: false });
      }
  };

  // --- Input Handlers ---
  const handleInitialInput = async (message: Message, plugin: Plugin | null = null) => {
    const text = message.content;
    if (!text.trim()) return;
    setTranscript(text);
    dispatch({ type: 'change', field: 'textInputContent', value: '' }); // Clear input from context
    await handleCreateDocFromTranscript(text);
   };
  const handleSendFollowUp = async (message: Message, plugin: Plugin | null = null) => {
    // Placeholder for potential follow-up logic (e.g., asking questions about the generated doc)
    console.log("Follow-up:", message.content, "Plugin:", plugin);
    alert("Follow-up functionality not fully implemented in this example.");
    dispatch({ type: 'change', field: 'textInputContent', value: '' }); // Clear input from context
   };
  const handleRegenerate = async () => {
      dispatch({ type: 'change', field: 'modelError', value: null });
      setIsTranscriptExpanded(false); // Collapse transcript on regenerate
      if (lastOutputType === 'doc' && transcript) {
          if (!lastDocPrompt) return;
          try {
              dispatch({ type: 'change', field: 'loading', value: true });
              setClinicalDoc(''); setAnalysis('');
              const payload = { message: lastDocPrompt, history: [], mode: 'scribe', template_name: activeTemplateName, model_name: activeModelName };
              const res = await axios.post(API_ENDPOINT, payload);
              const docMarkdown = res.data.response || '';
              setClinicalDoc(docMarkdown);
              await handleAnalyzeDoc(docMarkdown, transcript); // Re-analyze after regenerating doc
          } catch (err: any) {
              console.error('[handleRegenerate - doc] error =>', err);
              const errorMsg = err.response?.data?.detail || err.message || 'Failed to regenerate document.';
              dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
              setClinicalDoc(''); setAnalysis('');
              dispatch({ type: 'change', field: 'loading', value: false }); // Ensure loading stops on error
          }
      } else if (lastOutputType === 'analysis' && clinicalDoc && transcript) {
          // If only analysis failed or needs regenerating
          if (!lastAnalysisPrompt) return;
          try {
              dispatch({ type: 'change', field: 'loading', value: true });
              setAnalysis('');
              const payload = { message: lastAnalysisPrompt, history: [], mode: 'analysis', model_name: activeModelName };
              const res = await axios.post(API_ENDPOINT, payload);
              setAnalysis(res.data.response || '');
          } catch (err: any) {
              console.error('[handleRegenerate - analysis] error =>', err);
              const errorMsg = err.response?.data?.detail || err.message || 'Failed to regenerate analysis.';
              dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
              setAnalysis('');
          } finally {
              dispatch({ type: 'change', field: 'loading', value: false });
          }
      } else if (transcript) {
          // Fallback: if lastOutputType is somehow null but we have a transcript, try generating doc+analysis
          await handleCreateDocFromTranscript(transcript);
      }
  };

  // --- Utility Functions ---
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;
  const handleCopyDoc = async () => {
      if (!clinicalDoc) return;
      try {
          await navigator.clipboard.writeText(clinicalDoc);
          setCopySuccessDoc(true);
          setTimeout(() => setCopySuccessDoc(false), 1500); // Show success briefly
      } catch (err) {
          console.error('[handleCopyDoc] failed =>', err);
          alert('Failed to copy document.'); // Fallback alert
      }
  };
  const handleDownloadPDF = () => { /* ... preserved ... */ if (!clinicalDoc) return; const now = new Date(); const timeStamp = [ now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'), '_', String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0'), ].join(''); const pdfDefinition: any = { content: [ { text: 'Clinical Document', style: 'header', margin: [0, 0, 0, 10] as [number, number, number, number], }, { text: clinicalDoc, margin: [0, 0, 0, 10] as [number, number, number, number], }, ], styles: { header: { fontSize: 14, bold: true }, }, }; pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`); };
  const handleStartEdit = () => { if (!clinicalDoc) return; setIsEditingDoc(true); setEditDocText(clinicalDoc); };
  const handleSaveEdit = async () => { setIsEditingDoc(false); setClinicalDoc(editDocText); if (transcript) { await handleAnalyzeDoc(editDocText, transcript); } }; // Re-analyze after saving edits
  const handleCancelEdit = () => { setIsEditingDoc(false); setEditDocText(''); }; // Reset edit text on cancel
  const handleClearScribe = () => { setTranscript(''); setClinicalDoc(''); setAnalysis(''); setIsEditingDoc(false); setEditDocText(''); setLastDocPrompt(''); setLastAnalysisPrompt(''); setLastOutputType(null); dispatch({ type: 'change', field: 'textInputContent', value: '' }); dispatch({ type: 'change', field: 'modelError', value: null }); };

  // Close dropdowns on outside click
  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) { setShowTemplatesDropdown(false); } if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) { setShowModelsDropdown(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);


  // --- Render Logic ---
  const hasTranscript = Boolean(transcript);
  const errorForDiv = modelError ? { message: (modelError as any)?.message || 'An unexpected error occurred.' } : null;

  return (
    // --- Redesigned Main Container ---
    <div className="flex flex-col w-full h-full bg-gradient-to-b from-white via-teal-50 to-gray-50 text-gray-900">

      {/* --- Redesigned Top Bar --- */}
      <div className="border-b border-gray-200 px-4 md:px-6 py-2 flex items-center justify-between gap-4 flex-wrap flex-shrink-0 bg-white shadow-sm z-10">
        {/* Left side: Template/Model Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
            {/* Template Dropdown */}
            <div className="relative" ref={templateDropdownRef}>
              <button className={`${secondaryButtonStyles} px-3 py-1.5 text-sm`} onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)} aria-haspopup="true" aria-expanded={showTemplatesDropdown} disabled={loading} >
                <IconTemplate size={16} className="mr-1.5 text-teal-600"/>
                <span className="hidden sm:inline">{t('Template')}: </span>{activeTemplateName}
                <IconChevronDown size={16} className={`ml-1.5 transition-transform ${showTemplatesDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTemplatesDropdown && (
                <div className="absolute left-0 mt-1 w-60 rounded-md border border-gray-200 bg-white p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
                  {prompts.map((prompt: Prompt) => ( <button key={prompt.id} className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded" onClick={() => { setActiveTemplateName(prompt.name); setShowTemplatesDropdown(false); if (transcript) { handleCreateDocFromTranscript(transcript); } }} > {prompt.name} </button> ))}
                </div>
              )}
            </div>
            {/* Model Dropdown */}
            <div className="relative" ref={modelDropdownRef}>
              <button className={`${secondaryButtonStyles} px-3 py-1.5 text-sm`} onClick={() => setShowModelsDropdown(!showModelsDropdown)} aria-haspopup="true" aria-expanded={showModelsDropdown} disabled={loading} >
                 <IconCpu size={16} className="mr-1.5 text-purple-600"/>
                 <span className="hidden sm:inline">{t('Model')}: </span>{activeModelName}
                 <IconChevronDown size={16} className={`ml-1.5 transition-transform ${showModelsDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showModelsDropdown && (
                <div className="absolute left-0 mt-1 w-60 rounded-md border border-gray-200 bg-white p-2 shadow-lg z-50 max-h-60 overflow-y-auto">
                  {models.map((m) => ( <button key={m.id} className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded" onClick={() => { setActiveModelName(m.name); setShowModelsDropdown(false); /* TODO: Decide if changing model should auto-regenerate */ }} > {m.name} </button> ))}
                </div>
              )}
            </div>
        </div>
        {/* Right side: Help/Settings (Optional) */}
        <div className="flex items-center gap-1">
            <button className={ghostButtonStyles} title="Help" onClick={() => dispatch({ type: 'change', field: 'openModal', value: 'help'})}><IconHelpCircle size={18}/></button>
            <button className={ghostButtonStyles} title="Settings" onClick={() => dispatch({ type: 'change', field: 'openModal', value: 'settings'})}><IconSettings size={18}/></button>
        </div>
      </div>

      {/* --- Scrollable Main Content Area --- */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6" style={{ scrollbarWidth: 'thin' }}>
        {/* Header shown only in initial state */}
        {!hasTranscript && <ScribeHeader />}

        {/* Error Message Display */}
        <ErrorMessageDivComponent error={errorForDiv} />

        {/* Initial State View - Redesigned */}
        {!hasTranscript && !loading && !modelError && (
             <div className="flex flex-col items-center justify-center flex-grow text-center px-4 animate-fadeInUp">
                {/* Content moved to ScribeHeader */}
                {/* Redesigned layout for buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mt-4">
                  <ChatTextToSpeech onSend={(msg) => handleInitialInput(msg)} />
                  <ChatStartOfficeVisit onSend={(msg) => handleInitialInput(msg)} />
                </div>
                 <p className="text-xs text-gray-500 mt-10 max-w-md">
                    Alternatively, paste a transcript directly into the input bar below.
                 </p>
                 <ScribeDisclaimer centered={true} />
             </div>
        )}

        {/* Results State View - Redesigned */}
        {hasTranscript && !modelError && (
             <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeInUp">
                 {/* === Collapsible Transcript Section - Redesigned === */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 ease-in-out">
                  <button
                    className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 focus:outline-none"
                    onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                    aria-expanded={isTranscriptExpanded}
                    title={isTranscriptExpanded ? 'Collapse Transcript' : 'Expand Transcript'}
                  >
                    <h2 className="text-base font-semibold text-gray-700"> Transcript </h2>
                    <IconChevronUp size={18} className={`text-gray-500 transition-transform duration-200 ${isTranscriptExpanded ? 'rotate-0' : 'rotate-180'}`}/>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${isTranscriptExpanded ? 'max-h-60 p-4 overflow-y-auto' : 'max-h-0 py-0 px-4 overflow-hidden'}`} style={{ scrollbarWidth: 'thin' }}>
                     <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {transcript || <span className="italic text-gray-400">No transcript available.</span>}
                     </p>
                  </div>
                </div>

                {/* === Document Section - Redesigned === */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                    {/* Document Header with Actions */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-xl">
                      <h2 className="text-base font-semibold text-gray-800"> Clinical Documentation </h2>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500 mr-2 hidden sm:inline"> {docWordCount} words </span>
                        <button onClick={handleCopyDoc} title={copySuccessDoc ? "Copied!" : "Copy"} disabled={!clinicalDoc || isEditingDoc} className={`${ghostButtonStyles} relative`} >
                            {copySuccessDoc ? <IconCheck size={16} className="text-green-600"/> : <IconCopy size={16} />}
                        </button>
                        <button onClick={handleDownloadPDF} title="Download PDF" disabled={!clinicalDoc || isEditingDoc} className={ghostButtonStyles} > <IconDownload size={16} /> </button>
                        {isEditingDoc ? (
                            <>
                                <button onClick={handleCancelEdit} title="Cancel Edit" className={`${ghostButtonStyles} text-red-600 hover:bg-red-100`} > <IconX size={16} /> </button>
                                <button onClick={handleSaveEdit} title="Save Edits" className={`${ghostButtonStyles} text-green-600 hover:bg-green-100`} > <IconCheck size={16} /> </button>
                            </>
                        ) : (
                          <button onClick={handleStartEdit} title="Edit Document" disabled={!clinicalDoc || loading} className={ghostButtonStyles} > <IconEdit size={16} /> </button>
                        )}
                      </div>
                    </div>
                    {/* Document Content */}
                    <div className="flex-1 overflow-auto p-4 md:p-6 min-h-[300px]">
                      {isEditingDoc ? (
                        <textarea className={`${formTextareaStyles} w-full h-full min-h-[300px]`} value={editDocText} onChange={(e) => setEditDocText(e.target.value)} />
                      ) : (
                        <div className="prose prose-sm max-w-none text-gray-800 prose-headings:font-semibold prose-headings:text-gray-900 prose-strong:font-semibold prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                          {loading && !clinicalDoc ? (
                             <LoadingIndicator text="Generating document..."/>
                          ) : clinicalDoc ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{clinicalDoc}</ReactMarkdown>
                          ) : (
                            <InfoPlaceholder text="Document will appear here." />
                          )}
                        </div>
                      )}
                    </div>
                </div>

                 {/* === Analysis Section - Redesigned === */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50">
                        <h2 className="text-base font-semibold text-gray-800 flex items-center">
                           <IconInfoCircle size={18} className="mr-2 text-blue-600"/> AI Analysis & Recommendations
                        </h2>
                    </div>
                     <div className="flex-1 overflow-auto p-4 md:p-6 min-h-[150px]">
                        <div className="prose prose-sm max-w-none text-gray-700 prose-headings:font-semibold prose-headings:text-gray-900 prose-strong:font-semibold prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                           {loading && !analysis ? (
                             <LoadingIndicator text="Generating analysis..."/>
                           ) : analysis ? (
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown> // Assumes analysis markdown includes headings like ## Heading
                           ) : (
                             <InfoPlaceholder text="Analysis and recommendations will appear here."/>
                           )}
                        </div>
                     </div>
                </div>
                <ScribeDisclaimer centered={false} />
             </div>
        )}

        {/* Scroll target */}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* Chat Input at the bottom */}
      <ChatInput
        stopConversationRef={stopConversationRef}
        textareaRef={inputRef} // Pass ref to ChatInput
        onSend={hasTranscript ? handleSendFollowUp : handleInitialInput}
        onRegenerate={handleRegenerate}
        onScrollDownClick={scrollToBottom}
        showScrollDownButton={!autoScrollEnabled && Boolean(chatContainerRef.current && chatContainerRef.current.scrollHeight > (chatContainerRef.current?.clientHeight || 0) + 50)} // Check if scrollable
      />

      {/* Modals - Use the 'openModal' state from context */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat; // Ensure this is the default export

