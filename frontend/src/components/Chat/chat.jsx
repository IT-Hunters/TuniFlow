import React from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";

import { FaPaperPlane, FaSmile, FaPaperclip, FaEllipsisH } from "react-icons/fa"; // Icônes modernes
import "./Chat.css";

const Chat = () => {
  return (
    <div className="chat-page">
      <CoolSidebar />
      <div className="chat-main">
        <Navbar />
        <div className="chat-container">
          <div className="chat-header">
            <h2>Chat</h2>
            <FaEllipsisH className="more-options" />
          </div>
          <div className="chat-messages">
            <div className="message received">
              <p>Bonjour Elyess, comment allez-vous ?</p>
              <span>10:30</span>
            </div>
            <div className="message sent">
              <p>Salut Admin, je vais bien, merci ! Et vous ?</p>
              <span>10:32</span>
            </div>
            <div className="message received">
              <p>Je suis bien aussi, merci de demander.</p>
              <span>10:33</span>
            </div>
          </div>
          <div className="chat-input">
            <FaPaperclip className="input-icon" />
            <input type="text" placeholder="Écrire un message..." />
            <FaSmile className="input-icon" />
            <button>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;