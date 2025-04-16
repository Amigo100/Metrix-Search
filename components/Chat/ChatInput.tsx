import React, {
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from 'react';
import { useTranslation } from 'next-i18next';
import {
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
} from '@tabler/icons-react';

import { HomeContext } from '@/contexts/HomeContext';
import type { Message } from '@/types/chat';
import type { Prompt } from '@/types/prompt';
import type { Plugin } from '@/types/plugin';

import { PromptList } from '@/components/Chat/PromptList';
import { PluginSelect } from '@/components/Chat/PluginSelect';
import { VariableModal } from '@/components/Modals/VariableModal';

interface ChatInputProps {
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
}: ChatInputProps) => {
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
    dispatch,
  } = useContext(HomeContext);

  const [isTyping, setIsTyping] = useState(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);

  const promptListRef = useRef<HTMLUListElement | null>(null);
  const filteredPrompts = prompts.filter((p) =>
    p.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const setActivePromptIndex = (idx: number) =>
    dispatch({ type: 'change', field: 'activePromptIndex', value: idx });
  const setVariables = (v: string[]) =>
    dispatch({ type: 'change', field: 'promptVariables', value: v });
  const setTextInputContent = (c: string) =>
    dispatch({ type: 'change', field: 'textInputContent', value: c });

  // ---------------------------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const max = selectedConversation?.model?.maxLength;
    if (max && value.length > max) {
      alert(
        t('Message limit is {{max}} characters. You have entered {{len}}.', {
          max,
          len: value.length,
        }),
      );
      return;
    }
    setTextInputContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming || !textInputContent.trim()) return;
    const userMsg: Message = { role: 'user', content: textInputContent.trim() };
    onSend(userMsg, plugin);
    setTextInputContent('');
    setPlugin(null);
    if (window.innerWidth < 640 && textareaRef?.current) textareaRef.current.blur();
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1_000);
  };

  const isMobile = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS/i.test(
      navigator.userAgent,
    );

  const handleInitModal = () => {
    const prompt = filteredPrompts[activePromptIndex];
    if (!prompt) return;
    const newContent = textInputContent.replace(/\/\w*$/, prompt.content);
    setTextInputContent(newContent);
    handlePromptSelect(prompt);
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex(Math.min(activePromptIndex + 1, filteredPrompts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex(Math.max(activePromptIndex - 1, 0));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const vars: string[] = [];
    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(content))) vars.push(match[1]);
    return vars;
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
    if (vars.length) {
      dispatch({ type: 'change', field: 'promptModalVisible', value: true });
    } else {
      const replaced = textInputContent.replace(/\/\w*$/, prompt.content);
      setTextInputContent(replaced);
      updatePromptListVisibility(replaced);
    }
  };

  const handleSubmit = (updated: string[]) => {
    const newContent = textInputContent.replace(/{{(.*?)}}/g, (_, v) => {
      const idx = promptVariables.indexOf(v);
      return updated[idx];
    });
    setTextInputContent(newContent);
    textareaRef?.current?.focus();
  };

  // UI Helpers ---------------------------------------------------------------
  useEffect(() => {
    if (promptListRef.current) promptListRef.current.scrollTop = activePromptIndex * 30;
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef?.current) {
      const t = textareaRef.current;
      t.style.height = 'inherit';
      t.style.height = `${t.scrollHeight}px`;
      t.style.overflow = t.scrollHeight > 160 ? 'auto' : 'hidden';
    }
  }, [textInputContent, textareaRef]);

  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (promptListRef.current && !promptListRef.current.contains(e.target as Node))
        setShowPromptList(false);
    };
    window.addEventListener('click', outside);
    return () => window.removeEventListener('click', outside);
  }, []);

  // ---------------------------------------------------------------------------
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
        {/* Stop / Regenerate row */}
        <div className="flex items-center justify-center gap-3 h-8">
          {messageIsStreaming && (
            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              onClick={handleStopConversation}
            >
              <IconPlayerStop size={16} className="mr-1.5" /> {t('Stop Generating')}
            </button>
          )}
          {!messageIsStreaming && selectedConversation?.messages.length ? (
            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              onClick={onRegenerate}
            >
              <IconRepeat size={16} className="mr-1.5" /> {t('Regenerate response')}
            </button>
          ) : null}
        </div>

        {/* Input row */}
        <div className="flex items-end space-x-3 relative">
          {/* Plugin button */}
          <button
            className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-teal-600 bg-white"
            onClick={() => setShowPluginSelect(!showPluginSelect)}
            title={plugin ? `Using ${plugin.name}` : 'Select Plugin'}
          >
            {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
          </button>

          {showPluginSelect && (
            <div className="absolute left-4 bottom-full mb-2 z-30 border border-gray-200 bg-white rounded-lg shadow-lg">
              <PluginSelect
                plugin={plugin}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowPluginSelect(false);
                    textareaRef?.current?.focus();
                  }
                }}
                onPluginChange={(p) => {
                  setPlugin(p);
                  setShowPluginSelect(false);
                  textareaRef?.current?.focus();
                }}
              />
            </div>
          )}

          {/* Textarea */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef as unknown as React.RefObject<HTMLTextAreaElement>}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 text-base text-gray-900 max-h-40 overflow-y-auto resize-none placeholder-gray-400"
              style={{ scrollbarWidth: 'thin' }}
              placeholder={t('Enter text transcription or type message…') ?? ''}
              value={textInputContent}
              rows={1}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
            {/* Send */}
            <button
              className={`absolute right-2 bottom-2 h-8 w-8 flex items-center justify-center rounded-lg text-white transition-colors
                ${messageIsStreaming || !textInputContent.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
              onClick={handleSend}
              disabled={messageIsStreaming || !textInputContent.trim()}
              title="Send"
            >
              <IconSend size={16} />
            </button>

            {/* Prompt list */}
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
                onClose={() => dispatch({ type: 'change', field: 'promptModalVisible', value: false })}
              />
            )}
          </div>

          {showScrollDownButton && (
            <button
              className="h-9 w-9 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 absolute bottom-20 right-6"
              onClick={onScrollDownClick}
              title="Scroll to bottom"
            >
              <IconArrowDown size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
