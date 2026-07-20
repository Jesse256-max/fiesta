import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, RefreshCw, HelpCircle, Clock, Trash2, Cpu, ExternalLink } from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { ChatMessage } from "../types.ts";
import { motion, AnimatePresence } from "motion/react";

interface SavedQuery {
  id: string;
  query: string;
  answer: string;
  timestamp: string;
}

const SUGGESTIONS = [
  "What is the dress code for the Welcome Party?",
  "Where is Prof. Alan Turing's office?",
  "Show my registration steps",
  "Tell me about student clubs"
];

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [groundingMode, setGroundingMode] = useState<"none" | "search" | "maps">("none");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem("technotrons_chat_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am your Technotrons College of Engineering AI Guide. Ask me anything about campus events, student clubs, timetables, academic faculty, or registration steps!",
        timestamp: new Date()
      }
    ];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { token, dbUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recent queries history state
  const [recentQueries, setRecentQueries] = useState<SavedQuery[]>(() => {
    const saved = localStorage.getItem("technotrons_saved_queries");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    sessionStorage.setItem("technotrons_chat_messages", JSON.stringify(messages));
  }, [messages]);

  const saveQuery = (query: string, answer: string) => {
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q.query.toLowerCase() !== query.toLowerCase());
      const updated = [
        {
          id: Date.now().toString(),
          query: query.trim(),
          answer: answer.trim(),
          timestamp: new Date().toISOString()
        },
        ...filtered
      ].slice(0, 10); // Limit to last 10 queries
      localStorage.setItem("technotrons_saved_queries", JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentQueries = () => {
    setRecentQueries([]);
    localStorage.removeItem("technotrons_saved_queries");
  };

  const handleRevisit = (saved: SavedQuery) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: saved.query,
      timestamp: new Date()
    };
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: saved.answer,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const clearChatHistory = () => {
    const welcomeMsg: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: "Chat cleared! What else can I assist you with today?",
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
    sessionStorage.removeItem("technotrons_chat_messages");
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleAskBot = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === "string") {
        setIsOpen(true);
        handleSend(customEvent.detail);
      }
    };
    window.addEventListener("ask-campus-bot", handleAskBot);
    return () => {
      window.removeEventListener("ask-campus-bot", handleAskBot);
    };
  }, [token, messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          })),
          thinking: thinkingMode,
          grounding: groundingMode === "none" ? undefined : groundingMode
        })
      });

      if (!response.ok) {
        throw new Error("Chat error");
      }

      const data = await response.json();
      const botReply = data.reply;
      const groundingMetadata = data.groundingMetadata;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botReply,
        timestamp: new Date(),
        groundingMetadata
      }]);

      // Save user query + response to history
      saveQuery(textToSend, botReply);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting to the campus mainframe. Please try again in a moment!",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group border border-indigo-500/25"
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 rounded-full animate-bounce">
                AI
              </span>
            </div>
          )}
        </AnimatePresence>
      </button>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-panel"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-full max-w-md h-[550px] bg-white dark:bg-zinc-900 rounded-3xl shadow-3xl border border-zinc-200 dark:border-zinc-700 flex flex-col z-50 overflow-hidden transition-all duration-300"
          >
            {/* Header */}
            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-1.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-wide">Campus AI Guide</h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">POWERED BY GEMINI</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 1 && (
                  <button
                    onClick={clearChatHistory}
                    className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Clear Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950 transition-colors duration-300">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" 
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-white border border-zinc-300 dark:border-zinc-700" 
                        : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                    }`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/10"
                        : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs rounded-tl-none"
                    }`}>
                      <div className="whitespace-pre-line">{msg.content}</div>

                      {/* Display Grounding Sources & Maps links */}
                      {msg.groundingMetadata?.groundingChunks && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-700/50 space-y-1.5">
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Grounded Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {msg.groundingMetadata.groundingChunks.map((chunk: any, cidx: number) => {
                              const title = chunk.web?.title || chunk.maps?.title || "Google Reference";
                              const uri = chunk.web?.uri || chunk.maps?.uri;
                              if (!uri) return null;
                              return (
                                <a
                                  key={cidx}
                                  href={uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-800 transition-colors"
                                >
                                  <span>{title}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <span className="block text-[9px] text-right mt-1 opacity-60 font-mono">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-2xl rounded-tl-none">
                      <div className="flex gap-1.5 items-center justify-center py-1 px-2">
                        <span className="w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions, History & Input Tray */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-3 transition-colors duration-300">
              
              {/* Dual Mode Thinking and Grounding Selection */}
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-2 text-[11px]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setThinkingMode(!thinkingMode);
                      if (!thinkingMode) {
                        setGroundingMode("none"); // Mutually exclusive for better stability
                      }
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border transition-all cursor-pointer ${
                      thinkingMode
                        ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300"
                        : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                    }`}
                    title="Enable Deep Thinking Mode using Gemini 3.1 Pro"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>Thinking</span>
                  </button>

                  <div className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />

                  <span className="text-[10px] text-zinc-400 font-mono uppercase">Grounding:</span>
                  <div className="flex gap-1">
                    {(["none", "search", "maps"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setGroundingMode(m);
                          if (m !== "none") {
                            setThinkingMode(false); // Mutually exclusive for better stability
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md font-medium border transition-all text-[10px] cursor-pointer ${
                          groundingMode === m
                            ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300"
                            : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {m === "none" ? "Off" : m === "search" ? "Search" : "Maps"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Queries (persist past answers) */}
              {recentQueries.length > 0 && (
                <div className="space-y-1.5 border-b border-zinc-200 dark:border-zinc-800/60 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                      Recent Queries
                    </p>
                    <button
                      onClick={clearRecentQueries}
                      className="text-[9px] text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                      title="Clear History"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Clear
                    </button>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                    {recentQueries.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleRevisit(q)}
                        className="text-[11px] bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/80 px-2.5 py-1 rounded-lg hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                        <span className="max-w-[130px] truncate">{q.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 1 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    Suggested Questions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-xs bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all text-left cursor-pointer active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={token ? "Ask Gemini anything about campus..." : "Sign in to chat personally..."}
                  className="flex-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans placeholder-zinc-400 dark:placeholder-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
