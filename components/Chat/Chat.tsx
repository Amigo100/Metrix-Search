// /components/Chat/Chat.tsx
// UPDATED VERSION 4 (Mirrors diagnostic-assistance.tsx layout)

import {
  ChevronDown, ChevronUp, Copy, Download, Edit, Check, AlertTriangle,
  Info, Loader2, X, FileText, Send, RotateCcw, Trash2 // Lucide icons
} from 'lucide-react';
import React, {
  MutableRefObject, memo, useContext, useEffect, useRef, useState, ReactNode
} from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'next-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import HomeContext from '@/pages/api/home/home.context';
import { throttle } from '@/utils/data/throttle';
import { saveConversation, saveConversations } from '@/utils/app/conversation';

// Child Components
import { ChatInput } from './ChatInput';
import { ChatTextToSpeech } from './ChatTextToSpeech';
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit';

// Modal Components
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';

// Types
import { Conversation, Message } from '@/types/chat';
import { Prompt } from '@/types/prompt';

// PDF generation
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// --- Style Constants (Derived from reference pages) ---
const primaryButtonStyles = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed";
const ghostButtonStyles = "inline-flex items-center justify-center p-1.5 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed";
const formInputStyles = "block w-full rounded-lg border border-gray-300 py-2 px-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm";

// Disclaimer Text
const SCRIBE_DISCLAIMER_TEXT = `Metrix AI Clinical Scribe generates documentation based on input. Always review and verify documentation for accuracy and completeness before finalizing in patient records. This tool does not replace clinical judgment.`;


// --- Helper Components ---
const ErrorMessageDivComponent = ({ error }: { error: { message: string } | null }) => { /* ... as before ... */
  if (!error) return null;
  return (
    <div className="px-4 pt-4 md:px-6">
      <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm max-w-3xl mx-auto">
        <AlertTriangle size={18} className="flex-shrink-0 text-red-500" />
        <span className="text-sm">{error.message || 'An unexpected error occurred.'}</span>
      </div>
    </div>
  );
};
const LoadingIndicator = ({ text }: { text: string }) => {/* ... as before ... */
    return (
        <div className="flex items-center justify-center space-x-2 text-gray-500 py-4 text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span className="italic">{text}</span>
        </div>
    );
};
const InfoPlaceholder = ({ text, icon: Icon = Info }: { text: string, icon?: React.ElementType }) => {/* ... as before ... */
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 italic p-4 text-center">
            <Icon size={24} className="mb-2 opacity-80"/>
            <span className="text-sm">{text}</span>
        </div>
    );
};
// New Header Component
const ScribeHeader = () => (
    <header className="flex flex-col items-center justify-center text-center pt-6 pb-4 md:pt-8 md:pb-6 px-4">
        <img
            src="/MetrixAI.png" // Ensure path is correct
            alt="Metrix Logo"
            width={56} // Slightly smaller than chatbot initial
            height={56}
            className="mb-3" // Adjusted margin
        />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Clinical Scribe Assistant
        </h1>
    </header>
);
// New Disclaimer Component
const ScribeDisclaimer = ({ centered = false }: { centered?: boolean }) => (
    <div className={`mt-6 mb-4 px-4 max-w-3xl mx-auto ${ centered ? 'text-center' : 'text-left' } text-xs text-gray-500 leading-relaxed`}>
        <strong>Disclaimer:</strong> {SCRIBE_DISCLAIMER_TEXT}
    </div>
);

// --- Main Chat Component ---
interface Props { stopConversationRef: MutableRefObject<boolean>; }
type OutputType = 'doc' | 'analysis' | null;

export const Chat = memo(function Chat({ stopConversationRef }: Props) {
  const { t } = useTranslation('chat');
  const { state: { modelError, loading, models, prompts, textInputContent }, dispatch } = useContext(HomeContext);

  // --- LOCAL STATES ---
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');
  const [copySuccessDoc, setCopySuccessDoc] = useState(false);

  // --- REFS & SCROLL ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null); // Single ref for bottom input
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // --- Scroll Logic (preserved) ---
  const throttledScrollDown = throttle(() => { /* ... */
    if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 150 || scrollHeight <= clientHeight) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
   }, 250);
  useEffect(() => { if (clinicalDoc || analysis || loading) throttledScrollDown(); }, [clinicalDoc, analysis, loading, throttledScrollDown]);
  useEffect(() => {
    const current = chatContainerRef.current;
    const handleScroll = () => { if(current) setAutoScrollEnabled(current.scrollHeight - current.scrollTop - current.clientHeight < 100); };
    current?.addEventListener('scroll', handleScroll);
    return () => current?.removeEventListener('scroll', handleScroll);
   }, []);
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setAutoScrollEnabled(true); };

  // --- API Call Functions (preserved, ensure correct error dispatch) ---
   const handleCreateDocFromTranscript = async (text: string) => { /* ... */
      // Inside CATCH block:
      // dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
       try {
            dispatch({ type: 'change', field: 'loading', value: true });
            dispatch({ type: 'change', field: 'modelError', value: null });
            setClinicalDoc(''); setAnalysis(''); setIsTranscriptExpanded(true); setLastOutputType(null);
            const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
            const templateContent = selectedTemplate?.content || 'Default template: Structure notes clearly.';
            const docPrompt = `...`; // Same prompt as before
            const payload = { message: docPrompt, history: [], mode: 'scribe', template_name: activeTemplateName, model_name: activeModelName };
            const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
            const docMarkdown = res.data.response || '';
            setClinicalDoc(docMarkdown); setIsEditingDoc(false); setLastDocPrompt(docPrompt); setLastOutputType('doc');
            await handleAnalyzeDoc(docMarkdown, text);
       } catch (err: any) {
           console.error('[handleCreateDocFromTranscript] error =>', err);
           const errorMsg = err.response?.data?.detail || err.message || 'Failed to create document.';
           dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } }); // Ensure object format
           setClinicalDoc(''); setAnalysis('');
           dispatch({ type: 'change', field: 'loading', value: false });
       }
   };
   const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => { /* ... */
        // Inside CATCH block:
        // dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
       try {
            if (!loading) dispatch({ type: 'change', field: 'loading', value: true });
            dispatch({ type: 'change', field: 'modelError', value: null });
            const analysisPrompt = `...`; // Same prompt as before
            const payload = { message: analysisPrompt, history: [], mode: 'analysis', model_name: activeModelName };
            const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
            const analysisOutput = res.data.response || '';
            setAnalysis(analysisOutput); setLastAnalysisPrompt(analysisPrompt);
       } catch (err: any) {
            console.error('[handleAnalyzeDoc] error =>', err);
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to analyze document.';
            dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } }); // Ensure object format
            setAnalysis('');
       } finally {
            dispatch({ type: 'change', field: 'loading', value: false });
       }
   };

  // --- Input Handlers ---
  const handleInitialInput = async (text: string) => { if (!text.trim()) return; setTranscript(text); dispatch({ type: 'change', field: 'textInputContent', value: '' }); await handleCreateDocFromTranscript(text); };
  const handleSendFollowUp = async (message: Message) => { console.log("Follow-up:", message.content); alert("Follow-up NIY"); dispatch({ type: 'change', field: 'textInputContent', value: '' }); };
  const handleRegenerate = async () => { /* ... preserved logic, ensure error dispatch uses {message: ...} */
        dispatch({ type: 'change', field: 'modelError', value: null });
        setIsTranscriptExpanded(true);
        // ... rest of the logic
        // Ensure any dispatch in catch blocks uses: dispatch({ type: 'change', field: 'modelError', value: { message: 'Error text' } });
  };

  // --- Utility Functions (preserved) ---
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;
  const handleCopyDoc = async () => { /* ... */ };
  const handleDownloadPDF = () => { /* ... */ };
  const handleStartEdit = () => { /* ... */ };
  const handleSaveEdit = async () => { /* ... */ };
  const handleCancelEdit = () => { /* ... */ };

  // Clear function for bottom bar
   const handleClearScribe = () => {
        setTranscript('');
        setClinicalDoc('');
        setAnalysis('');
        setIsEditingDoc(false);
        setEditDocText('');
        setLastDocPrompt('');
        setLastAnalysisPrompt('');
        setLastOutputType(null);
        dispatch({ type: 'change', field: 'textInputContent', value: '' });
        dispatch({ type: 'change', field: 'modelError', value: null });
        // Optionally reset template/model? Probably not.
   };


  // --- Conditional Rendering Logic ---
  const hasTranscript = Boolean(transcript);
  const errorForDiv = modelError ? { message: (modelError as any)?.message || 'An unexpected error occurred.' } : null;
  let mainContent: ReactNode;

  // --- Initial Screen ---
  if (!hasTranscript && !loading && !modelError) {
    mainContent = (
      <>
        <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto text-base leading-relaxed">
          Select a template and model above, then start by recording audio, initiating a consultation, or typing your summary below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fadeInUp w-full max-w-3xl mx-auto" style={{ animationDelay: '0.1s' }}>
           <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
              <ChatTextToSpeech onSend={(msg) => { handleInitialInput(msg.content); }} />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
              <ChatStartOfficeVisit onSend={(msg) => { handleInitialInput(msg.content); }} />
            </div>
        </div>
         {/* Disclaimer for initial screen */}
        <ScribeDisclaimer centered={true} />
      </>
    );
  }
  // --- Main View (Transcript Exists) ---
  else {
    mainContent = (
      <>
        <ErrorMessageDivComponent error={errorForDiv} />
        {/* Collapsible Transcript Section */}
        {hasTranscript && (
            <div className="px-4 md:px-6 pt-3 mb-4"> {/* Removed bottom border/padding */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold text-gray-700">Input Transcript</h2>
                    <button onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)} className={ghostButtonStyles} title={isTranscriptExpanded ? 'Collapse' : 'Expand'} aria-expanded={isTranscriptExpanded}>
                        {isTranscriptExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
                <div className={`w-full bg-gray-50 text-gray-700 rounded-lg border border-gray-200 shadow-inner transition-all duration-300 ease-in-out text-sm ${isTranscriptExpanded ? 'p-3 max-h-36 overflow-y-auto' : 'p-2 h-9 overflow-hidden whitespace-nowrap cursor-pointer'}`} onClick={!isTranscriptExpanded ? () => setIsTranscriptExpanded(true) : undefined} >
                    <span className={`${!isTranscriptExpanded ? 'block truncate' : 'whitespace-pre-wrap'}`}>{transcript || <InfoPlaceholder text="No transcript." />}</span>
                </div>
            </div>
        )}
        {/* Main Two columns layout */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow px-4 md:px-6 pb-4 overflow-hidden">
          {/* Document Panel (Left) */}
          <div className="flex-1 md:w-3/5 lg:w-2/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50">
              <h2 className="font-semibold text-md text-gray-800 flex items-center"><FileText size={16} className="mr-2 text-teal-700"/>Clinical Documentation</h2>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-gray-500 hidden sm:inline"> {docWordCount} words </span>
                {isEditingDoc ? ( <>
                    <button onClick={handleSaveEdit} title="Save Edits" className={`${primaryButtonStyles} !px-2 !py-1`}> <Check size={16} /> </button>
                    <button onClick={handleCancelEdit} title="Cancel Edits" className={`${secondaryButtonStyles} !px-2 !py-1`}> <X size={16}/> </button>
                 </>) : (
                    <button onClick={handleStartEdit} title="Edit Document" disabled={!clinicalDoc || loading || isEditingDoc} className={ghostButtonStyles}> <Edit size={16} /> </button>
                 )}
                <button onClick={handleCopyDoc} title={copySuccessDoc ? "Copied!" : "Copy"} disabled={!clinicalDoc || isEditingDoc || loading} className={`${ghostButtonStyles} ${copySuccessDoc ? 'text-green-600 bg-green-50' : ''}`}> {copySuccessDoc ? <Check size={16} /> : <Copy size={16} />} </button>
                <button onClick={handleDownloadPDF} title="Download PDF" disabled={!clinicalDoc || isEditingDoc || loading} className={ghostButtonStyles}> <Download size={16} /> </button>
              </div>
            </div>
            {/* Document Content Area */}
            <div className="flex-1 overflow-auto p-4">
              {isEditingDoc ? (
                <textarea className={`${formInputStyles} h-full min-h-[300px] font-mono whitespace-pre-wrap`} value={editDocText} onChange={(e) => setEditDocText(e.target.value)} autoFocus />
              ) : (
                <div className="prose prose-sm max-w-none h-full text-gray-800 prose-a:text-teal-600 hover:prose-a:text-teal-700">
                  {loading && !clinicalDoc ? ( <LoadingIndicator text="Generating document..." />
                  ) : clinicalDoc ? ( <ReactMarkdown remarkPlugins={[remarkGfm]}>{clinicalDoc}</ReactMarkdown>
                  ) : !modelError && hasTranscript ? ( <InfoPlaceholder text="Document will appear here." />
                  ) : null }
                </div>
              )}
            </div>
          </div>
          {/* Analysis Panel (Right) */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[300px]">
             <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50">
                <h2 className="font-semibold text-md text-gray-800 flex items-center"><Info size={16} className="mr-2 text-teal-700"/>AI Analysis</h2>
             </div>
            <div className="flex-1 overflow-auto p-4 prose prose-sm max-w-none text-gray-700 prose-a:text-teal-600 hover:prose-a:text-teal-700">
              {loading && clinicalDoc && !analysis ? ( <LoadingIndicator text="Generating analysis..." />
              ) : analysis ? ( <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
              ) : clinicalDoc && !modelError ? ( <InfoPlaceholder text="Analysis will appear here." />
              ) : !clinicalDoc && hasTranscript && !modelError ? ( <InfoPlaceholder text="Generate document first." />
              ) : null }
            </div>
          </div>
        </div>
         {/* Disclaimer for subsequent screen */}
         <ScribeDisclaimer centered={false} />
      </>
    );
  }

  // --- Main Return Structure ---
  return (
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">

        {/* Top Bar (Template/Model) - Positioned below header but above scroll */}
        <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-start gap-3 flex-wrap flex-shrink-0 bg-white shadow-sm z-10">
           {/* Template Dropdown */}
            <div className="relative">
                <button className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`} onClick={() => !loading && setShowTemplatesDropdown(!showTemplatesDropdown)} aria-haspopup="true" aria-expanded={showTemplatesDropdown} disabled={loading} >
                    <span className="font-medium text-xs uppercase tracking-wide">Template:</span> {activeTemplateName}
                    <ChevronDown size={16} className={`${showTemplatesDropdown ? 'rotate-180' : ''} transition-transform text-gray-400`} />
                </button>
                {showTemplatesDropdown && ( <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto focus:outline-none"> {/* Panel */} </div> )}
            </div>
            {/* Model Dropdown */}
             <div className="relative">
                <button className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`} onClick={() => !loading && setShowModelsDropdown(!showModelsDropdown)} aria-haspopup="true" aria-expanded={showModelsDropdown} disabled={loading} >
                    <span className="font-medium text-xs uppercase tracking-wide">Model:</span> {activeModelName}
                    <ChevronDown size={16} className={`${showModelsDropdown ? 'rotate-180' : ''} transition-transform text-gray-400`} />
                </button>
                 {showModelsDropdown && ( <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto focus:outline-none"> {/* Panel */} </div> )}
            </div>
        </div>


        {/* Scrollable main content area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col">
            {/* Render Scribe Header inside scrollable area */}
            <ScribeHeader />
            {/* Render the main content */}
            {mainContent}
            {/* Scroll target */}
            <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
        </div>

        {/* Sticky Bottom Input Bar - Mirrored from diagnostic-assistance */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm z-20"> {/* Ensure high z-index */}
            <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
                {/* Optional Clear Button */}
                {hasTranscript && (
                     <button onClick={handleClearScribe} className={ghostButtonStyles} title="Clear Scribe Session">
                        <Trash2 size={18} />
                    </button>
                )}
                {/* Input Field Component */}
                <div className="flex-1"> {/* Let ChatInput handle its internal structure */}
                     <ChatInput
                        stopConversationRef={stopConversationRef}
                        textareaRef={inputRef} // Use single ref
                        // Dynamically set props based on state
                        onSend={hasTranscript ? handleSendFollowUp : handleInitialInput}
                        onRegenerate={handleRegenerate}
                        onScrollDownClick={scrollToBottom}
                        showScrollDownButton={!autoScrollEnabled && Boolean(chatContainerRef.current && chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight + 50)}
                        placeholder={hasTranscript ? "Ask follow-up question or give refinement instructions..." : "Type summary, notes, or command..."}
                        // Only show regenerate button if transcript exists and there's content/analysis
                        showRegenerateButton={hasTranscript && !loading && Boolean(clinicalDoc || analysis)}
                        // Pass text content from context
                        // textInputContent={textInputContent} // ChatInput reads from context directly now
                    />
                </div>
                {/* Send button is now inside ChatInput */}
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
