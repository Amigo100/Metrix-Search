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

import HomeContext from '@/pages/api/home/home.context';

import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';
import { ChatInputMicButton } from './ChatInputMicButton';

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

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);

  const promptListRef = useRef<HTMLUListElement | null>(null);

  // Filter prompts
  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  // Dispatch-based setter for activePromptIndex
  const setActivePromptIndex = (idx: number) => {
    homeDispatch({ type: 'change', field: 'activePromptIndex', value: idx });
  };

  const setVariables = (vars: any) => {
    homeDispatch({ type: 'change', field: 'promptVariables', value: vars });
  };

  const setTextInputContent = (content: string) => {
    homeDispatch({ type: 'change', field: 'textInputContent', value: content });
  };

  // On text area changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = selectedConversation?.model.maxLength;

    if (maxLength && value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }
    setTextInputContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming) return;
    if (!textInputContent) {
      alert(t('Please enter a message'));
      return;
    }
    const userMsg: Message = {
      role: 'user',
      content: textInputContent,
    };
    onSend(userMsg, plugin);
    setTextInputContent('');
    setPlugin(null);

    // close mobile keyboard
    if (window.innerWidth < 640 && textareaRef?.current) {
      textareaRef.current.blur();
    }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  const isMobile = () => {
    const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      ua,
    );
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      const newContent = textInputContent?.replace(
        /\/\w*$/,
        selectedPrompt.content,
      );
      setTextInputContent(newContent || '');
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If showing prompt suggestions...
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex =
          activePromptIndex < filteredPrompts.length - 1
            ? activePromptIndex + 1
            : activePromptIndex;
        setActivePromptIndex(newIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex =
          activePromptIndex > 0 ? activePromptIndex - 1 : activePromptIndex;
        setActivePromptIndex(newIndex);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const newIndex =
          activePromptIndex < filteredPrompts.length - 1
            ? activePromptIndex + 1
            : 0;
        setActivePromptIndex(newIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        // If user typed something else, reset to 0
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      // Regular "Enter" => Send
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      // For plugin select
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVars: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      foundVars.push(match[1]);
    }
    return foundVars;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);
    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const vars = parseVariables(prompt.content);
    setVariables(vars);
    if (vars.length > 0) {
      homeDispatch({
        type: 'change',
        field: 'promptModalVisible',
        value: true,
      });
    } else {
      const replaced = textInputContent?.replace(/\/\w*$/, prompt.content);
      setTextInputContent(replaced || '');
      updatePromptListVisibility(replaced || '');
    }
  };

  const handleSubmit = (updatedVars: string[]) => {
    // Fill in the prompt placeholders with user-provided values
    const newContent = textInputContent?.replace(
      /{{(.*?)}}/g,
      (match, variable) => {
        const idx = promptVariables.indexOf(variable);
        return updatedVars[idx];
      },
    );
    setTextInputContent(newContent || '');
    if (textareaRef?.current) {
      textareaRef.current.focus();
    }
  };

  // Scroll prompt list to keep active index in view
  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  // Auto-grow the textarea as user types
  useEffect(() => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.style.overflow =
        textareaRef.current.scrollHeight > 400 ? 'auto' : 'hidden';
    }
  }, [textInputContent, textareaRef]);

  // Close prompt list if user clicks outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <>
      {/* Sticky bottom bar container */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 dark:bg-[#343541] dark:border-neutral-600">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
          {/* Top row: Stop / Regenerate (if any) */}
          <div className="flex items-center gap-3">
            {/* If streaming => Stop button */}
            {messageIsStreaming && (
              <button
                className="flex items-center gap-2 rounded-full border border-neutral-300
                           bg-white px-3 py-2 text-black text-sm hover:opacity-70
                           dark:border-neutral-600 dark:bg-[#40414F] dark:text-white"
                onClick={handleStopConversation}
              >
                <IconPlayerStop size={20} />
                {t('Stop Generating')}
              </button>
            )}

            {/* If we have at least 1 msg => show "Regenerate response" */}
            {!messageIsStreaming &&
              selectedConversation &&
              selectedConversation.messages.length > 0 && (
                <button
                  className="flex items-center gap-2 rounded-full border border-neutral-300
                             bg-white px-3 py-2 text-black text-sm hover:opacity-70
                             dark:border-neutral-600 dark:bg-[#40414F] dark:text-white"
                  onClick={onRegenerate}
                >
                  <IconRepeat size={20} />
                  {t('Regenerate response')}
                </button>
              )}
          </div>

          {/* Middle row: input area + plugin button + send button + mic */}
          <div className="flex items-center space-x-3">
            {/* Plugin toggle button */}
            <button
              className="h-10 w-10 flex items-center justify-center text-neutral-600 
                         dark:text-neutral-100 border border-gray-300 dark:border-neutral-600 
                         rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600"
              onClick={() => setShowPluginSelect(!showPluginSelect)}
            >
              {plugin ? <IconBrandGoogle size={24} /> : <IconBolt size={24} />}
            </button>

            {/* Plugin select pop-up */}
            {showPluginSelect && (
              <div className="absolute left-4 bottom-20 rounded bg-white dark:bg-[#343541] z-10 shadow-md">
                <PluginSelect
                  plugin={plugin}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setShowPluginSelect(false);
                      textareaRef?.current?.focus();
                    }
                  }}
                  onPluginChange={(newPlugin: Plugin) => {
                    setPlugin(newPlugin);
                    setShowPluginSelect(false);
                    textareaRef?.current?.focus();
                  }}
                />
              </div>
            )}

            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef || undefined}
                className="flex-1 w-full border border-gray-300 rounded-full px-4 py-2
                           focus:outline-none text-lg text-black dark:text-white
                           dark:border-neutral-600 dark:bg-[#40414F] 
                           max-h-60 overflow-hidden resize-none"
                style={{ maxHeight: '400px' }}
                placeholder={t('Enter a question to ask...') || ''}
                value={textInputContent}
                rows={1}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />

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

              {promptModalVisible && (
                <VariableModal
                  prompt={filteredPrompts[activePromptIndex]}
                  variables={promptVariables}
                  onSubmit={handleSubmit}
                  onClose={() =>
                    homeDispatch({
                      type: 'change',
                      field: 'promptModalVisible',
                      value: false,
                    })
                  }
                />
              )}
            </div>

            {/* Send button */}
            <button
              className={`h-10 w-10 flex items-center justify-center rounded-full text-white
                          transition-colors ${
                            messageIsStreaming
                              ? 'bg-[#008080] cursor-not-allowed'
                              : 'bg-[#008080] hover:bg-[#006666]'
                          }`}
              onClick={handleSend}
              disabled={messageIsStreaming}
            >
              {/* If streaming, you can show text or spinner; otherwise icon */}
              {messageIsStreaming ? (
                <span className="text-sm">{t('Sending...')}</span>
              ) : (
                <IconSend size={24} />
              )}
            </button>
          </div>

          {/* Bottom row: optional scroll-down button */}
          {showScrollDownButton && (
            <div className="flex justify-end">
              <button
                className="h-10 w-10 flex items-center justify-center rounded-full 
                           bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
              >
                <IconArrowDown size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
