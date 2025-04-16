// /components/Chat/Chat.tsx
// UPDATED VERSION 3 (Style consistency with Chatbot/Scoring Tools)

import {
  ChevronDown, // Lucide replacement
  ChevronUp,   // Lucide replacement
  Copy,        // Lucide replacement
  Download,    // Lucide replacement
  Edit,        // Lucide replacement
  Check,       // Lucide replacement
  AlertTriangle, // Lucide replacement
  Info,        // Lucide replacement (InfoCircle equivalent)
  Loader2,     // Lucide replacement
  X,           // Lucide replacement
  FileText,    // Lucide (for panel headers potentially)
  Mic,         // Lucide (for ChatTextToSpeech if needed, though handled internally)
  Users,       // Lucide (for ChatStartOfficeVisit if needed, though handled internally)
} from 'lucide-react'; // Using Lucide icons
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
const primaryButtonStyles = "inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed";
const ghostButtonStyles = "inline-flex items-center justify-center p-1.5 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"; // Adjusted padding slightly
const formInputStyles = "block w-full rounded-lg border border-gray-300 py-2 px-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm"; // Matching scoring page

// --- Helper: Error Message Display ---
const ErrorMessageDivComponent = ({ error }: { error: { message: string } | null }) => {
  if (!error) return null;
  return (
    <div className="px-4 pt-4 md:px-6"> {/* Adjusted padding */}
      <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm max-w-3xl mx-auto">
        <AlertTriangle size={18} className="flex-shrink-0 text-red-500" />
        <span className="text-sm">{error.message || 'An unexpected error occurred.'}</span>
      </div>
    </div>
  );
};

// --- Helper: Loading Indicator ---
const LoadingIndicator = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center space-x-2 text-gray-500 py-4 text-sm">
    <Loader2 size={16} className="animate-spin" />
    <span className="italic">{text}</span>
  </div>
);

// --- Helper: Info Placeholder ---
const InfoPlaceholder = ({ text, icon: Icon = Info }: { text: string, icon?: React.ElementType }) => (
     <div className="flex flex-col items-center justify-center h-full text-gray-400 italic p-4 text-center">
        <Icon size={24} className="mb-2 opacity-80"/>
        <span className="text-sm">{text}</span>
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
      modelError,
      loading,
      conversations,
      selectedConversation,
      openModal,
      models,
      prompts,
      textInputContent,
    },
    dispatch,
    handleUpdateConversation,
  } = useContext(HomeContext);

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
  const initialInputRef = useRef<HTMLTextAreaElement | null>(null);
  const followUpInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const throttledScrollDown = throttle(() => {
    if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 150 || scrollHeight <= clientHeight) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, 250);

  useEffect(() => {
    if (clinicalDoc || analysis || loading) {
      throttledScrollDown();
    }
  }, [clinicalDoc, analysis, loading, throttledScrollDown]);

  useEffect(() => {
    const currentChatContainer = chatContainerRef.current;
    const handleScroll = () => {
      if (!currentChatContainer) return;
      const { scrollTop, scrollHeight, clientHeight } = currentChatContainer;
      setAutoScrollEnabled(scrollHeight - scrollTop - clientHeight < 100);
    };
    currentChatContainer?.addEventListener('scroll', handleScroll);
    return () => {
      currentChatContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScrollEnabled(true);
  };

  // --- API Call Functions (Logic Preserved) ---
   const handleCreateDocFromTranscript = async (text: string) => {
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

    try {
      dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });
      setClinicalDoc(''); setAnalysis(''); setIsTranscriptExpanded(true); setLastOutputType(null);
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
      dispatch({ type: 'change', field: 'loading', value: false }); // Ensure loading stops on error
    }
  };

  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => {
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

    try {
      if (!loading) dispatch({ type: 'change', field: 'loading', value: true });
      dispatch({ type: 'change', field: 'modelError', value: null });
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


  const handleInitialInput = async (text: string) => {
    if (!text.trim()) return;
    setTranscript(text);
    dispatch({ type: 'change', field: 'textInputContent', value: '' });
    await handleCreateDocFromTranscript(text);
  };

  const handleSendFollowUp = async (message: Message) => {
    console.log("Follow-up message received (needs implementation):", message.content);
    alert("Follow-up functionality not fully implemented in this example.");
    dispatch({ type: 'change', field: 'textInputContent', value: '' });
  };

  const handleRegenerate = async () => {
    dispatch({ type: 'change', field: 'modelError', value: null });
    setIsTranscriptExpanded(true);

    if (lastOutputType === 'doc' && transcript && lastDocPrompt) {
       // Regenerate Document and Analysis
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
         dispatch({ type: 'change', field: 'loading', value: false }); // Ensure loading stops on error
       }
    } else if (lastOutputType === 'analysis' && clinicalDoc && transcript && lastAnalysisPrompt) {
      // Regenerate Only Analysis
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
      await handleCreateDocFromTranscript(transcript); // Fallback
    } else {
        dispatch({ type: 'change', field: 'modelError', value: { message: 'No previous input found to regenerate.' } });
    }
  };

  // --- Utility Functions ---
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;

  const handleCopyDoc = async () => {
    if (!clinicalDoc || isEditingDoc) return;
    try {
      await navigator.clipboard.writeText(clinicalDoc);
      setCopySuccessDoc(true);
      setTimeout(() => setCopySuccessDoc(false), 1500);
    } catch (err) {
      console.error('[handleCopyDoc] failed =>', err); alert('Failed to copy document.');
    }
  };

  const handleDownloadPDF = () => {
    if (!clinicalDoc || isEditingDoc) return;
     try {
        const now = new Date();
        const timeStamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const content = clinicalDoc.split('\n').map(line => { /* ... pdfmake conversion logic ... */
             if (line.startsWith('# ')) return { text: line.substring(2), style: 'h1', margin: [0, 5, 0, 5] as [number, number, number, number] };
             if (line.startsWith('## ')) return { text: line.substring(3), style: 'h2', margin: [0, 5, 0, 5] as [number, number, number, number] };
             if (line.startsWith('**') && line.endsWith('**')) return { text: line.substring(2, line.length - 2), bold: true };
             if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                return { ul: [ line.trim().substring(2) ], margin: [10, 0, 0, 2] as [number, number, number, number] };
             }
             return { text: line, margin: [0, 0, 0, 5] as [number, number, number, number] };
        });
         // Group bullet points
         const groupedContent: any[] = []; let currentList: any[] | null = null;
         content.forEach(item => {
             if (item.ul) { if (!currentList) { currentList = item.ul; groupedContent.push({ ul: currentList, margin: [10, 0, 0, 2] }); } else { currentList.push(item.ul[0]); } }
             else { currentList = null; groupedContent.push(item); }
         });
        const pdfDefinition: any = { content: groupedContent, styles: { h1: { fontSize: 16, bold: true }, h2: { fontSize: 14, bold: true } }, defaultStyle: { fontSize: 10, lineHeight: 1.3 } };
        pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`);
    } catch (error) { console.error("Error generating PDF:", error); alert("Failed to generate PDF."); }
  };

  const handleStartEdit = () => { if (!clinicalDoc || loading) return; setIsEditingDoc(true); setEditDocText(clinicalDoc); };
  const handleSaveEdit = async () => { setIsEditingDoc(false); setClinicalDoc(editDocText); if (transcript) await handleAnalyzeDoc(editDocText, transcript); };
  const handleCancelEdit = () => { setIsEditingDoc(false); setEditDocText(''); };

  // --- Conditional Rendering Logic ---
  const hasTranscript = Boolean(transcript);
  let mainContent: ReactNode;
  const errorForDiv = modelError ? { message: (modelError as any)?.message || 'An unexpected error occurred.' } : null;

  // --- Initial Screen ---
  if (!hasTranscript && !loading && !modelError) {
    mainContent = (
      <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 text-center">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fadeInUp">
            Clinical Scribe Assistant
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Select template & model, then record, start consultation, or type summary.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            {/* Use Card-like wrappers */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
              <ChatTextToSpeech onSend={(msg) => { handleInitialInput(msg.content); }} />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
              <ChatStartOfficeVisit onSend={(msg) => { handleInitialInput(msg.content); }} />
            </div>
          </div>
          {/* Separator */}
          <div className="relative flex items-center justify-center my-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div>
            <div className="relative flex justify-center"><span className="bg-gradient-to-b from-white via-teal-50 to-white px-3 text-sm text-gray-500">Or type directly</span></div> {/* Match gradient */}
          </div>
          {/* Initial Text Input */}
          <div className="mt-6 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <ChatInput
              stopConversationRef={stopConversationRef} textareaRef={initialInputRef}
              onSend={(msg) => handleInitialInput(msg.content)}
              onRegenerate={() => {}} onScrollDownClick={() => {}}
              showScrollDownButton={false}
              placeholder="Type or paste clinical summary, notes, or transcription..."
              showRegenerateButton={false}
            />
          </div>
        </div>
      </div>
    );
  }
  // --- Main View (Transcript Exists) ---
  else {
    mainContent = (
      <>
        <ErrorMessageDivComponent error={errorForDiv} />
        {/* Collapsible Transcript Section */}
        {hasTranscript && (
            <div className="px-4 md:px-6 pt-3 mb-4 border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold text-gray-700"> {/* Subdued heading */}
                       Input Transcript
                    </h2>
                    <button onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)} className={ghostButtonStyles} title={isTranscriptExpanded ? 'Collapse' : 'Expand'} aria-expanded={isTranscriptExpanded}>
                        {isTranscriptExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
                {/* Transcript Box */}
                <div
                    className={`w-full bg-gray-50 text-gray-700 rounded-lg border border-gray-200 shadow-inner transition-all duration-300 ease-in-out text-sm
                                ${isTranscriptExpanded ? 'p-3 max-h-36 overflow-y-auto' : 'p-2 h-9 overflow-hidden whitespace-nowrap cursor-pointer'}`}
                    onClick={!isTranscriptExpanded ? () => setIsTranscriptExpanded(true) : undefined} >
                    <span className={`${!isTranscriptExpanded ? 'block truncate' : 'whitespace-pre-wrap'}`}>
                        {transcript || <InfoPlaceholder text="No transcript available." />}
                    </span>
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
              <div className="flex items-center space-x-1.5"> {/* Reduced space */}
                <span className="text-xs text-gray-500 hidden sm:inline"> {docWordCount} words </span>
                {isEditingDoc ? ( <>
                    <button onClick={handleSaveEdit} title="Save Edits" className={`${primaryButtonStyles} !px-2 !py-1`}> <Check size={16} /> </button> {/* Primary Save */}
                    <button onClick={handleCancelEdit} title="Cancel Edits" className={`${secondaryButtonStyles} !px-2 !py-1`}> <X size={16}/> </button> {/* Secondary Cancel */}
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
            {/* Panel Header */}
             <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50">
                <h2 className="font-semibold text-md text-gray-800 flex items-center"><Info size={16} className="mr-2 text-teal-700"/>AI Analysis</h2>
             </div>
            {/* Analysis Content Area */}
            <div className="flex-1 overflow-auto p-4 prose prose-sm max-w-none text-gray-700 prose-a:text-teal-600 hover:prose-a:text-teal-700">
              {loading && clinicalDoc && !analysis ? ( <LoadingIndicator text="Generating analysis..." />
              ) : analysis ? ( <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
              ) : clinicalDoc && !modelError ? ( <InfoPlaceholder text="Analysis will appear here." />
              ) : !clinicalDoc && hasTranscript && !modelError ? ( <InfoPlaceholder text="Generate document first." />
              ) : null }
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- Main Return Structure ---
  return (
    // Apply gradient background and ensure full height
    <div className="flex flex-col w-full h-screen text-gray-900 bg-gradient-to-b from-white via-teal-50 to-white">
      {/* Top bar: Template and Model selection */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-start gap-3 flex-wrap flex-shrink-0 bg-white shadow-sm z-10">
        {/* Template Dropdown */}
        <div className="relative">
          {/* Use secondary button style for dropdown trigger */}
          <button
            className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`} // Adjust padding & add gap
            onClick={() => !loading && setShowTemplatesDropdown(!showTemplatesDropdown)}
            aria-haspopup="true" aria-expanded={showTemplatesDropdown} disabled={loading} >
            <span className="font-medium text-xs uppercase tracking-wide">Template:</span> {activeTemplateName}
            <ChevronDown size={16} className={`${showTemplatesDropdown ? 'rotate-180' : ''} transition-transform text-gray-400`} />
          </button>
          {/* Dropdown Panel */}
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto focus:outline-none">
              {prompts.length > 0 ? prompts.map((prompt: Prompt) => (
                <button key={prompt.id} className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded focus:bg-teal-100 focus:outline-none"
                  onClick={() => { setActiveTemplateName(prompt.name); setShowTemplatesDropdown(false); if (transcript) handleInitialInput(transcript); }} >
                  {prompt.name}
                </button>
              )) : <span className="block px-3 py-1.5 text-sm text-gray-500 italic">No templates.</span>}
            </div>
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative">
           {/* Use secondary button style */}
           <button className={`${secondaryButtonStyles} !py-1.5 !px-3 gap-1.5`}
            onClick={() => !loading && setShowModelsDropdown(!showModelsDropdown)}
            aria-haspopup="true" aria-expanded={showModelsDropdown} disabled={loading} >
            <span className="font-medium text-xs uppercase tracking-wide">Model:</span> {activeModelName}
            <ChevronDown size={16} className={`${showModelsDropdown ? 'rotate-180' : ''} transition-transform text-gray-400`} />
          </button>
          {/* Dropdown Panel */}
          {showModelsDropdown && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-gray-300 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto focus:outline-none">
              {models.length > 0 ? models.map((m: any) => (
                <button key={m.id} className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 rounded focus:bg-teal-100 focus:outline-none"
                  onClick={() => { setActiveModelName(m.name); setShowModelsDropdown(false); if (clinicalDoc && transcript) handleAnalyzeDoc(clinicalDoc, transcript); else if (transcript) handleInitialInput(transcript); }} >
                  {m.name}
                </button>
              )) : <span className="block px-3 py-1.5 text-sm text-gray-500 italic">No models.</span>}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable main content area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col">
        {mainContent}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" /> {/* Scroll target */}
      </div>

      {/* Bottom Chat Input (only if transcript exists and not editing) */}
      {hasTranscript && !isEditingDoc && (
          // Consistent background and border with top bar
          <div className="flex-shrink-0 border-t border-gray-200 bg-white py-2 shadow-sm">
              <ChatInput
                  stopConversationRef={stopConversationRef} textareaRef={followUpInputRef}
                  onSend={handleSendFollowUp} // Needs implementation
                  onRegenerate={handleRegenerate}
                  onScrollDownClick={scrollToBottom}
                  showScrollDownButton={!autoScrollEnabled && Boolean(chatContainerRef.current && chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight + 50)}
                  placeholder="Ask follow-up question or give refinement instructions..."
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
