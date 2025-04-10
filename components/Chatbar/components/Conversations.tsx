import { Conversation } from '@/types/chat';
import { ConversationComponent } from './Conversation';

interface Props {
  conversations: Conversation[];
}

/**
 * Renders a list of conversations (those not assigned to a folder),
 * in reverse order (most recent first).
 */
export const Conversations = ({ conversations }: Props) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {conversations
        .filter((c) => !c.folderId)
        .slice()
        .reverse()
        .map((conversation, index) => (
          <ConversationComponent key={index} conversation={conversation} />
        ))}
    </div>
  );
};