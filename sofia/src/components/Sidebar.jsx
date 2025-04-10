import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getArchivedChats } from '../services/api';
import { auth } from '../config/firebase';
import Swal from 'sweetalert2';
import '../css/sidebar.css';

const Sidebar = ({ onNewChat, onSelectChat }) => {
  const { currentUser } = useAuth();
  const [archivedChats, setArchivedChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      const loadChats = async () => {
        try {
          const chats = await getArchivedChats(currentUser.uid);
          setArchivedChats(chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            date: chat.createdAt?.toDate()?.toLocaleDateString() || 'Fecha no disponible'
          })));
        } catch (error) {
          console.error('Error loading chats:', error);
        } finally {
          setLoading(false);
        }
      };

      loadChats();
    }
  }, [currentUser]);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img
          src="/img/Logo SOFIA Oscuro.png"
          alt="Logo SOFIA"
          className="sidebar-logo-img"
          onError={(e) => {
            if (e.target.src.includes('Oscuro')) {
              e.target.src = '/img/Logo SOFIA.png';
            }
          }}
        />
        <img
          src="/img/Logo SOFIA Oscuro.png"
          alt="Logo SOFIA Oscuro"
          className="sidebar-logo-img-dark"
          style={{display: 'none'}}
          onError={(e) => {
            if (e.target.src.includes('Oscuro')) {
              e.target.src = '/img/Logo SOFIA.png';
            }
          }}
        />
      </div>
      <div className="user-profile">
        <div className="user-info">
          <div className="user-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
        <div className="user-options">
          <button 
            className="config-button" 
            title="Configuración"
            onClick={() => {
              Swal.fire({
                title: 'Configuración',
                html: `
                  <div class="mode-toggle">
                    <label>Modo Oscuro</label>
                    <input type="checkbox" id="darkModeToggle" ${localStorage.getItem('darkMode') === 'true' ? 'checked' : ''}>
                  </div>
                `,
                showConfirmButton: true,
                focusConfirm: false,
                preConfirm: () => {
                  const darkMode = document.getElementById('darkModeToggle').checked;
                  localStorage.setItem('darkMode', darkMode);
                  document.documentElement.classList.toggle('dark', darkMode);
                }
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1h.09a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button className="logout-button" title="Cerrar Sesión" onClick={() => {
            Swal.fire({
              title: '¿Cerrar sesión?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Sí, cerrar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                localStorage.removeItem('darkMode'); 
                if (currentUser?.provider === 'firebase') {
                  auth.signOut();
                } else {
                  // Lógica para logout local
                }
                window.location.href = '/login';
              }
            });
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="new-chat-button-container">
        <button id="newChatButton" onClick={onNewChat}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Chat
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-header">
          <h3>Chats Archivados</h3>
        </div>
        <div className="archived-chats-list">
          {archivedChats.map((chat, index) => (
            <div key={index} className="chat-item">
              {chat.title}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
