// ============================================================
// file: /components/Chat/ChatInput.tsx - Add Export
// ============================================================
// Props interface remains the same
interface ChatInputProps { onSend: (message: Message, plugin: Plugin | null) => void; onRegenerate: () => void; onScrollDownClick: () => void; stopConversationRef: MutableRefObject<boolean>; textareaRef: MutableRefObject<HTMLTextAreaElement | null> | null; showScrollDownButton: boolean; }
// *** ADDED EXPORT HERE ***
export const ChatInput = ({ onSend, onRegenerate, onScrollDownClick, stopConversationRef, textareaRef, showScrollDownButton, }: ChatInputProps) => {
  const { t } = useTranslation('chat');
  const { state: { selectedConversation, messageIsStreaming, prompts, activePromptIndex, promptModalVisible, promptVariables, textInputContent, }, dispatch: homeDispatch, } = useContext(HomeContext);
  // State and Logic (Preserved)
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const promptListRef = useRef<HTMLUListElement | null>(null);
  const filteredPrompts = prompts.filter((prompt) => prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()));
  const setActivePromptIndex = (idx: number) => { homeDispatch({ type: 'change', field: 'activePromptIndex', value: idx }); };
  const setVariables = (vars: any) => { homeDispatch({ type: 'change', field: 'promptVariables', value: vars }); };
  const setTextInputContent = (content: string) => { homeDispatch({ type: 'change', field: 'textInputContent', value: content }); };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { /* ... preserved logic ... */ const value = e.target.value; const maxLength = selectedConversation?.model.maxLength; if (maxLength && value.length > maxLength) { alert( t( `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`, { maxLength, valueLength: value.length }, ), ); return; } setTextInputContent(value); updatePromptListVisibility(value); };
  const handleSend = () => { /* ... preserved logic ... */ if (messageIsStreaming) return; if (!textInputContent) { /* Consider removing alert for better UX */ return; } const userMsg: Message = { role: 'user', content: textInputContent }; onSend(userMsg, plugin); setTextInputContent(''); setPlugin(null); if (window.innerWidth < 640 && textareaRef?.current) { textareaRef.current.blur(); } };
  const handleStopConversation = () => { /* ... preserved logic ... */ stopConversationRef.current = true; setTimeout(() => { stopConversationRef.current = false; }, 1000); };
  const isMobile = () => { /* ... preserved logic ... */ const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent; return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test( ua, ); };
  const handleInitModal = () => { /* ... preserved logic ... */ const selectedPrompt = filteredPrompts[activePromptIndex]; if (selectedPrompt) { const newContent = textInputContent?.replace( /\/\w*$/, selectedPrompt.content, ); setTextInputContent(newContent || ''); handlePromptSelect(selectedPrompt); } setShowPromptList(false); };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { /* ... preserved logic ... */ if (showPromptList) { if (e.key === 'ArrowDown') { e.preventDefault(); const newIndex = activePromptIndex < filteredPrompts.length - 1 ? activePromptIndex + 1 : activePromptIndex; setActivePromptIndex(newIndex); } else if (e.key === 'ArrowUp') { e.preventDefault(); const newIndex = activePromptIndex > 0 ? activePromptIndex - 1 : activePromptIndex; setActivePromptIndex(newIndex); } else if (e.key === 'Tab') { e.preventDefault(); const newIndex = activePromptIndex < filteredPrompts.length - 1 ? activePromptIndex + 1 : 0; setActivePromptIndex(newIndex); } else if (e.key === 'Enter') { e.preventDefault(); handleInitModal(); } else if (e.key === 'Escape') { e.preventDefault(); setShowPromptList(false); } else { setActivePromptIndex(0); } } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) { e.preventDefault(); handleSend(); } else if (e.key === '/' && e.metaKey) { e.preventDefault(); setShowPluginSelect(!showPluginSelect); } };
  const parseVariables = (content: string) => { /* ... preserved logic ... */ const regex = /{{(.*?)}}/g; const foundVars: string[] = []; let match; while ((match = regex.exec(content)) !== null) { foundVars.push(match[1]); } return foundVars; };
  const updatePromptListVisibility = useCallback((text: string) => { /* ... preserved logic ... */ const match = text.match(/\/\w*$/); if (match) { setShowPromptList(true); setPromptInputValue(match[0].slice(1)); } else { setShowPromptList(false); setPromptInputValue(''); } }, []);
  const handlePromptSelect = (prompt: Prompt) => { /* ... preserved logic ... */ const vars = parseVariables(prompt.content); setVariables(vars); if (vars.length > 0) { homeDispatch({ type: 'change', field: 'promptModalVisible', value: true, }); } else { const replaced = textInputContent?.replace(/\/\w*$/, prompt.content); setTextInputContent(replaced || ''); updatePromptListVisibility(replaced || ''); } };
  const handleSubmit = (updatedVars: string[]) => { /* ... preserved logic ... */ const newContent = textInputContent?.replace( /{{(.*?)}}/g, (match, variable) => { const idx = promptVariables.indexOf(variable); return updatedVars[idx]; }, ); setTextInputContent(newContent || ''); if (textareaRef?.current) { textareaRef.current.focus(); } };
  useEffect(() => { /* ... preserved logic ... */ if (promptListRef.current) { promptListRef.current.scrollTop = activePromptIndex * 30; } }, [activePromptIndex]);
  useEffect(() => { /* ... preserved logic ... */ if (textareaRef?.current) { textareaRef.current.style.height = 'inherit'; const scrollHeight = textareaRef.current.scrollHeight; const maxHeight = 160; // Max height in pixels (approx max-h-40) textareaRef.current.style.height = `${scrollHeight}px`; textareaRef.current.style.overflow = scrollHeight > maxHeight ? 'auto' : 'hidden'; } }, [textInputContent, textareaRef]);
  useEffect(() => { /* ... preserved logic ... */ const handleOutsideClick = (e: MouseEvent) => { if ( promptListRef.current && !promptListRef.current.contains(e.target as Node) ) { setShowPromptList(false); } }; window.addEventListener('click', handleOutsideClick); return () => { window.removeEventListener('click', handleOutsideClick); }; }, []);

  return (
    <>
      {/* --- Redesigned Chat Input Bar --- */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
          {/* Top row: Stop / Regenerate Buttons (centered) */}
          <div className="flex items-center justify-center gap-3 h-8">
            {messageIsStreaming && ( <button className={`${secondaryButtonStyles} px-3 py-1 text-xs`} onClick={handleStopConversation}> <IconPlayerStop size={14} className="mr-1" /> Stop </button> )}
            {!messageIsStreaming && selectedConversation && selectedConversation.messages.length > 1 && ( <button className={`${secondaryButtonStyles} px-3 py-1 text-xs`} onClick={onRegenerate}> <IconRepeat size={14} className="mr-1" /> Regenerate </button> )}
          </div>

          {/* Main Input Row */}
          <div className="flex items-end space-x-3">
            {/* Plugin Button (Optional) */}
            {/* <button className={`${ghostButtonStyles} h-10 w-10 border border-gray-300 rounded-lg flex-shrink-0`} onClick={() => setShowPluginSelect(!showPluginSelect)} title={plugin ? `Using ${plugin.name}` : 'Select Plugin'} > {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />} </button> */}
            {/* {showPluginSelect && ( <div className="absolute left-4 bottom-full mb-2 rounded-lg border border-gray-200 bg-white z-30 shadow-lg"> <PluginSelect plugin={plugin} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setShowPluginSelect(false); textareaRef?.current?.focus(); } }} onPluginChange={(newPlugin: Plugin) => { setPlugin(newPlugin); setShowPluginSelect(false); textareaRef?.current?.focus(); }} /> </div> )} */}

            {/* Textarea Input */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef || undefined}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-12 // Padding right for button
                           focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500
                           text-base text-gray-900 bg-white
                           max-h-40 overflow-y-auto resize-none placeholder-gray-400"
                style={{ scrollbarWidth: 'thin' }}
                placeholder={t('Paste transcript, or type follow-up question...') || ''}
                value={textInputContent}
                rows={1}
                onCompositionStart={() => setIsTyping(true)} onCompositionEnd={() => setIsTyping(false)} onChange={handleChange} onKeyDown={handleKeyDown}
              />
              {/* Send button positioned inside */}
               <button
                className={`absolute right-2 bottom-2 h-8 w-8 flex items-center justify-center rounded-lg text-white transition-colors duration-200 ease-in-out ${ messageIsStreaming || !textInputContent ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700' }`}
                onClick={handleSend} disabled={messageIsStreaming || !textInputContent} title="Send message"
              > <IconSend size={16} /> </button>

              {/* Prompt suggestions */}
              {showPromptList && filteredPrompts.length > 0 && ( <div className="absolute bottom-full left-0 w-full mb-1 z-10"> <PromptList activePromptIndex={activePromptIndex} prompts={filteredPrompts} onSelect={handleInitModal} onMouseOver={setActivePromptIndex} promptListRef={promptListRef} /> </div> )}
              {/* Variable Modal */}
              {promptModalVisible && ( <VariableModal prompt={filteredPrompts[activePromptIndex]} variables={promptVariables} onSubmit={handleSubmit} onClose={() => homeDispatch({ type: 'change', field: 'promptModalVisible', value: false, }) } /> )}
            </div>
          </div>

          {/* Scroll-down button (floating) */}
          {showScrollDownButton && (
            <div className="absolute bottom-20 right-6 z-10">
              <button className="h-9 w-9 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500" onClick={onScrollDownClick} title="Scroll to bottom" > <IconArrowDown size={18} /> </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

