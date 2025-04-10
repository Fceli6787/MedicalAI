import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import '../css/chat-area.css';

const ChatArea = ({ messages, isAudioMode }) => {
  const chatAreaRef = useRef(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-area-container">
      <div 
        className={`chat-area ${isAudioMode ? 'hidden' : ''}`} 
        id="chatArea"
        ref={chatAreaRef}
      >
        {messages.map((message) => {
          return (
            <div 
              key={message.id}
              className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
              style={{
                order: messages.indexOf(message)
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          );
        })}
      </div>
      
      <div className={`audio-area ${isAudioMode ? '' : 'hidden'}`} id="audioArea">
        <div className="audio-sphere" id="audioSphere"></div>
        <div className="audio-status" id="audioStatus">Esperando...</div>
        <p style={{fontSize: '0.9em', color: 'var(--accent-color)', marginTop: '10px', textAlign: 'center'}}>
          <b>Consejos para mejor reconocimiento de voz:</b><br />
          Habla claro, a ritmo normal y en un ambiente silencioso.
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
