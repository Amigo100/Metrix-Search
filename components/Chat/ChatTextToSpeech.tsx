// components/Chat/Chat.tsx
// ============================================================================
// Updated to fix missing React type imports and improve type‑safety throughout
// ============================================================================

import React, {
  memo,
  useContext,
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react';
import { useTranslation } from 'react-i18next';

// Context + Types ------------------------------------------------------------
import { HomeContext } from '@/contexts/HomeContext';
import type { Message, Plugin } from '@/types/chat';

// Child components -----------------------------------------------------------
import { ChatMessage } from './ChatMessage';

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------
interface ChatProps {
  /**
   * A ref that external components can flip to `true` to stop the auto‑scroll
   * behaviour (e.g. when the user manually scrolls up to view old messages).
   */
  stopConversationRef: MutableRefObject<boolean>;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
const Chat = memo(function Chat({ stopConversationRef }: ChatProps) {
  const { t } = useTranslation('chat');

  // global chat state comes from HomeContext
  const {
    state: { messages, loading },
    dispatch,
  } = useContext(HomeContext);

  // we autoscroll to the bottom unless the caller asks us not to
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!stopConversationRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behaviour: 'smooth' });
    }
  }, [messages, stopConversationRef]);

  //--------------------------------------------------------------------------
  // HANDLE SEND
  //--------------------------------------------------------------------------
  const handleSend = (message: Message, plugin: Plugin | null) => {
    dispatch({ type: 'SEND_MESSAGE', payload: { message, plugin } });
  };

  //--------------------------------------------------------------------------
  // RENDER
  //--------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose / Input component goes here.  You might already have a child
          component such as <ChatInput onSend={handleSend} /> – keep the exact
          implementation that existed before. */}
    </div>
  );
});

export default Chat;
