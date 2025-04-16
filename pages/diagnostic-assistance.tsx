// file: /pages/diagnostic-assistance.tsx (or similar path)

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios'; // Using axios as in previous examples
import ReactMarkdown from 'react-markdown'; // Use react-markdown component
import { useTranslation } from 'next-i18next'; // Assuming i18n setup
import { Send, Copy, RotateCcw, Edit, Trash2, Bot, User, Microscope, Stethoscope, Pill, Loader2 } from 'lucide-react'; // Using Lucide icons

// ---------- Types ----------
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Updated Disclaimer Text
const DISCLAIMER_TEXT = `Metrix AI enhances clinical decision-making with features like investigation plans, management guidance, and drug suggestions. It is not designed for analyzing medical images or signals and does not replace professional clinical judgment.`;

// --- Style Constants (Consistent with Theme) ---
const primaryButtonStyles = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
const secondaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed";
const ghostButtonStyles = "inline-flex items-center justify-center p-2 text-sm font-medium rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed";
const formInputStyles = "block w-full rounded-full border border-gray-300 py-2 px-4 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-base"; // Rounded-full for chat input

// Main component function
function DiagnosticAssistancePage() {
  const { t } = useTranslation('chat'); // Translation hook if needed

  // --- State Management (Logic Preserved) ---
  const [stage, setStage] = useState<number>(1);
  const [requestType, setRequestType] = useState<string>('');
  const [exampleQueries, setExampleQueries] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: "Hello! I'm your Metrix AI Assistant. How can I help you today? Select a category or type your query below." },
  ]);
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  // --- API Configuration (Logic Preserved) ---
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const API_ENDPOINT = `${API_BASE_URL}/rag/ask_rag`; // Ensure endpoint is correct

  // --- Event Handlers & Logic (Preserved) ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, messageIsStreaming]); // Scroll when messages update or streaming stops


  const handleSendUserMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || messageIsStreaming) return; // Prevent sending empty or while streaming

    const newHistory: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newHistory);
    setUserInput('');
    setStage(3); // Move to chat stage immediately
    processMessage(newHistory, trimmed);
  };

  async function processMessage(updatedHistory: Message[], newMessage: string) {
    // Add a temporary thinking indicator message
    const thinkingMsg: Message = { role: 'assistant', content: '...thinking...' };
    setMessages(prev => [...prev.filter(m => m.content !== '...thinking...'), thinkingMsg]); // Remove previous thinking msg if any
    setMessageIsStreaming(true);

    try {
      console.log('👉 Sending user message to server:', newMessage);
      // Exclude system messages and the thinking message from history sent to API
      const historyForApi = updatedHistory.filter(m => m.role !== 'system' && m.content !== '...thinking...');

      const resp = await axios.post(API_ENDPOINT, {
        message: newMessage,
        history: historyForApi, // Send filtered history
      });

      console.log('👉 Server response =>', resp.data);
      const finalAnswer = resp.data.response || 'Sorry, I could not process that request.';

      // Replace thinking message with actual response
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== '...thinking...'), // Remove thinking message
        { role: 'assistant', content: finalAnswer },
      ]);

    } catch (err: any) {
      console.error('Error in processMessage:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'An error occurred. Please try again later.';
      // Replace thinking message with error message
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== '...thinking...'),
        { role: 'system', content: `Error: ${errorMsg}` },
      ]);
    } finally {
      setMessageIsStreaming(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendUserMessage(userInput);
    }
  };

  const onRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg && !messageIsStreaming) {
        // Remove last assistant response before regenerating
        const historyWithoutLastAssistant = messages.filter((m, index) => index < messages.length -1 || m.role === 'user');
        setMessages(historyWithoutLastAssistant); // Update state before sending
        processMessage(historyWithoutLastAssistant, lastUserMsg.content);
    }
  };

  const handleEditLastUserInput = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last user message and last assistant message to allow editing
      const historyWithoutLastTwo = messages.filter((m, index) => index < messages.length - 2);
      setMessages(historyWithoutLastTwo);
      setUserInput(lastUserMsg.content);
      // Optionally focus the input field
      // document.getElementById('chat-input')?.focus();
    }
  };

  const handleClickExample = (example: string) => {
    setStage(3); // Go directly to chat stage
    setUserInput(example); // Pre-fill input
    // Optionally send immediately: handleSendUserMessage(example);
  };

  const handleClearChat = () => {
    setMessages([ { role: 'system', content: "Chat cleared. How can I help you?" } ]);
    setUserInput('');
    setStage(1); // Go back to initial stage
  };

  const handleCopy = (content: string) => {
     navigator.clipboard.writeText(content)
       .then(() => alert('Copied to clipboard!')) // Replace with toast notification ideally
       .catch(err => console.error('Failed to copy:', err));
  };

  // --- Rendering Functions for Stages ---

  // Brand Header (Used in Stage 1 & 2) - Updated Styling
  function renderBrandHeader() {
    const logoSizeClass = stage === 1 ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12'; // Smaller logo in stage 2
    return (
      <header className="flex flex-col items-center justify-center text-center mb-6">
        <img
            src="/MetrixAI.png" // Ensure path is correct
            alt="Metrix Logo"
            width={64} // Set explicit width/height
            height={64}
            className={`${logoSizeClass} mb-2 transition-all duration-300 ease-in-out`}
        />
         <h1 className={`font-bold text-gray-900 transition-all duration-300 ease-in-out ${stage === 1 ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
             Metrix AI Assistant
         </h1>
      </header>
    );
  }

  // Disclaimer - Updated Styling
  function renderDisclaimer(centered = false) {
    return (
      <div className={`mt-8 max-w-2xl mx-auto ${ centered ? 'text-center' : 'text-left' } text-xs text-gray-500 leading-relaxed`}>
        <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
      </div>
    );
  }

  // Stage 1: Home Screen - Updated Styling
  function renderHomeScreen() {
    const requestTypes = [
        { type: 'investigation', label: 'Investigation Plan', icon: Microscope, examples: [ 'Draft an investigation plan for a 70-year-old male with new onset cough and hemoptysis.', 'Investigation plan for a 45-year-old with suspected autoimmune disorder, presenting with joint pains and rash.', ] },
        { type: 'management', label: 'Management Guidance', icon: Stethoscope, examples: [ 'Provide management guidance for a patient with uncontrolled hypertension and CKD.', 'Management guidance for a 60-year-old with CHF exacerbation plus new AFib.', ] },
        { type: 'drug', label: 'Drug Regimen', icon: Pill, examples: [ 'Suggest a drug regimen for a new Type 2 diabetic with obesity & hyperlipidemia.', 'Suggest a drug regimen for a 55-year-old with migraines & poorly controlled HTN.', ] },
    ];

    return (
      <div className="flex flex-col items-center pt-12 pb-16 px-4 h-full overflow-y-auto">
        {renderBrandHeader()}
        <p className="text-lg text-gray-700 mt-2 mb-8 max-w-xl text-center">
           Select a request type or ask anything below.
        </p>

        {/* Updated Request Type Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl">
          {requestTypes.map(({ type, label, icon: Icon, examples }) => (
             <button
                key={type}
                onClick={() => { setRequestType(type); setExampleQueries(examples); setStage(2); }}
                className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl bg-white text-gray-700 font-medium hover:shadow-lg hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                <Icon className="w-8 h-8 mb-3 text-teal-600" />
                <span>{label}</span>
              </button>
          ))}
        </div>
        {renderDisclaimer(true)}
      </div>
    );
  }

  // Stage 2: Query Screen - Updated Styling
  function renderQueryScreen() {
    let heading = '';
    if (requestType === 'investigation') heading = 'Draft an investigation plan for a:';
    else if (requestType === 'management') heading = 'Provide management guidance for a:';
    else if (requestType === 'drug') heading = 'Suggest a drug regimen for a:';

    return (
      <div className="flex flex-col items-center pt-8 pb-12 px-4 h-full overflow-y-auto">
        {renderBrandHeader()}
        <div className="mt-6 w-full max-w-3xl text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Try an example:</h2>
          <p className="mb-5 text-gray-600">{heading}</p>
          {/* Updated Example Query Styling */}
          <div className="space-y-3">
            {exampleQueries.map((ex, idx) => (
              <button
                key={idx}
                className="w-full text-left p-3 border border-gray-200 rounded-lg cursor-pointer bg-white hover:bg-teal-50 hover:border-teal-200 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700"
                onClick={() => handleClickExample(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
           <button onClick={() => setStage(1)} className="mt-6 text-sm text-gray-500 hover:text-teal-600">&larr; Back to request types</button>
        </div>
        {renderDisclaimer(false)}
      </div>
    );
  }

  // Stage 3: Chat Screen - Updated Styling
  function renderChatScreen() {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-white via-teal-50 to-white"> {/* Light background for chat area */}
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-5"> {/* Add spacing between messages */}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isAssistant = msg.role === 'assistant';
              const isSystem = msg.role === 'system';
              const isThinking = isAssistant && msg.content === '...thinking...';
              const isLastAssistant = isAssistant && i === messages.length - 1 && !isThinking;

              // --- Thinking Indicator ---
              if (isThinking) {
                return (
                  <div key={i} className="flex items-start space-x-3 text-base">
                    <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 text-teal-700"> <Bot size={18} /> </span>
                    <div className="flex items-center space-x-1.5 pt-1.5">
                       <div className="h-2 w-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                       <div className="h-2 w-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                       <div className="h-2 w-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                );
              }

              // --- Message Bubble ---
              return (
                <div key={i} className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}> {/* Added group for copy button hover */}
                  {/* Sender Info */}
                   <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-1">
                     {isUser ? (
                       <><span>You</span><span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-gray-200 text-gray-600"><User size={12} /></span></>
                     ) : (
                       <><span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-teal-100 text-teal-700"><Bot size={12} /></span><span>Metrix AI</span></>
                     )}
                   </div>

                  {/* Bubble Content */}
                  <div className={`relative rounded-xl px-4 py-3 shadow-md max-w-[85%] sm:max-w-[75%] ${ isUser ? 'bg-teal-600 text-white rounded-br-none' : isSystem ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-bl-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none' }`}>
                    {/* Use react-markdown for assistant/system messages */}
                     {(isAssistant || isSystem) ? (
                        <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                            {msg.content}
                        </ReactMarkdown>
                     ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span> // Render user text directly
                     )}

                    {/* Copy Button for Assistant */}
                    {isAssistant && msg.content.trim() && (
                         <button
                            onClick={() => handleCopy(msg.content)}
                            className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition opacity-0 group-hover:opacity-100 focus:opacity-100" // Show on focus too
                            title="Copy text"
                            style={{ isolation: 'isolate' }} // Ensure button is clickable over bubble
                          >
                           <Copy size={12} />
                         </button>
                    )}
                  </div>

                   {/* Regenerate/Edit Buttons */}
                   {isLastAssistant && (
                     <div className="mt-2 flex space-x-2">
                       <button onClick={onRegenerate} className={ghostButtonStyles} title="Regenerate response"> <RotateCcw size={14} /> </button>
                       <button onClick={handleEditLastUserInput} className={ghostButtonStyles} title="Edit last input"> <Edit size={14} /> </button>
                     </div>
                   )}
                </div>
              );
            })}
            {/* Scroll target */}
            <div ref={chatEndRef} className="h-1" />
          </div>
        </div>
      </div>
    );
  }

  // --- Main Return: Renders current stage + bottom input bar ---
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white via-teal-50 to-white"> {/* Use consistent light background */}
      {/* Content area above the input */}
      <div className="flex-1 overflow-y-auto">
        {stage === 1 && renderHomeScreen()}
        {stage === 2 && renderQueryScreen()}
        {stage === 3 && renderChatScreen()}
      </div>

      {/* Bottom Input Bar - Updated Styling */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-sm">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
          {/* Clear Chat Button (only visible in stage 3) */}
          {stage === 3 && (
             <button onClick={handleClearChat} className={ghostButtonStyles} title="Clear Chat" > <Trash2 size={18} /> </button>
          )}

          {/* Input Field */}
          <div className="relative flex-1">
            <input
              id="chat-input" // Added ID for potential focus targeting
              type="text"
              className={formInputStyles} // Use consistent input style
              placeholder="Ask Metrix anything or type your query..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={messageIsStreaming}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendUserMessage(userInput)}
            disabled={messageIsStreaming || !userInput.trim()}
            className={`${primaryButtonStyles} px-4 py-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0`} // Adjusted style, made round
            title="Send message"
          >
            {messageIsStreaming ? (
              <Loader2 size={18} className="animate-spin"/>
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add the default export line
export default DiagnosticAssistancePage;

