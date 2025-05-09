import React, { useState, useRef, useEffect } from "react";
import "./chatbot.css";
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am your fiscal assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true); // Show loading

    try {
      const response = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply || "Sorry, I didn't understand that." }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to assistant." }
      ]);
    } finally {
      setIsLoading(false); // Hide loading
    }
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="chatbot-container">
          <div className="chatbot-header">Fiscal Assistant</div>
          <div className="chatbot-messages" role="log" aria-live="polite">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chatbot-message ${msg.sender}`}
                role="article"
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message bot loading" role="status">
                <span className="loading-dots">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chatbot-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="chatbot-input"
              aria-label="Chat input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={isLoading}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;