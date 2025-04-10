import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../css/header.css';

const Header = ({ title, isAudioMode, onToggleMode }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-logo-title">
        <img 
          src="/img/Logo SOFIA.png"
          alt="Logo SOFIA"
          className="header-logo"
          style={{
            height: '20px',
            width: 'auto',
            display: 'block',
            objectFit: 'contain'
          }}
          onError={(e) => {
            if (e.target.src.includes('Oscuro')) {
              e.target.src = '/img/Logo SOFIA.png';
            }
          }}
        />
        <img
          src="/img/Logo SOFIA Oscuro.png"
          alt="Logo SOFIA Oscuro"
          className="header-logo-dark"
          style={{
            height: '20px',
            width: 'auto',
            display: 'none',
            objectFit: 'contain',
            marginRight: '0.5rem'
          }}
          onError={(e) => {
            if (e.target.src.includes('Oscuro')) {
              e.target.src = '/img/Logo SOFIA.png';
            }
          }}
        />
        <div className="header-title">{title}</div>
      </div>
      <div className="header-controls">
        <div className="mode-toggle">
          <label htmlFor="modeSwitch">Texto</label>
          <input 
            type="checkbox" 
            id="modeSwitch"
            checked={isAudioMode}
            onChange={onToggleMode}
          />
          <label htmlFor="modeSwitch">Audio</label>
        </div>
      </div>
    </header>
  );
};

export default Header;
