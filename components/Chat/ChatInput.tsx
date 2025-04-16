// /components/Chat/ChatInput.tsx
// Minor style adjustments for consistency with the redesign

import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconLoader2 // Added for potential future use if input needs a loading state
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'next-i18next';

import { Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context'; // Adjust path as needed

// Assuming these components exist and are styled appropriately
import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null> | null;
  showScrollDownButton: boolean;
  placeholder?: string; // Make placeholder configurable
  showRegenerateButton?: boolean; // Optional prop to control visibility
  showStopButton?: boolean; // Optional prop to control visibility
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  placeholder,
  showRegenerateButton = true, // Default to true
  // showStopButton = true, // Stop button visibility tied to messageIsStreaming context state
}: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      prompts,
      activePromptIndex,
      promptModalVisible,
      promptVariables,
      textInputContent, // Use textInputContent from context
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // --- State and Logic (Preserved) ---
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const promptListRef = useRef<HTMLUListElement | null>(null);

  // Use local state for content if textareaRef is managed internally,
  // otherwise rely on context/props if textareaRef is external.
  // We use context here based on the original code.
  const setTextInputContent = (content: string) => { homeDispatch({ type: 'change', field: 'textInputContent', value: content }); };

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const setActivePromptIndex = (idx: number) => { homeDispatch({ type: 'change', field: 'activePromptIndex', value: idx }); };
  const setVariables = (vars: any) => { homeDispatch({ type: 'change', field: 'promptVariables', value: vars }); };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Optional: Add length check based on selectedConversation model
    // const maxLength = selectedConversation?.model.maxLength;
    // if (maxLength && value.length > maxLength) { alert( t( `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`, { maxLength, valueLength: value.length }, ), ); return; }
    setTextInputContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming || !textInputContent?.trim()) return;
    // if (!textInputContent?.trim()) { alert(t('Please enter a message')); return; } // Basic validation
    const userMsg: Message = { role: 'user', content: textInputContent };
    onSend(userMsg, plugin);
    setTextInputContent(''); // Clear input after send
    setPlugin(null); // Reset plugin if needed
    if (window.innerWidth < 640 && textareaRef?.current) { textareaRef.current.blur(); }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => { stopConversationRef.current = false; }, 1000); // Reset flag after a delay
  };

  const isMobile = () => { const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent; return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test( ua, ); };

  const handleInitModal = () => { const selectedPrompt = filteredPrompts[activePromptIndex]; if (selectedPrompt) { const newContent = textInputContent?.replace( /\/\w*$/, selectedPrompt.content, ); setTextInputContent(newContent || ''); handlePromptSelect(selectedPrompt); } setShowPromptList(false); };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActivePromptIndex(Math.min(activePromptIndex + 1, filteredPrompts.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActivePromptIndex(Math.max(activePromptIndex - 1, 0)); }
      else if (e.key === 'Tab') { e.preventDefault(); setActivePromptIndex((activePromptIndex + 1) % filteredPrompts.length); }
      else if (e.key === 'Enter') { e.preventDefault(); handleInitModal(); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowPromptList(false); }
      else { setActivePromptIndex(0); }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) { e.preventDefault(); handleSend(); }
    // else if (e.key === '/' && e.metaKey) { e.preventDefault(); setShowPluginSelect(!showPluginSelect); } // Optional shortcut
  };

  const parseVariables = (content: string) => { const regex = /{{(.*?)}}/g; const foundVars: string[] = []; let match; while ((match = regex.exec(content)) !== null) { foundVars.push(match[1]); } return foundVars; };

  const updatePromptListVisibility = useCallback((text: string) => { const match = text.match(/\/\w*$/); if (match) { setShowPromptList(true); setPromptInputValue(match[0].slice(1)); } else { setShowPromptList(false); setPromptInputValue(''); } }, []);

  const handlePromptSelect = (prompt: Prompt) => { const vars = parseVariables(prompt.content); setVariables(vars); if (vars.length > 0) { homeDispatch({ type: 'change', field: 'promptModalVisible', value: true, }); } else { const replaced = textInputContent?.replace(/\/\w*$/, prompt.content); setTextInputContent(replaced || ''); updatePromptListVisibility(replaced || ''); } };

  const handleSubmit = (updatedVars: string[]) => { const newContent = textInputContent?.replace( /{{(.*?)}}/g, (match, variable) => { const idx = promptVariables.indexOf(variable); return updatedVars[idx] ?? match; }, ); setTextInputContent(newContent || ''); if (textareaRef?.current) { textareaRef.current.focus(); } };

  useEffect(() => { if (promptListRef.current) { promptListRef.current.scrollTop = activePromptIndex * 30; } }, [activePromptIndex]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'inherit'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // Max height in pixels (adjust as needed)
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [textInputContent, textareaRef]);


  useEffect(() => { const handleOutsideClick = (e: MouseEvent) => { if ( promptListRef.current && !promptListRef.current.contains(e.target as Node) ) { setShowPromptList(false); } }; window.addEventListener('click', handleOutsideClick); return () => { window.removeEventListener('click', handleOutsideClick); }; }, []);


  return (
    <>
      {/* Sticky bottom bar container - Updated Styling */}
      <div className="px-4 py-3"> {/* Removed sticky, border, bg - handled by parent */}
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2"> {/* Reduced gap slightly */}

          {/* Top row: Stop / Regenerate buttons */}
          {/* Conditionally render this row only if needed */}
          {(messageIsStreaming || (showRegenerateButton && selectedConversation && selectedConversation.messages.length > 0)) && (
            <div className="flex items-center justify-center gap-3 h-8 mb-1">
              {/* Stop button */}
              {messageIsStreaming && (
                <button
                  className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 transition-colors"
                  onClick={handleStopConversation}
                >
                  <IconPlayerStop size={16} />
                  {t('Stop Generating')}
                </button>
              )}

              {/* Regenerate button */}
              {!messageIsStreaming && showRegenerateButton && selectedConversation && selectedConversation.messages.length > 0 && (
                <button
                  className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 transition-colors"
                  onClick={onRegenerate}
                >
                  <IconRepeat size={16} />
                  {t('Regenerate')}
                </button>
              )}
            </div>
          )}


          {/* Input area row */}
          <div className="flex items-end space-x-3">
            {/* Plugin toggle button (Optional based on your needs) */}
            {/*
            <button
              className="flex-shrink-0 h-10 w-10 flex items-center justify-center text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
              onClick={() => setShowPluginSelect(!showPluginSelect)}
              title={plugin ? `Using ${plugin.name}` : 'Select Plugin (Optional)'}
            >
              {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
            </button>
             {showPluginSelect && (
               <div className="absolute left-4 bottom-full mb-2 rounded-lg border border-gray-300 bg-white z-20 shadow-lg p-2">
                 <PluginSelect
                   plugin={plugin}
                   onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setShowPluginSelect(false); textareaRef?.current?.focus(); } }}
                   onPluginChange={(newPlugin: Plugin) => { setPlugin(newPlugin); setShowPluginSelect(false); textareaRef?.current?.focus(); }}
                 />
               </div>
             )}
            */}


            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef || undefined}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 // Adjusted padding for send button
                          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500
                          text-base text-gray-900 bg-white
                          min-h-[44px] max-h-[200px] overflow-y-auto resize-none placeholder-gray-400"
                style={{ scrollbarWidth: 'thin' }} // Optional: thin scrollbar for browsers that support it
                placeholder={placeholder || t('Type a message or command...') || ''}
                value={textInputContent || ''} // Ensure value is controlled and not undefined
                rows={1}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={messageIsStreaming} // Disable textarea while streaming
              />

              {/* Send button positioned inside textarea div */}
               <button
                 className={`absolute right-2 bottom-1.5 h-8 w-8 flex items-center justify-center rounded-lg text-white transition-colors ${
                   messageIsStreaming || !textInputContent?.trim()
                     ? 'bg-gray-300 cursor-not-allowed' // Disabled style
                     : 'bg-teal-600 hover:bg-teal-700' // Enabled style
                 }`}
                 onClick={handleSend}
                 disabled={messageIsStreaming || !textInputContent?.trim()}
                 title="Send message"
               >
                 {messageIsStreaming ? <IconLoader2 size={16} className="animate-spin" /> : <IconSend size={16} />}
               </button>


              {/* Prompt suggestions */}
              {showPromptList && filteredPrompts.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-1 z-10">
                  <PromptList
                    activePromptIndex={activePromptIndex}
                    prompts={filteredPrompts}
                    onSelect={handleInitModal}
                    onMouseOver={setActivePromptIndex}
                    promptListRef={promptListRef}
                  />
                </div>
              )}

              {/* Variable Modal - Assuming styled consistently elsewhere */}
              {promptModalVisible && (
                <VariableModal
                  prompt={filteredPrompts[activePromptIndex]}
                  variables={promptVariables}
                  onSubmit={handleSubmit}
                  onClose={() => homeDispatch({ type: 'change', field: 'promptModalVisible', value: false, }) }
                />
              )}
            </div>
          </div>

          {/* Scroll-down button positioned below input */}
          {showScrollDownButton && (
            <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 z-10"> {/* Positioned below input */}
              <button
                className="h-7 w-7 flex items-center justify-center rounded-full
                           bg-white text-gray-600 shadow-md border border-gray-200 hover:bg-gray-100
                           focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                onClick={onScrollDownClick}
                title="Scroll to bottom"
              >
                <IconArrowDown size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
