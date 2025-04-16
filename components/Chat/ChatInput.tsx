// /components/Chat/ChatInput.tsx
// CORRECTED VERSION 4 (Fixes i18next title type error)

import {
  ArrowDown,   // Lucide replacement
  Bolt,        // Lucide replacement
  Send,        // Lucide replacement
  Repeat,      // Lucide replacement
  XCircle,     // Lucide replacement (for Stop button)
  Loader2,     // Lucide replacement
} from 'lucide-react';
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

import HomeContext from '@/pages/api/home/home.context';

// Child Components (Assuming styling is handled elsewhere or props allow customization)
import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';

// --- Style Constants (Derived from reference pages) ---
const primaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed"; // Adjusted padding
const ghostButtonStyles = "inline-flex items-center justify-center p-1.5 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed";
const formInputStyles = "block w-full rounded-lg border border-gray-300 py-2 px-3 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm";

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null> | null;
  showScrollDownButton: boolean;
  placeholder?: string;
  showRegenerateButton?: boolean;
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  placeholder,
  showRegenerateButton = true,
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
      textInputContent,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // --- State & Logic (Preserved) ---
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const promptListRef = useRef<HTMLUListElement | null>(null);

  const setTextInputContent = (content: string) => { homeDispatch({ type: 'change', field: 'textInputContent', value: content }); };
  const filteredPrompts = prompts.filter((prompt) => prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()));
  const setActivePromptIndex = (idx: number) => { homeDispatch({ type: 'change', field: 'activePromptIndex', value: idx }); };
  const setVariables = (vars: any) => { homeDispatch({ type: 'change', field: 'promptVariables', value: vars }); };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextInputContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming || !textInputContent?.trim()) return;
    const userMsg: Message = { role: 'user', content: textInputContent };
    onSend(userMsg, plugin);
    setTextInputContent(''); setPlugin(null);
    textareaRef?.current?.focus(); // Keep focus after send
  };

  const handleStopConversation = () => { stopConversationRef.current = true; setTimeout(() => { stopConversationRef.current = false; }, 1000); };
  const isMobile = () => typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
  const handleInitModal = () => { const selectedPrompt = filteredPrompts[activePromptIndex]; if (selectedPrompt) { const newContent = textInputContent?.replace(/\/\w*$/, selectedPrompt.content); setTextInputContent(newContent || ''); handlePromptSelect(selectedPrompt); } setShowPromptList(false); };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActivePromptIndex(Math.min(activePromptIndex + 1, filteredPrompts.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActivePromptIndex(Math.max(activePromptIndex - 1, 0)); }
      else if (e.key === 'Tab') { e.preventDefault(); setActivePromptIndex((activePromptIndex + 1) % filteredPrompts.length); }
      else if (e.key === 'Enter') { e.preventDefault(); handleInitModal(); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowPromptList(false); }
      else { setActivePromptIndex(0); }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const parseVariables = (content: string) => { const regex = /{{(.*?)}}/g; const found: string[] = []; let match; while ((match = regex.exec(content)) !== null) { found.push(match[1]); } return found; };
  const updatePromptListVisibility = useCallback((text: string) => { const match = text.match(/\/\w*$/); if (match) { setShowPromptList(true); setPromptInputValue(match[0].slice(1)); } else { setShowPromptList(false); setPromptInputValue(''); } }, []);
  const handlePromptSelect = (prompt: Prompt) => { const vars = parseVariables(prompt.content); setVariables(vars); if (vars.length > 0) { homeDispatch({ type: 'change', field: 'promptModalVisible', value: true }); } else { const replaced = textInputContent?.replace(/\/\w*$/, prompt.content); setTextInputContent(replaced || ''); updatePromptListVisibility(replaced || ''); } };
  const handleSubmit = (updatedVars: string[]) => { const newContent = textInputContent?.replace(/{{(.*?)}}/g, (match, variable) => { const idx = promptVariables.indexOf(variable); return updatedVars[idx] ?? match; }); setTextInputContent(newContent || ''); textareaRef?.current?.focus(); };

  useEffect(() => { if (promptListRef.current) { promptListRef.current.scrollTop = activePromptIndex * 30; } }, [activePromptIndex]);
  useEffect(() => { if (textareaRef?.current) { textareaRef.current.style.height = 'inherit'; const scrollHeight = textareaRef.current.scrollHeight; const maxHeight = 160; textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`; textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'; } }, [textInputContent, textareaRef]);
  useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (promptListRef.current && !promptListRef.current.contains(e.target as Node)) { setShowPromptList(false); } }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);

  return (
    <>
      {/* Container with relative positioning for scroll button */}
      <div className="relative px-4 py-1"> {/* Reduced vertical padding */}
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">

          {/* Top row: Stop / Regenerate buttons */}
          {(messageIsStreaming || (showRegenerateButton && selectedConversation && selectedConversation.messages.length > 0)) && (
            <div className="flex items-center justify-center gap-2 h-7 mb-1"> {/* Reduced height/gap */}
              {messageIsStreaming && (
                <button className={`${secondaryButtonStyles} !text-red-600 hover:!bg-red-50 hover:!border-red-300`} onClick={handleStopConversation}>
                  <XCircle size={14} className="mr-1.5" /> {t('Stop Generating')}
                </button>
              )}
              {!messageIsStreaming && showRegenerateButton && selectedConversation && selectedConversation.messages.length > 0 && (
                <button className={secondaryButtonStyles} onClick={onRegenerate}>
                  <Repeat size={14} className="mr-1.5" /> {t('Regenerate')}
                </button>
              )}
            </div>
          )}

          {/* Input area row */}
          <div className="flex items-end space-x-2">
            {/* Optional Plugin Button */}
            {/* <button className={secondaryButtonStyles}> <Bolt size={16}/> </button> */}

            {/* Textarea */}
            <div className="relative flex-1">
              {/* Apply consistent input style */}
              <textarea
                ref={textareaRef || undefined}
                className={`${formInputStyles} pr-12 min-h-[44px] max-h-[160px] resize-none overflow-y-auto`} // Use formInputStyles
                style={{ scrollbarWidth: 'thin' }}
                placeholder={placeholder || t('Type a message...') || ''}
                value={textInputContent || ''}
                rows={1}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={messageIsStreaming}
              />

              {/* Send button */}
              <button
                 // Use primary button style, adjust size/padding
                className={`${primaryButtonStyles} absolute right-1.5 bottom-1.5 !px-2.5 !py-1.5 h-8 w-8 flex items-center justify-center !rounded-md`} // Adjusted size, position, make square-ish
                onClick={handleSend}
                disabled={messageIsStreaming || !textInputContent?.trim()}
                // *** TYPE ERROR FIX: Use type assertion ***
                title={t('Send message') as string}
              >
                 {messageIsStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>


              {/* Prompt suggestions */}
              {showPromptList && filteredPrompts.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-1 z-10">
                  <PromptList
                    activePromptIndex={activePromptIndex} prompts={filteredPrompts}
                    onSelect={handleInitModal} onMouseOver={setActivePromptIndex}
                    promptListRef={promptListRef}
                  />
                </div>
              )}

              {/* Variable Modal */}
              {promptModalVisible && (
                <VariableModal
                  prompt={filteredPrompts[activePromptIndex]} variables={promptVariables}
                  onSubmit={handleSubmit}
                  onClose={() => homeDispatch({ type: 'change', field: 'promptModalVisible', value: false })}
                />
              )}
            </div>
          </div>
        </div>

        {/* Scroll-down button positioned absolutely relative to outer container */}
         {showScrollDownButton && (
            <button
                className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-white text-gray-500 shadow-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                onClick={onScrollDownClick}
                // *** TYPE ERROR FIX: Use type assertion ***
                title={t('Scroll to bottom') as string}
            >
                <ArrowDown size={16} />
            </button>
         )}
      </div>
    </>
  );
};
