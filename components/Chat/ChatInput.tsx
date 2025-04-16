// /components/Chat/ChatInput.tsx
// CORRECTED VERSION 5 (Restores props to VariableModal)

import {
  ArrowDown, Send, Repeat, XCircle, Loader2, Bolt // Added Bolt back for placeholder plugin button
} from 'lucide-react';
import {
  KeyboardEvent, MutableRefObject, useCallback, useContext, useEffect, useRef, useState
} from 'react';
import { useTranslation } from 'next-i18next';

import { Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

// Child Components
import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal'; // Assuming VariableModal exists and expects props

// --- Style Constants ---
const primaryButtonStyles = "inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-full h-10 w-10 flex-shrink-0 text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed";
const formInputStyles = "block w-full rounded-lg border border-gray-300 py-2 px-4 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-sm";

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
  const { state: { selectedConversation, messageIsStreaming, prompts, activePromptIndex, promptModalVisible, promptVariables, textInputContent }, dispatch: homeDispatch } = useContext(HomeContext);

  // --- State & Logic ---
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
    textareaRef?.current?.focus();
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

  const parseVariables = (content: string): string[] => { const regex = /{{(.*?)}}/g; const found: string[] = []; let match; while ((match = regex.exec(content)) !== null) { found.push(match[1]); } return found; };
  const updatePromptListVisibility = useCallback((text: string) => { const match = text.match(/\/\w*$/); if (match) { setShowPromptList(true); setPromptInputValue(match[0].slice(1)); } else { setShowPromptList(false); setPromptInputValue(''); } }, []);

  const handlePromptSelect = (prompt: Prompt) => {
      const currentContent = textInputContent || ''; // Ensure content is not null/undefined
      const vars = parseVariables(prompt.content);
      setVariables(vars);
      if (vars.length > 0) {
          homeDispatch({ type: 'change', field: 'promptModalVisible', value: true });
      } else {
          // Ensure textInputContent is treated as string for replace
          const replaced = currentContent.replace(/\/\w*$/, prompt.content);
          setTextInputContent(replaced);
          updatePromptListVisibility(replaced);
      }
  };

  const handleSubmit = (updatedVars: string[]) => {
      const currentContent = textInputContent || ''; // Ensure content is not null/undefined
      let i = 0;
      const newContent = currentContent.replace(/{{(.*?)}}/g, () => updatedVars[i++] || ''); // Replace placeholders
      setTextInputContent(newContent);
      homeDispatch({ type: 'change', field: 'promptModalVisible', value: false }); // Close modal after submit
      textareaRef?.current?.focus();
  };


  useEffect(() => { if (promptListRef.current) { promptListRef.current.scrollTop = activePromptIndex * 30; } }, [activePromptIndex]);
  useEffect(() => { if (textareaRef?.current) { textareaRef.current.style.height = 'inherit'; const scrollHeight = textareaRef.current.scrollHeight; const maxHeight = 120; textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`; textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'; } }, [textInputContent, textareaRef]);
  useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (promptListRef.current && !promptListRef.current.contains(e.target as Node)) { setShowPromptList(false); } }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);

  return (
    <>
      {/* Container for input and button */}
       <div className="relative flex items-end gap-3">

          {/* Regenerate/Stop Buttons */}
          {(messageIsStreaming || (showRegenerateButton && selectedConversation && selectedConversation.messages.length > 0)) && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center justify-center gap-2 h-7">
              {messageIsStreaming && ( <button className={`${secondaryButtonStyles} !text-red-600 hover:!bg-red-50 hover:!border-red-300`} onClick={handleStopConversation}> <XCircle size={14} className="mr-1.5" /> {t('Stop Generating')} </button> )}
              {!messageIsStreaming && showRegenerateButton && selectedConversation && selectedConversation.messages.length > 0 && ( <button className={secondaryButtonStyles} onClick={onRegenerate}> <Repeat size={14} className="mr-1.5" /> {t('Regenerate')} </button> )}
            </div>
          )}

          {/* Input Field Wrapper */}
          <div className="relative flex-1">
             <textarea
                ref={textareaRef || undefined}
                className={`${formInputStyles} pr-12 min-h-[40px] max-h-[120px] resize-none overflow-y-auto`}
                style={{ scrollbarWidth: 'thin' }}
                placeholder={placeholder || t('Type message...') || ''}
                value={textInputContent || ''}
                rows={1}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={messageIsStreaming}
             />

              {/* Prompt suggestions */}
              {showPromptList && filteredPrompts.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-1 z-30">
                  <PromptList
                    activePromptIndex={activePromptIndex} prompts={filteredPrompts}
                    onSelect={handleInitModal} onMouseOver={setActivePromptIndex}
                    promptListRef={promptListRef}
                  />
                </div>
              )}
          </div>

           {/* Send Button */}
           <button
                className={`${primaryButtonStyles} /* !px-3 automatically handled by h/w */ /* !py-2 automatically handled by h/w */`}
                onClick={handleSend}
                disabled={messageIsStreaming || !textInputContent?.trim()}
                title={t('Send message') as string}
            >
                {messageIsStreaming ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
           </button>

            {/* Variable Modal - *** RESTORED PROPS *** */}
            {promptModalVisible && (
                <VariableModal
                    prompt={filteredPrompts[activePromptIndex]} // Pass the selected prompt
                    variables={promptVariables}                // Pass the extracted variables
                    onSubmit={handleSubmit}                    // Pass the submit handler
                    onClose={() => homeDispatch({ type: 'change', field: 'promptModalVisible', value: false })} // Pass the close handler
                />
            )}
       </div>

       {/* Scroll-down button */}
       {showScrollDownButton && (
            <button
                className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-white text-gray-500 shadow-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                onClick={onScrollDownClick}
                title={t('Scroll to bottom') as string}
            >
                <ArrowDown size={16} />
            </button>
        )}
    </>
  );
};
