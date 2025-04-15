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
      content: "Hello! I'm your Metrix AI Assistant. Ask questions below.",
    },
  ]);
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false);

  // -----------------------------------------
  // Use environment variable for API base URL (fallback to localhost)
  // -----------------------------------------
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // Endpoints
  const API_ENDPOINT = `${API_BASE_URL}/rag/ask_rag`;

  // -----------------------------------------
  // Send user message
  // -----------------------------------------
  function handleSendUserMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newHistory = [...messages, { role: 'user' as const, content: trimmed }];
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

  // -----------------------------------------
  // Rendering message bubbles
  // -----------------------------------------
  function renderMessageBubble(msg: Message, index: number) {
    const isUser = msg.role === 'user';
    const isAssistant = msg.role === 'assistant';

    if (isAssistant && msg.content === '...thinking...') {
      return (
        <div key={index} className="mb-4 flex items-start space-x-2 text-base">
          <div className="font-bold text-pink-600 flex items-center space-x-1">
            <span>🤖</span> {/* Metrix AI icon */}
            <span>Metrix AI:</span>
          </div>
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
          className="prose prose-base"
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
        className={`mb-4 flex flex-col ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender info with icon + name */}
        <div className="flex items-center space-x-2 text-base font-bold">
          {isUser ? (
            <>
              <span>👤</span>
              <span>You</span>
            </>
          ) : (
            <>
              <span>🤖</span>
              <span>Metrix AI</span>
            </>
          )}
          {/* Copy button if there's content */}
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

        {/* Chat bubble */}
        <div
          className={`rounded-2xl p-3 mt-1 text-base bg-white text-black max-w-[90%]`}
          style={{ whiteSpace: 'normal' }}
        >
          {bubbleContent}
        </div>

        {/* Regenerate/Edit on last assistant */}
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

  // This brand header is used for Stage 1 & 2
  function renderBrandHeader() {
    // 30% smaller means from w-40/h-40 to w-28/h-28
    const logoSize = stage === 1 ? 'w-28 h-28' : 'w-40 h-40';

    return (
      <header className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center">
          <img
            src="/MetrixAI.png"
            alt="Metrix AI Logo"
            className={`${logoSize} object-cover mr-3`}
          />
          <div className="uppercase font-semibold tracking-wide text-lg text-black" />
        </div>
        <div className="mt-1 text-base text-black font-normal" />
      </header>
    );
  }

  // Disclaimer text
  function renderDisclaimer(centered = false) {
    return (
      <div
        className={`mt-6 mb-4 max-w-2xl ${
          centered ? 'text-center' : 'text-left'
        } text-sm text-gray-600 leading-5`}
      >
        {DISCLAIMER_TEXT}
      </div>
    );
  }

  // Stage 1: Home
  function renderHomeScreen() {
    return (
      <div className="flex flex-col items-center pt-16 pb-24 px-4">
        {renderBrandHeader()}
        <div className="mt-8 text-center max-w-3xl">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Metrix AI Clinical Assistant
          </h1>
          <p className="text-lg text-gray-700">
            Select a request type below to get started,
            or simply type a question in the box below.
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

        {/* Centered disclaimer on Stage 1 */}
        {renderDisclaimer(true)}
      </div>
    );
  }

  // Stage 2: Query
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

        {/* Left-aligned disclaimer on Stage 2 */}
        {renderDisclaimer(false)}
      </div>
    );
  }

  // Stage 3: Chat
  function renderChatScreen() {
    return (
      <div className="flex flex-col h-full">
        {/* Sticky top header, heading centered */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-center py-3">
            <img
              src="/MetrixAI.png"
              alt="Metrix AI Logo"
              className="w-8 h-8 object-cover mr-2"
            />
            <h2 className="text-2xl font-bold">Metrix AI Chat</h2>
          </div>
        </div>

        {/* Scrollable conversation window with 10% margin => 80% width */}
        <div className="flex-1 overflow-y-auto bg-gray-50 flex justify-center">
          <div className="w-[80%] max-w-4xl py-4 px-2">
            {messages.map((msg, i) => renderMessageBubble(msg, i))}
          </div>
        </div>
      </div>
    );
  }

  // Main return: pinned bottom bar with text input & conditionally displayed buttons
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Content area above the input */}
      <div className="flex-1">
        {stage === 1 && renderHomeScreen()}
        {stage === 2 && renderQueryScreen()}
        {stage === 3 && <div className="h-full">{renderChatScreen()}</div>}
      </div>

      {/* 
        Bottom bar: includes 
        1) text input + send (left side)
        2) Copy & Clear chat (right side) => only for stage 3
      */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          {/* Left side => input + send button */}
          <div className="flex items-center space-x-3 flex-1">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none text-base"
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
                  ? 'bg-[#008080] cursor-not-allowed'
                  : 'bg-[#008080] hover:bg-[#008080]'
              }`}
            >
              {messageIsStreaming ? 'Sending...' : 'Send'}
            </button>
          </div>

          {/* Right side => copy + clear buttons => only for stage 3 */}
          {stage === 3 && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(messages, null, 2),
                  );
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
          )}
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
        .prose {
          font-size: 1rem; /* ~text-base */
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
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}

export default DiagnosticAssistancePage;
