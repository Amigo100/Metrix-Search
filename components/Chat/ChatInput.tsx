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

  // Dispatch-based “setter” for activePromptIndex
  const setActivePromptIndex = (idx: number) => {
    homeDispatch({ field: 'activePromptIndex', value: idx });
  };

  const setVariables = (vars: any) => {
    homeDispatch({ field: 'promptVariables', value: vars });
  };
  const setTextInputContent = (content: string) => {
    homeDispatch({ field: 'textInputContent', value: content });
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
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      const newContent = textInputContent?.replace(/\/\w*$/, selectedPrompt.content);
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
        // Instead of setActivePromptIndex(prev => prev + 1)
        // use the current activePromptIndex from context:
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
    } else if (
      e.key === 'Enter' &&
      !isTyping &&
      !isMobile() &&
      !e.shiftKey
    ) {
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
      homeDispatch({ field: 'promptModalVisible', value: true });
    } else {
      const replaced = textInputContent?.replace(/\/\w*$/, prompt.content);
      setTextInputContent(replaced || '');
      updatePromptListVisibility(replaced || '');
    }
  };

  const handleSubmit = (updatedVars: string[]) => {
    // Fill in the prompt placeholders with user-provided values
    const newContent = textInputContent?.replace(/{{(.*?)}}/g, (match, variable) => {
      const idx = promptVariables.indexOf(variable);
      return updatedVars[idx];
    });
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
    <div className="w-full flex flex-col">
      <div className="flex items-center gap-2 w-full">
        {/* If streaming => Stop button */}
        {messageIsStreaming && (
          <button
            className="flex h-12 items-center gap-2 rounded-md border border-neutral-200
                       bg-white px-4 text-black hover:opacity-70
                       dark:border-neutral-600 dark:bg-[#343541] dark:text-white"
            onClick={handleStopConversation}
          >
            <IconPlayerStop size={16} /> {t('Stop Generating')}
          </button>
        )}

        {/* If we have at least 1 msg => show "Regenerate response" */}
        {!messageIsStreaming &&
          selectedConversation &&
          selectedConversation.messages.length > 0 && (
            <button
              className="flex h-12 items-center gap-2 rounded-md border border-neutral-200
                         bg-white px-4 text-black hover:opacity-70
                         dark:border-neutral-600 dark:bg-[#343541] dark:text-white"
              onClick={onRegenerate}
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}

        {/* Input area */}
        <div
          className="relative flex-1 flex items-center h-12 border border-black/10
                     rounded-md bg-white shadow-sm dark:border-gray-900/50
                     dark:bg-[#40414F]"
        >
          {/* Plugin button */}
          <button
            className="absolute left-2 text-neutral-600 dark:text-neutral-100
                       hover:bg-neutral-200 dark:hover:bg-neutral-600
                       p-1 rounded-sm"
            onClick={() => setShowPluginSelect(!showPluginSelect)}
          >
            {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
          </button>

          {showPluginSelect && (
            <div className="absolute left-0 bottom-14 rounded bg-white dark:bg-[#343541]">
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

          <textarea
            ref={textareaRef || undefined}
            className="flex-1 h-full resize-none border-0 bg-transparent pl-9 pr-10 py-2
                       text-black dark:bg-transparent dark:text-white"
            style={{
              maxHeight: '400px',
              overflow:
                textareaRef?.current &&
                textareaRef.current.scrollHeight > 400
                  ? 'auto'
                  : 'hidden',
            }}
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
            <div className="absolute bottom-full left-0 w-full mb-1">
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
                homeDispatch({ field: 'promptModalVisible', value: false })
              }
            />
          )}
        </div>

        {/* Send button */}
        <button
          className="flex h-12 items-center justify-center rounded-md border border-neutral-200
                     bg-white px-4 text-black hover:opacity-70
                     dark:border-neutral-600 dark:bg-[#343541] dark:text-white"
          onClick={handleSend}
        >
          {messageIsStreaming ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 dark:border-neutral-100" />
          ) : (
            <IconSend size={18} />
          )}
        </button>

        {/* Microphone button (dictation) */}
        <ChatInputMicButton
          onSend={onSend}
          messageIsStreaming={messageIsStreaming}
        />
      </div>

      {/* Optional scroll-down button */}
      {showScrollDownButton && (
        <div className="flex justify-end mt-1">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full 
                       bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       dark:bg-gray-700 dark:text-neutral-200"
            onClick={onScrollDownClick}
          >
            <IconArrowDown size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
