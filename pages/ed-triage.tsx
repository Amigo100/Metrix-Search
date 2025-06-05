import { useState } from 'react';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ScrollArea from '@/components/ui/scroll-area';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

export default function EDTriagePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    const aiMessage: Message = {
      sender: 'assistant',
      text: 'AI processing placeholder. Clinical suggestions will appear here.',
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-1 divide-x divide-gray-200">
        {/* Sidebar with conversation */}
        <div className="w-full max-w-md bg-teal-50 flex flex-col border-r border-teal-200">
          <ScrollArea className="flex-1 p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  'max-w-xs px-4 py-2 rounded-xl shadow-sm text-sm ' +
                  (m.sender === 'user'
                    ? 'bg-teal-600 text-white ml-auto'
                    : 'bg-white border border-gray-200')
                }
              >
                {m.text}
              </div>
            ))}
          </ScrollArea>
          <div className="border-t border-teal-200 p-4 bg-teal-50">
            <div className="flex items-center space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter clinical information..."
                className="flex-1"
              />
              <Button onClick={handleSend}>Send</Button>
            </div>
          </div>
        </div>

        {/* Canvas for larger outputs */}
        <div className="flex-1 p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4 text-teal-700">
            Clinical Output Canvas
          </h2>
          <div className="h-full border border-dashed border-teal-300 rounded-md p-4 text-gray-500">
            Larger outputs such as clinical recommendations, referral forms and
            scoring tools will be displayed here for review and editing.
          </div>
        </div>
      </div>
    </div>
  );
}
