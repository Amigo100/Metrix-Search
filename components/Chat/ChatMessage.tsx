// components/Chat/ChatMessage.tsx
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconDownload,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { FC, memo, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';

import { Message } from '@/types/chat';
import HomeContext from '@/pages/api/home/home.context';

export interface Props {
  message: Message;
  messageIndex: number;
  onEdit?: (editedMessage: Message) => void;
}

/**
 * A single chat message. 
 * By default: user => white background, assistant => gray background.
 * Icons appear in top-right on hover.
 */
export const ChatMessage: FC<Props> = memo(({ message, messageIndex, onEdit }) => {
  const { t } = useTranslation('chat');
  const {
    state: { selectedConversation, conversations, messageIsStreaming },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>(message.content);
  const [copied, setCopied] = useState<boolean>(false);

  const isUserMessage = message.role === 'user';
  const containerClass = isUserMessage
    ? 'bg-white text-gray-800 dark:bg-[#343541] dark:text-gray-100'
    : 'bg-gray-50 text-gray-800 dark:bg-[#444654] dark:text-gray-100';

  // Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Edit
  const handleEdit = () => {
    if (onEdit && editValue.trim()) {
      onEdit({ ...message, content: editValue.trim() });
      setIsEditing(false);
    }
  };

  // Basic rendering
  return (
    <div
      className={`group relative border-b border-black/10 dark:border-gray-900/50 p-4 ${containerClass}`}
      style={{ overflowWrap: 'anywhere' }}
    >
      {/* Icon bar top-right */}
      <div className="absolute top-2 right-2 flex items-center gap-2 invisible group-hover:visible">
        {/* If copying or editing is needed */}
        {copied ? (
          <IconCheck className="text-green-500" size={18} />
        ) : (
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <IconCopy size={18} />
          </button>
        )}
        {!isEditing && onEdit && (
          <button
            onClick={() => {
              setIsEditing(true);
              setEditValue(message.content);
            }}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <IconEdit size={18} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col">
          <textarea
            className="w-full resize-none border rounded p-2"
            rows={5}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setEditValue(message.content);
                setIsEditing(false);
              }}
              className="px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
            >
              {t('Cancel')}
            </button>
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('Save')}
            </button>
          </div>
        </div>
      ) : (
        <div className="whitespace-pre-wrap text-sm">
          {message.content}
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export const MemoizedChatMessage = memo(ChatMessage);
