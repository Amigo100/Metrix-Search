// /components/Chat/Chat.tsx
// CORRECTED VERSION 5 (Fixes onSend type mismatch)

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
import { Plugin } from '@/types/plugin'; // Import Plugin type if not already

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
const ScribeHeader = () => ( /* ... as before ... */
    <header className="flex flex-col items-center justify-center text-center pt-6 pb-4 md:pt-8 md:pb-6 px-4">
        <img src="/MetrixAI.png" alt="Metrix Logo" width={56} height={56} className="mb-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900"> Clinical Scribe Assistant </h1>
    </header>
);
const ScribeDisclaimer = ({ centered = false }: { centered?: boolean }) => ( /* ... as before ... */
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // --- Scroll Logic (preserved) ---
  const throttledScrollDown = throttle(() => { /* ... */ }, 250);
  useEffect(() => { if (clinicalDoc || analysis || loading) throttledScrollDown(); }, [clinicalDoc, analysis, loading, throttledScrollDown]);
  useEffect(() => { /* ... scroll event listener ... */ }, []);
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setAutoScrollEnabled(true); };

  // --- API Call Functions (preserved, ensure correct error dispatch) ---
   const handleCreateDocFromTranscript = async (text: string) => { /* ... as before ... */
      // Inside CATCH block:
      // dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
       try {
            dispatch({ type: 'change', field: 'loading', value: true });
            dispatch({ type: 'change', field: 'modelError', value: null });
            setClinicalDoc(''); setAnalysis(''); setIsTranscriptExpanded(true); setLastOutputType(null);
            const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName);
            const templateContent = selectedTemplate?.content || 'Default template: Structure notes clearly.';
            const docPrompt = `
You are a helpful clinical scribe AI. Return output in Markdown format (headings: **bold** or #, lists: *, -).
Template (headings/format):
--------------------------
${templateContent}
User Transcript/Input:
--------------------------
${text}
Instructions: Fill template using transcript details. Ensure final answer is Markdown.`.trim();
            const payload = { message: docPrompt, history: [], mode: 'scribe', template_name: activeTemplateName, model_name: activeModelName };
            const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
            const docMarkdown = res.data.response || '';
            setClinicalDoc(docMarkdown); setIsEditingDoc(false); setLastDocPrompt(docPrompt); setLastOutputType('doc');
            await handleAnalyzeDoc(docMarkdown, text);
       } catch (err: any) {
           console.error('[handleCreateDocFromTranscript] error =>', err);
           const errorMsg = err.response?.data?.detail || err.message || 'Failed to create document.';
           dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
           setClinicalDoc(''); setAnalysis('');
           dispatch({ type: 'change', field: 'loading', value: false });
       }
   };
   const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => { /* ... as before ... */
        // Inside CATCH block:
        // dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
       try {
            if (!loading) dispatch({ type: 'change', field: 'loading', value: true });
            dispatch({ type: 'change', field: 'modelError', value: null });
             const analysisPrompt = `
You are a clinical summarizer focusing on:
1) **Potential Transcription Errors**: Highlight inaccuracies based on clinical context (list).
2) **Inferred Clinical Terms**: Identify potential diagnoses/signs/symptoms implied (list).
3) **Recommendations**: Suggest next steps based on template (${activeTemplateName}) and context (scoring tools, investigations, management) (lists/paragraphs under headings).
Return result in **Markdown**.
Transcript/Input:
-----------
${rawTranscript}
Clinical Document:
------------------
${doc}`.trim();
            const payload = { message: analysisPrompt, history: [], mode: 'analysis', model_name: activeModelName };
            const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
            const analysisOutput = res.data.response || '';
            setAnalysis(analysisOutput); setLastAnalysisPrompt(analysisPrompt);
       } catch (err: any) {
            console.error('[handleAnalyzeDoc] error =>', err);
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to analyze document.';
            dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
            setAnalysis('');
       } finally {
            dispatch({ type: 'change', field: 'loading', value: false });
       }
   };

  // --- Input Handlers ---

  // *** CORRECTED SIGNATURE for handleInitialInput ***
  const handleInitialInput = async (message: Message, plugin: Plugin | null = null) => {
    // Extract text content from the message object sent by ChatInput
    const text = message.content;
    if (!text.trim()) return;
    setTranscript(text); // Set transcript based on the input content
    dispatch({ type: 'change', field: 'textInputContent', value: '' }); // Clear the input bar state
    await handleCreateDocFromTranscript(text); // Process the extracted text
  };

  // *** CORRECTED SIGNATURE for handleSendFollowUp ***
  const handleSendFollowUp = async (message: Message, plugin: Plugin | null = null) => {
    console.log("Follow-up:", message.content, "Plugin:", plugin);
    // Placeholder - Implement actual follow-up logic here
    // e.g., send message.content + clinicalDoc + analysis to an API
    alert("Follow-up functionality not fully implemented in this example.");
    dispatch({ type: 'change', field: 'textInputContent', value: '' }); // Clear the input bar state
  };

  const handleRegenerate = async () => { /* ... preserved logic, ensure error dispatch uses {message: ...} */
        dispatch({ type: 'change', field: 'modelError', value: null });
        setIsTranscriptExpanded(true);

        if (lastOutputType === 'doc' && transcript && lastDocPrompt) {
           try {
              dispatch({ type: 'change', field: 'loading', value: true });
              setClinicalDoc(''); setAnalysis('');
              const payload = { message: lastDocPrompt, history: [], mode: 'scribe', template_name: activeTemplateName, model_name: activeModelName };
              const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
              const docMarkdown = res.data.response || '';
              setClinicalDoc(docMarkdown);
              await handleAnalyzeDoc(docMarkdown, transcript);
           } catch (err: any) {
             console.error('[handleRegenerate - doc] error =>', err);
             const errorMsg = err.response?.data?.detail || err.message || 'Failed to regenerate document.';
             dispatch({ type: 'change', field: 'modelError', value: { message: errorMsg } });
             setClinicalDoc(''); setAnalysis('');
             dispatch({ type: 'change', field: 'loading', value: false });
           }
        } else if (lastOutputType === 'analysis' && clinicalDoc && transcript && lastAnalysisPrompt) {
           try {
             dispatch({ type: 'change', field: 'loading', value: true });
             setAnalysis('');
             const payload = { message: lastAnalysisPrompt, history: [], mode: 'analysis', model_name: activeModelName };
             const res = await axios.post('http://localhost:8000/rag/ask_rag', payload);
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
          await handleCreateDocFromTranscript(transcript);
        } else {
            dispatch({ type: 'change', field: 'modelError', value: { message: 'No previous input found to regenerate.' } });
        }
  };

  // --- Utility Functions (preserved) ---
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;
  const handleCopyDoc = async () => { /* ... */ };
  const handleDownloadPDF = () => { /* ... */ };
  const handleStartEdit = () => { /* ... */ };
  const handleSaveEdit = async () => { /* ... */ };
  const handleCancelEdit = () => { /* ... */ };
  const handleClearScribe = () => { /* ... */
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
   };


  // --- Conditional Rendering Logic ---
  const hasTranscript = Boolean(transcript);
  const errorForDiv = modelError ? { message: (modelError as any)?.message || 'An unexpected error occurred.' } : null;
  let mainContent: ReactNode;

  // --- Initial Screen ---
  if (!hasTranscript && !loading && !modelError) {
    mainContent = ( /* ... As before ... */
      <>
        <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto text-base leading-relaxed">
          Select a template and model above, then start by recording audio, initiating a consultation, or typing your summary below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fadeInUp w-full max-w-3xl mx-auto" style={{ animationDelay: '0.1s' }}>
           <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
              <ChatTextToSpeech onSend={(msg) => { handleInitialInput(msg); }} /> {/* Pass msg object */}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
              <ChatStartOfficeVisit onSend={(msg) => { handleInitialInput(msg); }} /> {/* Pass msg object */}
            </div>
        </div>
        <ScribeDisclaimer centered={true} />
      </>
    );
  }
  // --- Main View (Transcript Exists) ---
  else {
    mainContent = ( /* ... As before ... */
       <>
        <ErrorMessageDivComponent error={errorForDiv} />
        {hasTranscript && (
            <div className="px-4 md:px-6 pt-3 mb-4"> {/* ... Transcript section ... */} </div>
        )}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-grow px-4 md:px-6 pb-4 overflow-hidden">
          <div className="flex-1 md:w-3/5 lg:w-2/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"> {/* Doc Panel */} </div>
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[300px]"> {/* Analysis Panel */} </div>
        </div>
         <ScribeDisclaimer centered={false} />
      </>
    );
  }

  // --- Main Return Structure ---
  return (
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">

        {/* Top Bar (Template/Model) */}
        <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-start gap-3 flex-wrap flex-shrink-0 bg-white shadow-sm z-10">
            {/* Template Dropdown ... */}
            {/* Model Dropdown ... */}
        </div>

        {/* Scrollable main content area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col">
            <ScribeHeader />
            {mainContent}
            <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
        </div>

        {/* Sticky Bottom Input Bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm z-20">
            <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
                {hasTranscript && ( <button onClick={handleClearScribe} className={ghostButtonStyles} title="Clear Scribe Session"> <Trash2 size={18} /> </button> )}
                <div className="flex-1">
                     <ChatInput
                        stopConversationRef={stopConversationRef}
                        textareaRef={inputRef}
                        // *** CORRECTED onSend Assignment ***
                        onSend={hasTranscript ? handleSendFollowUp : handleInitialInput}
                        onRegenerate={handleRegenerate}
                        onScrollDownClick={scrollToBottom}
                        showScrollDownButton={!autoScrollEnabled && Boolean(chatContainerRef.current && chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight + 50)}
                        placeholder={hasTranscript ? "Ask follow-up question or give refinement instructions..." : "Type summary, notes, or command..."}
                        showRegenerateButton={hasTranscript && !loading && Boolean(clinicalDoc || analysis)}
                    />
                </div>
            </div>
        </div>

        {/* Modals */}
        {openModal === 'profile' && <ProfileModal />}
        {/* ... other modals */}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat;
