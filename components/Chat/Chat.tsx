// ============================================================
// file: /components/Chat/Chat.tsx - Redesigned Main Component
// ============================================================
interface ChatProps { // Renamed from Props for clarity
  stopConversationRef: MutableRefObject<boolean>;
}
// *** ADDED EXPORT HERE ***
export const Chat = memo(function Chat({ stopConversationRef }: ChatProps) {
  const { t } = useTranslation('chat');
  const { state: { modelError, loading, conversations, selectedConversation, openModal, models, prompts, }, dispatch, handleUpdateConversation, } = useContext(HomeContext);
  // State and Logic (Preserved)
  const [transcript, setTranscript] = useState('');
  const [clinicalDoc, setClinicalDoc] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false); // Default collapsed
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocText, setEditDocText] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4'); // Default model
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [lastOutputType, setLastOutputType] = useState<OutputType>(null);
  const [lastDocPrompt, setLastDocPrompt] = useState('');
  const [lastAnalysisPrompt, setLastAnalysisPrompt] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Effects and Handlers (Preserved - ensure dispatch has 'type')
  const throttledScrollDown = throttle(() => { /* ... preserved ... */ if (autoScrollEnabled && messagesEndRef.current && chatContainerRef.current) { const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current; if (scrollHeight - scrollTop - clientHeight < 100) { messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); } } }, 250);
  useEffect(() => { /* ... scroll down effect ... */ if (clinicalDoc || analysis || !loading) { throttledScrollDown(); } }, [clinicalDoc, analysis, loading, throttledScrollDown]);
  useEffect(() => { /* ... auto-scroll observer ... */ const currentChatContainer = chatContainerRef.current; const handleScroll = () => { if (!currentChatContainer) return; const { scrollTop, scrollHeight, clientHeight } = currentChatContainer; const isNearBottom = scrollHeight - scrollTop - clientHeight < 80; setAutoScrollEnabled(isNearBottom); }; if (currentChatContainer) { currentChatContainer.addEventListener('scroll', handleScroll); } return () => { if (currentChatContainer) { currentChatContainer.removeEventListener('scroll', handleScroll); } }; }, []);
  const scrollToBottom = () => { /* ... preserved ... */ if (messagesEndRef.current) { messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); setAutoScrollEnabled(true); } };
  const handleCreateDocFromTranscript = async (text: string) => { /* ... preserved logic ... */ const selectedTemplate = prompts.find((tpl) => tpl.name === activeTemplateName); const templateContent = selectedTemplate?.content || ''; const docPrompt = `\nYou are a helpful clinical scribe AI... \nTemplate:\n${templateContent}\nTranscript:\n${text}\nInstructions:\n- Fill in...`.trim(); try { dispatch({ type: 'change', field: 'loading', value: true }); dispatch({ type: 'change', field: 'modelError', value: null }); setClinicalDoc(''); setAnalysis(''); setIsTranscriptExpanded(false); const payload = { message: docPrompt, history: [], mode: 'scribe', template_name: activeTemplateName }; const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/rag/ask_rag`, payload); const docMarkdown = res.data.response || ''; setClinicalDoc(docMarkdown); setIsEditingDoc(false); setLastDocPrompt(docPrompt); setLastOutputType('doc'); await handleAnalyzeDoc(docMarkdown, text); } catch (err) { console.error('[handleCreateDocFromTranscript] error =>', err); dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to create document.' } }); setClinicalDoc(''); setAnalysis(''); dispatch({ type: 'change', field: 'loading', value: false }); } };
  const handleAnalyzeDoc = async (doc: string, rawTranscript: string) => { /* ... preserved logic ... */ const analysisPrompt = `\nYou are a clinical summarizer focusing on...\nTranscript:\n${rawTranscript}\nClinical Document:\n${doc}`.trim(); try { if (!loading) { dispatch({ type: 'change', field: 'loading', value: true }); } dispatch({ type: 'change', field: 'modelError', value: null }); const payload = { message: analysisPrompt, history: [], mode: 'analysis' }; const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/rag/ask_rag`, payload); const analysisOutput = res.data.response || ''; setAnalysis(analysisOutput); setLastAnalysisPrompt(analysisPrompt); } catch (err) { console.error('[handleAnalyzeDoc] error =>', err); dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to analyze document.' } }); setAnalysis(''); } finally { dispatch({ type: 'change', field: 'loading', value: false }); } };
  const handleTranscriptReceived = async (text: string) => { /* ... preserved ... */ setTranscript(text); await handleCreateDocFromTranscript(text); };
  const handleRegenerate = async () => { /* ... preserved logic ... */ dispatch({ type: 'change', field: 'modelError', value: null }); setIsTranscriptExpanded(false); if (lastOutputType === 'doc' && transcript) { if (!lastDocPrompt) return; try { dispatch({ type: 'change', field: 'loading', value: true }); setClinicalDoc(''); setAnalysis(''); const payload = { message: lastDocPrompt, history: [], mode: 'scribe', template_name: activeTemplateName }; const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/rag/ask_rag`, payload); const docMarkdown = res.data.response || ''; setClinicalDoc(docMarkdown); await handleAnalyzeDoc(docMarkdown, transcript); } catch (err) { console.error('[handleRegenerate - doc] error =>', err); dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to regenerate document.' } }); setClinicalDoc(''); setAnalysis(''); dispatch({ type: 'change', field: 'loading', value: false }); } } else if (lastOutputType === 'analysis' && clinicalDoc && transcript) { if (!lastAnalysisPrompt) return; try { dispatch({ type: 'change', field: 'loading', value: true }); setAnalysis(''); const payload = { message: lastAnalysisPrompt, history: [], mode: 'analysis' }; const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/rag/ask_rag`, payload); setAnalysis(res.data.response || ''); } catch (err) { console.error('[handleRegenerate - analysis] error =>', err); dispatch({ type: 'change', field: 'modelError', value: { message: 'Failed to regenerate analysis.' } }); setAnalysis(''); } finally { dispatch({ type: 'change', field: 'loading', value: false }); } } else if (transcript) { await handleCreateDocFromTranscript(transcript); } };
  const docWordCount = clinicalDoc.trim() ? clinicalDoc.trim().split(/\s+/).length : 0;
  const handleCopyDoc = async () => { /* ... preserved ... */ if (!clinicalDoc) return; try { await navigator.clipboard.writeText(clinicalDoc); alert('Document copied to clipboard!'); } catch (err) { console.error('[handleCopyDoc] failed =>', err); alert('Failed to copy document.'); } };
  const handleDownloadPDF = () => { /* ... preserved ... */ if (!clinicalDoc) return; const now = new Date(); const timeStamp = [ now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'), '_', String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0'), ].join(''); const pdfDefinition = { content: [ { text: 'Clinical Document', style: 'header', margin: [0, 0, 0, 10] as [number, number, number, number], }, { text: clinicalDoc, margin: [0, 0, 0, 10] as [number, number, number, number], }, ], styles: { header: { fontSize: 14, bold: true }, }, }; pdfMake.createPdf(pdfDefinition).download(`${timeStamp}_ClinicalDocument.pdf`); };
  const handleStartEdit = () => { /* ... preserved ... */ if (!clinicalDoc) return; setIsEditingDoc(true); setEditDocText(clinicalDoc); };
  const handleSaveEdit = () => { /* ... preserved ... */ setIsEditingDoc(false); setClinicalDoc(editDocText); if (transcript) { handleAnalyzeDoc(editDocText, transcript); } };

  // Close dropdowns on outside click
  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) { setShowTemplatesDropdown(false); } if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) { setShowModelsDropdown(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);


  // --- Render Logic ---
  const noTranscript = !transcript;

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
        {modelError && !loading && <ErrorMessageDiv error={modelError} />}

        {/* Initial State View - Redesigned */}
        {noTranscript && !loading && !modelError && (
             <div className="flex flex-col items-center justify-center flex-grow text-center px-4 animate-fadeInUp">
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold text-gray-800 mb-2">Metrix AI Clinical Scribe</h1>
                  <p className="text-gray-600 text-base max-w-md mx-auto">
                    Choose an input method. Ensure you've selected the correct <span className="font-medium text-teal-700">Template</span> and <span className="font-medium text-purple-700">Model</span> above.
                  </p>
                </div>
                {/* Redesigned layout for buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                  {/* Pass onSend prop */}
                  <ChatTextToSpeech onSend={(msg) => handleTranscriptReceived(msg.content)} />
                  <ChatStartOfficeVisit onSend={(msg) => handleTranscriptReceived(msg.content)} />
                </div>
                 <p className="text-xs text-gray-500 mt-10 max-w-md">
                    Alternatively, paste a transcript directly into the input bar below.
                 </p>
             </div>
        )}

        {/* Results State View - Redesigned */}
        {!noTranscript && !modelError && (
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
                        <button onClick={handleCopyDoc} title="Copy" disabled={!clinicalDoc || isEditingDoc} className={ghostButtonStyles} > <IconCopy size={16} /> </button>
                        <button onClick={handleDownloadPDF} title="Download PDF" disabled={!clinicalDoc || isEditingDoc} className={ghostButtonStyles} > <IconDownload size={16} /> </button>
                        {isEditingDoc ? (
                          <button onClick={handleSaveEdit} title="Save Edits" className={`${ghostButtonStyles} text-green-600 hover:bg-green-100`} > <IconCheck size={16} /> </button>
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
                        <div className="prose prose-sm max-w-none text-gray-800 prose-headings:font-semibold prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                          {loading && !clinicalDoc ? (
                             <div className="flex items-center justify-center py-10 text-gray-500"> <IconLoader2 size={24} className="animate-spin mr-2"/> Generating document... </div>
                          ) : clinicalDoc ? (
                            <ReactMarkdown>{clinicalDoc}</ReactMarkdown>
                          ) : (
                            <p className="italic text-gray-500">Document will appear here.</p>
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
                        <div className="prose prose-sm max-w-none text-gray-700 prose-headings:font-semibold prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                           {loading && !analysis ? (
                             <div className="flex items-center justify-center py-10 text-gray-500"> <IconLoader2 size={24} className="animate-spin mr-2"/> Generating analysis... </div>
                           ) : analysis ? (
                             <ReactMarkdown>{analysis}</ReactMarkdown> // Assumes analysis markdown includes headings like ## Heading
                           ) : (
                             <p className="italic text-gray-500">Analysis and recommendations will appear here.</p>
                           )}
                        </div>
                     </div>
                </div>
             </div>
        )}

        {/* Scroll target */}
        <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
      </div>

      {/* Chat Input at the bottom */}
      <ChatInput
        stopConversationRef={stopConversationRef}
        textareaRef={null as any} // Adjust if textareaRef is needed from context/props
        onSend={(msg) => { handleTranscriptReceived(msg.content); }}
        onRegenerate={handleRegenerate}
        onScrollDownClick={scrollToBottom}
        showScrollDownButton={!autoScrollEnabled && Boolean(chatContainerRef.current && chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight)}
      />

      {/* Modals (Assuming styled consistently) */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat; // Ensure this is the default exp
