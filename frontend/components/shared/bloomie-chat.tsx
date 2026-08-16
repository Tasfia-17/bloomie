"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic } from "lucide-react";
import { api } from "@/lib/api";
import { getBloomieUser } from "@/lib/auth";

type Message = {
  id: string;
  role: "user" | "bloomie";
  content: string;
};

export function BloomieChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "bloomie", content: "Hey there! 🌸 I'm Bloomie. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = getBloomieUser();

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.chat(text, user?.name || "friend");
      const bloomieMsg: Message = { id: (Date.now() + 1).toString(), role: "bloomie", content: res.reply };
      setMessages((prev) => [...prev, bloomieMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bloomie", content: "I'm having a little trouble right now. Try again in a moment? 🌱" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, user?.name]);

  const handleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    const recognition = new (SpeechRecognition as new () => { lang: string; onresult: (e: { results: { transcript: string }[][] }) => void; onend: () => void; start: () => void })();
    recognition.lang = "en-US";
    setIsListening(true);

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      sendMessage(text);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [sendMessage]);

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-bloom-sage to-bloom-forest shadow-bloom-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform ${isOpen ? "hidden" : ""}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle size={22} />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-4 z-40 w-[340px] max-h-[480px] glass-strong rounded-3xl shadow-bloom-lg flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-bloom-sage/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌸</span>
                <div>
                  <p className="text-sm font-bold text-bloom-deep">Bloomie</p>
                  <p className="text-[10px] text-bloom-deep/50">Your wellness companion</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-bloom-sage/10 transition-colors">
                <X size={16} className="text-bloom-deep/50" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[320px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-bloom-forest text-white rounded-br-md"
                        : "bg-bloom-sage/15 text-bloom-deep rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-bloom-sage/15 px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <motion.div className="flex gap-1" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-bloom-sage" />
                      <span className="w-1.5 h-1.5 rounded-full bg-bloom-sage" />
                      <span className="w-1.5 h-1.5 rounded-full bg-bloom-sage" />
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-bloom-sage/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVoice}
                  className={`p-2 rounded-full transition-colors ${isListening ? "bg-bloom-rose/20 text-bloom-rose" : "hover:bg-bloom-sage/10 text-bloom-deep/40"}`}
                >
                  <Mic size={18} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Talk to Bloomie..."
                  className="flex-1 bg-bloom-sage/5 rounded-full px-4 py-2 text-sm outline-none border border-bloom-sage/10 focus:border-bloom-sage/30 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-full bg-bloom-forest text-white disabled:opacity-40 hover:bg-bloom-deep transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
