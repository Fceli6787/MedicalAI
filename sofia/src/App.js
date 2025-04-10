import { useState, useEffect } from 'react';
import { getChatMessages, archiveChat, sendToOpenRouter } from './services/api';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import Login from './pages/Login';
import Register from './pages/Register';

function AppContent() {
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENROUTER_API_KEY);

  const { currentUser } = useAuth();
  
  const archiveCurrentChat = async () => {
    if (isArchiving || messages.length === 0 || !currentUser) return;
    
    try {
      setIsArchiving(true);
      await archiveChat(currentUser.uid, messages);
    } catch (error) {
      console.error('Error archiving chat:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleSendMessage = async (message) => {
    const newMessage = {
      ...message,
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const { success, response, error } = await sendToOpenRouter(
        newMessage, 
        message.files || [], 
        messages.filter(m => m.type === 'user' || m.type === 'bot')
      );
      
      if (!success) {
        throw new Error(error || 'Error al obtener respuesta');
      }

      // Verificar si la respuesta ya fue agregada (evitar duplicados)
      const botMessageId = Date.now().toString() + 'bot';
      if (!messages.some(m => m.id === botMessageId)) {
        const botMessage = {
          type: 'bot',
          content: response,
          id: botMessageId
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message to OpenRouter:', error);
      const errorMessage = error.message.includes('rate limit') 
        ? 'Límite diario alcanzado. Intenta mañana.'
        : 'Error al procesar. Intenta nuevamente.';
      
      const botErrorMessage = {
        type: 'bot',
        content: errorMessage,
        id: Date.now().toString() + 'error',
        isError: true
      };
      setMessages(prev => [...prev, botErrorMessage]);
    }
  };

  // Componente MainApp para la aplicación principal
  const MainApp = () => (
    <div className="app-container">
      <Header 
        title="SOF-IA Medical" 
        isAudioMode={isAudioMode}
        onToggleMode={() => setIsAudioMode(!isAudioMode)}
      />
      <div className="main-content">
        <Sidebar 
          onNewChat={() => setMessages([])}
          onSelectChat={async (chatId) => {
            try {
              const response = await getChatMessages(chatId);
              if (response.success) {
                setMessages(response.messages.map(msg => ({
                  type: msg.role === 'user' ? 'user' : 'bot',
                  content: msg.content
                })));
              }
            } catch (error) {
              console.error('Error loading chat:', error);
            }
          }}
        />
        <div className="chat-section">
          <div className='chat-area-container'>
            <ChatArea 
              messages={messages} 
              isAudioMode={isAudioMode}
            />
          </div>
          <InputArea 
            isAudioMode={isAudioMode}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <MainApp />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
