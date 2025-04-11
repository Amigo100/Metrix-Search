// /pages/diagnostic-assistance.tsx

import React, { useState } from 'react';
import { marked } from 'marked';

// ---------- Types ----------
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const DISCLAIMER_TEXT = `
Our Metrix AI clinical platform enhances clinicians' decision-making processes.
It generates preliminary investigation plans, management guidance, drug regimen suggestions,
and answers to clinical reference questions. The features are not designed for and should not
be used for analyzing medical images, signals from in vitro devices, or any advanced signal
acquisition systems.
`;

function DiagnosticAssistancePage() {
  const [stage, setStage] = useState<number>(1);
  const [requestType, setRequestType] = useState<string>('');
  const [exampleQueries, setExampleQueries] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: "Hello! I'm your Metrix AI assistant. Ask questions below.",
    },
  ]);
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false);

  // -----------------------------------------
  // Use environment variable for API base URL (fallback to localhost)
  // -----------------------------------------
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // Endpoints
  const API_ENDPOINT = `${API_BASE_URL}/rag/ask_rag`; // e.g. https://fastapiplatformclean-8.onrender.com/rag/ask_rag

  // -----------------------------------------
  // Send user message
  // -----------------------------------------
  function handleSendUserMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newHistory = [
      ...messages,
      { role: 'user' as const, content: trimmed },
    ];
    setMessages(newHistory);
    setUserInput('');

    processMessage(newHistory, trimmed);
  }

  async function processMessage(updatedHistory: Message[], newMessage: string) {
    const thinkingMsg: Message = {
      role: 'assistant',
      content: '...thinking...',
    };
    const historyWithThinking = [...updatedHistory, thinkingMsg];
    setMessages(historyWithThinking);
    setMessageIsStreaming(true);

    try {
      console.log('👉 Sending user message to server:', newMessage);
      const resp = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          history: historyWithThinking,
        }),
      });
      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      console.log('👉 Server response =>', data);

      const finalAnswer = data.response || 'No response from server.';
      setMessages((prev) =>
        prev
          .filter((m) => m.content !== '...thinking...')
          .concat({ role: 'assistant', content: finalAnswer } as const),
      );
      setMessageIsStreaming(false);
      setStage(3);
    } catch (err) {
      console.error('Error in processMessage:', err);
      setMessages((prev) =>
        prev
          .filter((m) => m.content !== '...thinking...')
          .concat({
            role: 'system',
            content: 'An error occurred. Please try again later.',
          } as const),
      );
      setMessageIsStreaming(false);
      setStage(3);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendUserMessage(userInput);
    }
  }

  function onRegenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleSendUserMessage(lastUser.content);
    }
  }

  function handleEditLastUserInput() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      setUserInput(lastUser.content);
    }
  }

  function handleClickExample(example: string) {
    setStage(3);
    handleSendUserMessage(example);
  }

  function handleClearChat() {
    setMessages([
      {
        role: 'system',
        content: "Hello! I'm your Metrix AI assistant. Ask questions below.",
      },
    ]);
    setUserInput('');
    setStage(1);
  }

  function renderMessageBubble(msg: Message, index: number) {
    const isUser = msg.role === 'user';
    const isAssistant = msg.role === 'assistant';

    if (isAssistant && msg.content === '...thinking...') {
      return (
        <div key={index} className="mb-4 flex items-start space-x-2">
          <div className="font-bold text-pink-600">Metrix AI:</div>
          <div className="flex space-x-1">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </div>
        </div>
      );
    }

    let bubbleContent: JSX.Element | string;
    if (isAssistant || msg.role === 'system') {
      const rendered = marked.parse(msg.content || '', { async: false });
      bubbleContent = (
        <div
          className="prose prose-sm"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      );
    } else {
      bubbleContent = <>{msg.content}</>;
    }

    const isLastAssistant =
      isAssistant &&
      index === messages.length - 1 &&
      msg.content !== '...thinking...';

    return (
      <div
        key={index}
        className={`mb-4 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div className="flex items-center space-x-2">
          <div className="font-bold">{isUser ? 'You' : 'Metrix AI'}</div>
          {isAssistant && msg.content.trim() && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(msg.content);
                alert('Output copied to clipboard!');
              }}
              className="px-2 py-1 bg-gray-300 text-black text-xs rounded-full hover:bg-gray-400"
            >
              Copy
            </button>
          )}
        </div>

        <div
          className={`rounded-2xl p-3 mt-1 text-sm ${
            isUser ? 'bg-blue-100' : 'bg-gray-100'
          } text-black max-w-[90%]`}
          style={{ whiteSpace: 'normal' }}
        >
          {bubbleContent}
        </div>

        {isLastAssistant && (
          <div className="mt-2 flex space-x-2 text-xs">
            <button
              onClick={onRegenerate}
              className="px-3 py-1 bg-gray-300 text-black rounded-full hover:bg-gray-400"
            >
              Regenerate
            </button>
            <button
              onClick={handleEditLastUserInput}
              className="px-3 py-1 bg-gray-300 text-black rounded-full hover:bg-gray-400"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  function handlePlayTTS(text: string) {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support speech synthesis.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  function renderBrandHeader() {
    return (
      <header className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center">
          <img
            src="/MetrixAI.png"
            alt="Metrix AI Logo"
            className="w-40 h-40 object-cover mr-3"
          />
          <div className="uppercase font-semibold tracking-wide text-lg text-black"></div>
        </div>
        <div className="mt-1 text-base text-black font-normal"></div>
      </header>
    );
  }

  function renderDisclaimer() {
    return (
      <div className="mt-6 mb-4 max-w-2xl text-left text-sm text-gray-600 leading-5">
        {DISCLAIMER_TEXT}
      </div>
    );
  }

  function renderHomeScreen() {
    return (
      <div className="flex flex-col items-center pt-16 pb-24 px-4">
        {renderBrandHeader()}
        <div className="mt-8 text-center max-w-3xl">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Metrix AI Clinical Assistant
          </h1>
          <p className="text-lg text-gray-700">
            Select a request type below to get started.
          </p>
        </div>

        <div className="flex space-x-6 mt-8">
          <button
            onClick={() => {
              setRequestType('investigation');
              setExampleQueries([
                'Draft an investigation plan for a 70-year-old male with new onset cough and hemoptysis.',
                'Draft an investigation plan for a 45-year-old with suspected autoimmune disorder, presenting with joint pains and rash.',
              ]);
              setStage(2);
            }}
            className="border border-gray-300 rounded-full px-5 py-3 bg-white text-black font-medium hover:shadow-md hover:bg-gray-50"
          >
            <span className="mr-2">🔬</span> Investigation Plan
          </button>

          <button
            onClick={() => {
              setRequestType('management');
              setExampleQueries([
                'Provide management guidance for a patient with uncontrolled hypertension and CKD.',
                'Provide management guidance for a 60-year-old with CHF exacerbation plus new AFib.',
              ]);
              setStage(2);
            }}
            className="border border-gray-300 rounded-full px-5 py-3 bg-white text-black font-medium hover:shadow-md hover:bg-gray-50"
          >
            <span className="mr-2">🩺</span> Management Guidance
          </button>

          <button
            onClick={() => {
              setRequestType('drug');
              setExampleQueries([
                'Suggest a drug regimen for a new Type 2 diabetic with obesity & hyperlipidemia.',
                'Suggest a drug regimen for a 55-year-old with migraines & poorly controlled HTN.',
              ]);
              setStage(2);
            }}
            className="border border-gray-300 rounded-full px-5 py-3 bg-white text-black font-medium hover:shadow-md hover:bg-gray-50"
          >
            <span className="mr-2">💊</span> Drug Regimen
          </button>
        </div>

        {renderDisclaimer()}
      </div>
    );
  }

  function renderQueryScreen() {
    let heading = '';
    if (requestType === 'investigation') {
      heading = 'Draft an investigation plan for a:';
    } else if (requestType === 'management') {
      heading = 'Provide management guidance for a:';
    } else if (requestType === 'drug') {
      heading = 'Suggest a drug regimen for a:';
    }

    return (
      <div className="flex flex-col items-center pt-16 pb-24 px-4">
        {renderBrandHeader()}

        <div className="mt-8 w-full max-w-3xl text-center">
          <h2 className="text-xl font-semibold mb-3">Try an example:</h2>
          <p className="mb-6 text-gray-600">{heading}</p>
          <div className="space-y-2">
            {exampleQueries.map((ex, idx) => (
              <div
                key={idx}
                className="p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => handleClickExample(ex)}
              >
                {ex}
              </div>
            ))}
          </div>
        </div>

        {renderDisclaimer()}
      </div>
    );
  }

  function renderChatScreen() {
    return (
      <div className="flex flex-col min-h-full pt-16 pb-24 px-4">
        <div className="w-full mx-auto">
          <h2 className="text-2xl font-bold mb-4">Metrix AI Chat</h2>
          <div className="w-full min-h-[50vh] max-h-[70vh] overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded">
            {messages.map((msg, i) => renderMessageBubble(msg, i))}
          </div>
          <div className="mt-4 flex space-x-3 justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(messages, null, 2));
                alert('Conversation copied successfully!');
              }}
              className="px-4 py-2 bg-gray-300 text-black rounded-full hover:bg-gray-400"
            >
              Copy Conversation
            </button>
            <button
              onClick={handleClearChat}
              className="px-4 py-2 bg-red-300 text-black rounded-full hover:bg-red-400"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 overflow-y-auto">
        {stage === 1 && renderHomeScreen()}
        {stage === 2 && renderQueryScreen()}
        {stage === 3 && renderChatScreen()}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="w-full max-w-4xl mx-auto flex items-center space-x-3">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none text-lg"
            placeholder="Type your message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={messageIsStreaming}
          />
          <button
            onClick={() => handleSendUserMessage(userInput)}
            disabled={messageIsStreaming}
            className={`px-4 py-2 rounded-full text-white font-medium transition-colors ${
              messageIsStreaming
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {messageIsStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dot {
          height: 8px;
          width: 8px;
          margin-right: 5px;
          background-color: #0d6efd;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.5s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.3s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.6s;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
        }
        .prose p {
          margin: 0.5em 0;
        }
        .prose ul {
          margin-left: 1.5em;
          list-style-type: disc;
        }
        .prose ol {
          margin-left: 1.5em;
          list-style-type: decimal;
        }
        .prose code {
          background-color: #f4f4f4;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default DiagnosticAssistancePage;
