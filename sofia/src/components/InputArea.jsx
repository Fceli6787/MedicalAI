import React, { useState } from 'react';
import { sendToOpenRouter } from '../services/api';
import '../css/input-area.css';

const InputArea = ({ isAudioMode, onSendMessage, messages = [] }) => {
  const [message, setMessage] = React.useState('');
  const [files, setFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const MAX_FILES = 5;
    const MAX_FILE_SIZE_MB = 20;
    const MAX_TOTAL_SIZE_MB = 20;
    
    const newFiles = Array.from(e.target.files);
    const currentFiles = [...files];
    const currentTotalSize = currentFiles.reduce((sum, f) => sum + f.size, 0);
    const newFilesSize = newFiles.reduce((sum, f) => sum + f.size, 0);

    // Validar cantidad máxima de archivos
    if (currentFiles.length + newFiles.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} archivos permitidos`);
      e.target.value = '';
      return;
    }

    // Validar tamaño máximo por archivo
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`El archivo ${file.name} excede ${MAX_FILE_SIZE_MB}MB`);
        e.target.value = '';
        return;
      }
    }

    // Validar tamaño total
    if ((currentTotalSize + newFilesSize) > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      setError(`El tamaño total no puede exceder ${MAX_TOTAL_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }

    // Validar tipos de archivo
    const validFiles = newFiles.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (validFiles.length !== newFiles.length) {
      setError('Solo se permiten imágenes y PDFs');
      e.target.value = '';
      return;
    }

    setFiles([...currentFiles, ...validFiles]);
    setError(null);
    e.target.value = '';
  };

  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || isSending) return;
    
    try {
      setIsSending(true);
      setError(null);
      
      // Enviar mensaje del usuario con texto y archivos
      const userMessage = {
        type: 'user',
        content: message,
        files: files,
        hasText: !!message.trim(),
        hasFiles: files.length > 0
      };
      onSendMessage(userMessage);
      setMessage('');
      setFiles([]);
      
      // Limpiar input de archivos
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError('Error al enviar el mensaje');
      console.error('Error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="input-container" id="inputContainer">
      {error && (
        <div className="file-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {files.length > 0 && (
        <div className="file-previews">
          {files.map((file, index) => (
            <div key={index} className="file-preview">
              {file.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="image-preview"
                />
              ) : (
                <div className="file-icon">
                  <span>{file.name}</span>
                </div>
              )}
              <button 
                className="remove-file" 
                onClick={() => removeFile(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="input-box">
        <input
          type="text"
          className="input-text"
          id="messageInput"
          placeholder="Escribe o usa el micrófono..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isAudioMode}
        />
        <div className="input-buttons">
          <label className="button-icon attach-button" htmlFor="fileInput" title="Adjuntar archivo">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          <input 
            type="file" 
            id="fileInput" 
            accept="image/*, application/pdf" 
            multiple 
            className="hidden-input" 
            onChange={handleFileChange}
          />
          </label>
          <button className="button-icon mic-button" id="micButton" title="Usar micrófono">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <button 
            className="button-icon send-button" 
            id="sendButton" 
            title="Enviar mensaje"
            onClick={handleSend}
            disabled={isAudioMode}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
