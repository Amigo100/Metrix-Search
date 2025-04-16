// file: /components/Chat/ChatInput.tsx

import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
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

import { PluginSelect } from './PluginSelect'; // Adjust path
import { PromptList } from './PromptList'; // Adjust path
import { VariableModal } from './VariableModal'; // Adjust path
// import { ChatInputMicButton } from './ChatInputMicButton'; // Mic button seems integrated elsewhere now

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null> | null;
  showScrollDownButton: boolean;
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
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

  // --- State and Logic (Preserved) ---
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const promptListRef = useRef<HTMLUListElement | null>(null);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const setActivePromptIndex = (idx: number) => { homeDispatch({ type: 'change', field: 'activePromptIndex', value: idx }); };
  const setVariables = (vars: any) => { homeDispatch({ type: 'change', field: 'promptVariables', value: vars }); };
  const setTextInputContent = (content: string) => { homeDispatch({ type: 'change', field: 'textInputContent', value: content }); };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = selectedConversation?.model.maxLength;
    if (maxLength && value.length > maxLength) { alert( t( `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`, { maxLength, valueLength: value.length }, ), ); return; }
    setTextInputContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming) return;
    if (!textInputContent) { alert(t('Please enter a message')); return; }
    const userMsg: Message = { role: 'user', content: textInputContent };
    onSend(userMsg, plugin);
    setTextInputContent('');
    setPlugin(null);
    if (window.innerWidth < 640 && textareaRef?.current) { textareaRef.current.blur(); }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => { stopConversationRef.current = false; }, 1000);
  };

  const isMobile = () => { const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent; return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test( ua, ); };

  const handleInitModal = () => { const selectedPrompt = filteredPrompts[activePromptIndex]; if (selectedPrompt) { const newContent = textInputContent?.replace( /\/\w*$/, selectedPrompt.content, ); setTextInputContent(newContent || ''); handlePromptSelect(selectedPrompt); } setShowPromptList(false); };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') { e.preventDefault(); const newIndex = activePromptIndex < filteredPrompts.length - 1 ? activePromptIndex + 1 : activePromptIndex; setActivePromptIndex(newIndex); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); const newIndex = activePromptIndex > 0 ? activePromptIndex - 1 : activePromptIndex; setActivePromptIndex(newIndex); }
      else if (e.key === 'Tab') { e.preventDefault(); const newIndex = activePromptIndex < filteredPrompts.length - 1 ? activePromptIndex + 1 : 0; setActivePromptIndex(newIndex); }
      else if (e.key === 'Enter') { e.preventDefault(); handleInitModal(); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowPromptList(false); }
      else { setActivePromptIndex(0); }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) { e.preventDefault(); handleSend(); }
    else if (e.key === '/' && e.metaKey) { e.preventDefault(); setShowPluginSelect(!showPluginSelect); }
  };

  const parseVariables = (content: string) => { const regex = /{{(.*?)}}/g; const foundVars: string[] = []; let match; while ((match = regex.exec(content)) !== null) { foundVars.push(match[1]); } return foundVars; };

  const updatePromptListVisibility = useCallback((text: string) => { const match = text.match(/\/\w*$/); if (match) { setShowPromptList(true); setPromptInputValue(match[0].slice(1)); } else { setShowPromptList(false); setPromptInputValue(''); } }, []);

  const handlePromptSelect = (prompt: Prompt) => { const vars = parseVariables(prompt.content); setVariables(vars); if (vars.length > 0) { homeDispatch({ type: 'change', field: 'promptModalVisible', value: true, }); } else { const replaced = textInputContent?.replace(/\/\w*$/, prompt.content); setTextInputContent(replaced || ''); updatePromptListVisibility(replaced || ''); } };

  const handleSubmit = (updatedVars: string[]) => { const newContent = textInputContent?.replace( /{{(.*?)}}/g, (match, variable) => { const idx = promptVariables.indexOf(variable); return updatedVars[idx]; }, ); setTextInputContent(newContent || ''); if (textareaRef?.current) { textareaRef.current.focus(); } };

  useEffect(() => { if (promptListRef.current) { promptListRef.current.scrollTop = activePromptIndex * 30; } }, [activePromptIndex]);

  useEffect(() => { if (textareaRef?.current) { textareaRef.current.style.height = 'inherit'; textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; textareaRef.current.style.overflow = textareaRef.current.scrollHeight > 400 ? 'auto' : 'hidden'; } }, [textInputContent, textareaRef]);

  useEffect(() => { const handleOutsideClick = (e: MouseEvent) => { if ( promptListRef.current && !promptListRef.current.contains(e.target as Node) ) { setShowPromptList(false); } }; window.addEventListener('click', handleOutsideClick); return () => { window.removeEventListener('click', handleOutsideClick); }; }, []);


  return (
    <>
      {/* Sticky bottom bar container - Updated Styling */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3"> {/* Removed dark: classes */}
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-3"> {/* Increased gap slightly */}
          {/* Top row: Stop / Regenerate (if any) */}
          <div className="flex items-center gap-3 h-8"> {/* Added fixed height */}
            {/* If streaming => Stop button */}
            {messageIsStreaming && (
              <button
                // Updated styling
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-gray-700 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                onClick={handleStopConversation}
              >
                <IconPlayerStop size={18} /> {/* Adjusted size */}
                {t('Stop Generating')}
              </button>
            )}

            {/* If we have at least 1 msg => show "Regenerate response" */}
            {!messageIsStreaming &&
              selectedConversation &&
              selectedConversation.messages.length > 0 && (
                <button
                  // Updated styling
                  className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-gray-700 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                  onClick={onRegenerate}
                >
                  <IconRepeat size={18} /> {/* Adjusted size */}
                  {t('Regenerate response')}
                </button>
              )}
          </div>

          {/* Middle row: input area + plugin button + send button */}
          <div className="flex items-end space-x-3"> {/* Use items-end for alignment */}
            {/* Plugin toggle button */}
            <button
              // Updated styling
              className="h-10 w-10 flex items-center justify-center text-gray-500 border border-gray-300 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
              onClick={() => setShowPluginSelect(!showPluginSelect)}
              title={plugin ? `Using ${plugin.name}` : 'Select Plugin (Optional)'}
            >
              {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />} {/* Adjusted size */}
            </button>

            {/* Plugin select pop-up */}
            {/* Updated styling */}
            {showPluginSelect && (
              <div className="absolute left-4 bottom-24 mb-1 rounded-lg border border-gray-300 bg-white z-10 shadow-lg"> {/* Adjusted position and styling */}
                <PluginSelect
                  plugin={plugin}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setShowPluginSelect(false); textareaRef?.current?.focus(); } }}
                  onPluginChange={(newPlugin: Plugin) => { setPlugin(newPlugin); setShowPluginSelect(false); textareaRef?.current?.focus(); }}
                />
              </div>
            )}

            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef || undefined}
                // Updated styling to match theme inputs
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 // Adjusted padding for send button
                           focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500
                           text-base text-gray-900 bg-white
                           max-h-48 overflow-y-auto resize-none placeholder-gray-400" // Adjusted max-h
                style={{ scrollbarWidth: 'thin' }} // Optional: thin scrollbar
                placeholder={t('Enter text transcription or type message...') || ''} // Updated placeholder
                value={textInputContent}
                rows={1}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />

              {/* Send button positioned inside textarea div */}
               <button
                className={`absolute right-2 bottom-1.5 h-7 w-7 flex items-center justify-center rounded-md text-white transition-colors ${
                  messageIsStreaming || !textInputContent
                    ? 'bg-gray-300 cursor-not-allowed' // Disabled style
                    : 'bg-teal-600 hover:bg-teal-700' // Enabled style
                }`}
                onClick={handleSend}
                disabled={messageIsStreaming || !textInputContent}
                title="Send message"
              >
                <IconSend size={16} />
              </button>

              {/* Prompt suggestions */}
              {/* Updated styling */}
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

             {/* Mic Button - Removed from here, assuming integrated elsewhere */}
             {/* <ChatInputMicButton /> */}

          </div>

          {/* Bottom row: optional scroll-down button */}
          {showScrollDownButton && (
            <div className="flex justify-center -mt-10 relative z-10"> {/* Positioned above input */}
              <button
                // Updated styling
                className="h-8 w-8 flex items-center justify-center rounded-full
                           bg-white text-gray-600 shadow-md border border-gray-200 hover:bg-gray-100
                           focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                onClick={onScrollDownClick}
                title="Scroll to bottom"
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
