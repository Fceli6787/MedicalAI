// script.js
        // --- Paste the Updated JavaScript (Provided Below) Here ---
        // --- Configuración inicial y Clases (MessageBuilder, Message, Decorators, Command, Visitor, ApiClient, SpeechManager) SIN CAMBIOS ---
        document.addEventListener('DOMContentLoaded', () => {
            // Set initial mode to text (checkbox unchecked)
            const modeSwitch = document.getElementById('modeSwitch');
            if (modeSwitch) {
                modeSwitch.checked = false;
            }
             // Ensure UI matches initial state immediately - MOVED TO LATER after manager init
             // const uiManager = new UIManager( ... ); // Instantiated later
             // uiManager.toggleMode(modeSwitch ? modeSwitch.checked : false);
        });

        // Configuración inicial desde variables globales
        const OPENROUTER_API_KEY = window.env.OPENROUTER_API_KEY;
        const YOUR_SITE_URL = window.env.YOUR_SITE_URL;
        const YOUR_SITE_NAME = window.env.YOUR_SITE_NAME;
        const SYSTEM_INSTRUCTIONS = window.env.SYSTEM_INSTRUCTIONS;

        const MAX_FILE_SIZE = Infinity; // Consider limiting this in production

        // Patrón Builder
        class MessageBuilder {
            constructor() {
                this.message = {
                    content: '',
                    type: 'user',
                    files: [],
                    isAudioMode: false
                };
            }

            setContent(content) {
                this.message.content = content;
                return this;
            }

            setType(type) {
                this.message.type = type;
                return this;
            }

            setFiles(files) {
                this.message.files = files;
                return this;
            }

            setAudioMode(isAudioMode) {
                this.message.isAudioMode = isAudioMode;
                return this;
            }

            build() {
                // Return a shallow copy to prevent modifications to the builder's internal state
                return Object.assign({}, this.message);
            }
        }

        // Patrón Prototype
        class Message {
            constructor({ content, type, files, isAudioMode }) {
                this.content = content;
                this.type = type;
                this.files = files; // Store file info { name, type, file object, id }
                this.isAudioMode = isAudioMode;
            }

            clone() {
                return new Message({
                    content: this.content,
                    type: this.type,
                    // Deep clone file array if it contains complex objects, shallow is fine for info
                    files: [...this.files],
                    isAudioMode: this.isAudioMode
                });
            }
        }

        // Patrón Decorator Base
        class MessageDecorator {
            constructor(message) {
                this.message = message;
            }

            // Base method to get content, overridden by specific decorators
            getContent() {
                return this.message.content;
            }

            // Base method to get plain text, might be overridden
            getPlainText() {
                // Basic implementation: remove potential HTML tags
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.message.content;
                return tempDiv.textContent || tempDiv.innerText || '';
            }
        }

        // --- UPDATED BoldDecorator with cleaner getPlainText ---
        class BoldDecorator extends MessageDecorator {
            getContent() {
                // **SIMPLIFICACIÓN TEMPORAL PARA PRUEBA DE EMOJIS**
                return this.message.content;
            }

            // --- **** ESTE ES EL MÉTODO MODIFICADO **** ---
            getPlainText() {
                // 1. Start with raw content
                let text = this.message.content;

                // 2. Basic cleanup (invalid chars, potential "html" prefix)
                text = text.replace(/^\uFFFD\s*/, '');
                text = text.replace(/^html\s*/i, '');

                // 3. Remove specific icons and emojis first
                text = text.replace(/[✔🔹🩺💊🔍📢🧠🔥📌🩻🔬🚀]/g, '');

                // 4. Remove Markdown formatting characters used for emphasis or structure
                text = text.replace(/\*\*\*/g, ''); // Remove ***
                text = text.replace(/\*\*/g, '');   // Remove ** (often used for bold)

                // 5. Remove leading markers for headings and lists (multiline)
                // Includes: ##, ###, number., -, * (only when followed by space for lists)
                const leadingListMarkersRegex = /^\s*(##\s+|###\s+|\d+\.\s+|[-*]\s+)/gm;
                text = text.replace(leadingListMarkersRegex, '');

                // 6. Handle the specific '*Label:' case (remove the leading * without space)
                // This looks for a line starting with '*' immediately followed by non-whitespace, then ':'
                const specificLabelRegex = /^\s*\*(?=\S)(.*?):/gm;
                text = text.replace(specificLabelRegex, '$1:'); // Replace '*Label:' with 'Label:'

                // 7. Convert to plain text (strip any remaining HTML, though unlikely needed now)
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = text; // Use innerHTML to let browser parse entities if any remain
                text = tempDiv.textContent || tempDiv.innerText || '';

                // 8. Final structuring: Split into lines, trim, filter empty, join with periods for better speech flow.
                text = text.split('\n')
                    .map(line => line.trim()) // Trim whitespace from each line
                    .filter(line => line.length > 0) // Remove empty lines
                    .join('. '); // Join non-empty lines with a period and space

                // 9. Final cleanup: Replace multiple periods/spaces, trim trailing/leading spaces/periods.
                text = text.replace(/\.{2,}/g, '.'); // Replace .. or ... with .
                text = text.replace(/\s{2,}/g, ' '); // Replace multiple spaces with single space
                text = text.replace(/\s+\./g, '.'); // Remove space before period
                text = text.replace(/(\s*\.\s*){2,}/g, '. '); // Normalize multiple periods separated by spaces
                text = text.trim().replace(/\.$/, '').trim(); // Remove trailing period if it exists, and trim again

                // console.log("Cleaned text for speech:", text); // DEBUG: See the final text
                return text; // Return the final cleaned text
            }
            // --- **** FIN DEL MÉTODO MODIFICADO **** ---
        }
        // --- END UPDATED BoldDecorator ---

        // Decorator for Speech Synthesis
        class SpeechDecorator extends MessageDecorator {
            constructor(message, audioSphere, audioStatus) {
                super(message);
                this.audioSphere = audioSphere;
                this.audioStatus = audioStatus;
                // Initialize AudioContext lazily or on first interaction if needed
                this.audioContext = null;
                this.analyser = null;
                this.dataArray = null;
                this.source = null;
                this.animationFrameId = null; // To control animation loop
            }

            _initAudioContext() {
                if (!this.audioContext) {
                    try {
                        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        this.analyser = this.audioContext.createAnalyser();
                        this.analyser.fftSize = 256; // Determines frequency resolution
                        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                    } catch (e) {
                        console.error("Failed to initialize AudioContext:", e);
                        this.audioContext = null; // Ensure it's null if failed
                    }
                }
            }

            async speak() {
                // Only speak if in audio mode and there's text content
                if (!this.message.isAudioMode || !this.message.content) {
                     if (this.message.isAudioMode) this.audioStatus.textContent = 'Esperando...'; // Reset status if audio mode but no text
                     return;
                }

                 // Cancel any ongoing speech before starting new one
                window.speechSynthesis.cancel();

                this.audioStatus.textContent = 'Procesando voz...'; // Updated status
                this.audioSphere.classList.remove('speaking'); // Ensure clean state

                // Use BoldDecorator to get clean text for speaking
                const boldDecorator = new BoldDecorator(this.message);
                const plainText = boldDecorator.getPlainText(); // <-- USES THE MODIFIED METHOD

                if (!plainText) {
                    this.audioStatus.textContent = 'Esperando...'; // Nothing to speak
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(plainText);
                utterance.lang = 'es-ES'; // Spanish
                utterance.pitch = 1.1;
                utterance.rate = 1.0; // Normal speed

                utterance.onstart = () => {
                    this._initAudioContext(); // Ensure context is ready
                    this.audioStatus.textContent = 'Hablando...';
                    this.audioSphere.classList.add('speaking');

                    // Create a dummy source node to connect analyser for visualization
                    if (this.audioContext && this.analyser) {
                        try {
                            // Disconnect previous source if exists
                            if(this.source) {
                                try { this.source.stop(); } catch(e){}
                                this.source.disconnect();
                                this.source = null;
                            }
                            this.source = this.audioContext.createBufferSource();
                            // Create a minimal buffer
                            const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
                            this.source.buffer = buffer;
                            this.source.loop = true; // Keep it running while utterance speaks
                            this.source.connect(this.analyser);
                            // Don't connect analyser to destination - purely visual
                            this.source.start();
                            this.animateSphere(); // Start animation
                        } catch (error) {
                             console.error("Error setting up audio analyser:", error);
                             // Proceed without animation if analyser fails
                        }
                    }
                };

                utterance.onend = () => {
                    this.audioStatus.textContent = 'Esperando...';
                    this.audioSphere.classList.remove('speaking');
                    this.audioSphere.style.transform = 'scale(1)'; // Reset scale
                    this.audioSphere.style.animationDuration = '2s'; // Reset animation speed
                    if (this.source) {
                        try { this.source.stop(); this.source.disconnect(); } catch(e) { console.warn("Minor error stopping source:", e); }
                        this.source = null;
                    }
                    if (this.animationFrameId) {
                        cancelAnimationFrame(this.animationFrameId); // Stop animation loop
                        this.animationFrameId = null;
                    }
                };

                 utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event.error);
                    this.audioStatus.textContent = 'Error al hablar';
                     // Clean up like onend
                    this.audioSphere.classList.remove('speaking');
                    this.audioSphere.style.transform = 'scale(1)';
                    this.audioSphere.style.animationDuration = '2s';
                    if (this.source) {
                        try { this.source.stop(); this.source.disconnect(); } catch(e) {}
                        this.source = null;
                    }
                    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                };


                window.speechSynthesis.speak(utterance);
            }

            animateSphere() {
                // Added check for audioContext existence
                if (!this.audioSphere.classList.contains('speaking') || !this.audioContext || !this.analyser || !this.dataArray) {
                    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null; // Ensure loop stops if condition changes
                    return;
                }

                try {
                    this.analyser.getByteFrequencyData(this.dataArray);

                    // Calculate average volume
                    let sum = 0;
                    for (let i = 0; i < this.dataArray.length; i++) {
                        sum += this.dataArray[i];
                    }
                    const averageVolume = this.dataArray.length > 0 ? sum / this.dataArray.length : 0;

                    // Map volume to scale (e.g., 1.0 to 1.3)
                    const scale = 1 + (averageVolume / 128) * 0.3; // Adjust multiplier for sensitivity

                    // Apply transformations
                    this.audioSphere.style.transform = `scale(${Math.max(1, scale)})`; // Ensure minimum scale is 1

                    // Continue animation loop
                    this.animationFrameId = requestAnimationFrame(() => this.animateSphere());
                } catch(error) {
                    console.error("Error during sphere animation:", error);
                     if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                     this.animationFrameId = null;
                      // Maybe stop visualization if errors persist
                }
            }
        }


        // Patrón Command
        class Command {
            execute() {
                throw new Error("Command execute() must be implemented");
            }
        }

        class SendMessageCommand extends Command {
            constructor(chatManager, message) {
                super();
                this.chatManager = chatManager;
                this.message = message; // Message object created by Builder
            }

            async execute() {
                // Pass the already built message object
                await this.chatManager.sendMessage(this.message);
            }
        }

        class SpeakCommand extends Command {
            constructor(speechDecorator) {
                super();
                this.speechDecorator = speechDecorator;
            }

            execute() {
                // Ensure speak is async if needed, but call is sync here
                this.speechDecorator.speak();
            }
        }

        class AddFileCommand extends Command {
            constructor(uiManager, file) {
                super();
                this.uiManager = uiManager;
                this.file = file; // File object from input
            }

            execute() {
                this.uiManager.addFile(this.file);
            }
        }

        // Patrón Visitor
        class MessageVisitor {
            visitUserMessage(message, uiManager) {
                 // Only display user message visually if NOT in pure audio mode
                if (!message.isAudioMode) {
                    uiManager.addUserMessage(message);
                }
                 // Optionally log user input even in audio mode
                 // console.log("User input (Audio Mode):", message.content);
            }

            visitAssistantMessage(message, uiManager, speechDecorator) {
                if (message.isAudioMode) {
                    // In audio mode, prioritize speaking
                    const speakCommand = new SpeakCommand(speechDecorator);
                    speakCommand.execute();
                    // Optionally, still add to chat history visually but hidden, or don't add visually at all
                    // uiManager.addAssistantMessage(message, speechDecorator); // Uncomment to also show in chat log
                } else {
                    // In text mode, display the message
                    uiManager.addAssistantMessage(message, speechDecorator);
                    // No need to explicitly call speak here, addAssistantMessage might handle it if needed or not
                }
            }
        }


        // Clase ApiClient
        class ApiClient {
            constructor(apiKey, siteUrl, siteName, systemInstructions) {
                this.apiKey = apiKey;
                this.siteUrl = siteUrl;
                this.siteName = siteName;
                this.systemInstructions = systemInstructions;
            }

           async generateResponse(prompt, files, chatHistory) {
                const messages = [
                    { role: "system", content: this.systemInstructions },
                    ...chatHistory, // Include previous turns
                ];

                // Prepare content parts for the user message
                const userMessageContent = [];

                // Add text prompt if available
                if (prompt) {
                    userMessageContent.push({ type: "text", text: prompt });
                }

                // Process and add files (images only supported by many vision models via URL data)
                if (files && files.length > 0) {
                    const imageFiles = files.filter(fileInfo => fileInfo.type.startsWith('image/'));

                    if (imageFiles.length > 0) {
                         // Add text asking to analyze if no prompt was given
                        if (!prompt && userMessageContent.length === 0) { // Only add if no text prompt yet
                             userMessageContent.push({ type: "text", text: "Analiza las imágenes adjuntas y proporciona un diagnóstico y recomendaciones." });
                        }

                        for (const fileInfo of imageFiles) {
                            try {
                                // Resize and get base64
                                const base64Content = await readFileAsBase64(fileInfo.file);
                                userMessageContent.push({
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${fileInfo.type};base64,${base64Content}`
                                    }
                                });
                            } catch (error) {
                                console.error(`Error processing file ${fileInfo.name}:`, error);
                                // Add a placeholder message part indicating the error
                                userMessageContent.push({ type: "text", text: `(Error al procesar la imagen: ${fileInfo.name})` });
                            }
                        }
                    }
                     // Inform user if PDFs were attached but ignored (most vision models don't handle PDF files directly)
                    const pdfFiles = files.filter(fileInfo => fileInfo.type === 'application/pdf');
                    if (pdfFiles.length > 0 && userMessageContent.length === 0 && !prompt) {
                         userMessageContent.push({ type: "text", text: "Adjuntaste archivos PDF. Por favor, describe su contenido o haz una pregunta específica, ya que no puedo leer PDFs directamente." });
                    } else if (pdfFiles.length > 0) {
                        console.warn("PDF files were attached but will likely be ignored by the model.");
                        // Optionally add a note to the user prompt itself
                        // userMessageContent.push({ type: "text", text: "(Nota: Los archivos PDF adjuntos probablemente serán ignorados)" });
                    }
                }

                // Only add the user message if it has content (text or images)
                 if (userMessageContent.length > 0) {
                    messages.push({ role: "user", content: userMessageContent });
                 } else if (chatHistory.length === 0) { // Allow sending empty if history is also empty (initial prompt maybe?)
                     // If it's the *very first* interaction and it's empty, maybe send a default prompt?
                     // Or handle this case specifically before calling the API
                     console.log("No content to send to API for the first message.");
                     throw new Error("No text or image content provided for the initial API request.");
                 }
                 // If history exists, but current message is empty, allow API call (might be relevant for context)


                console.log("Sending messages to API:", JSON.stringify(messages, null, 2)); // Log the request structure

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "HTTP-Referer": this.siteUrl, // Required by OpenRouter
                        "X-Title": this.siteName,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        // --- MODEL CONFIRMED ---
                        model: "google/gemini-2.0-flash-thinking-exp:free",
                        messages: messages,
                        // stream: false // Keeping stream false
                    }),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`API Error Response (${response.status} ${response.statusText}):`, errorBody);
                    throw new Error(`Error from API: ${response.status} ${response.statusText}. Check console for details.`);
                }

                const data = await response.json();
                 // console.log("Received data from API:", data); // Log the response - Reduce console noise

                if (!data || !data.choices || data.choices.length === 0 || !data.choices[0].message || typeof data.choices[0].message.content === 'undefined') {
                     console.error("Invalid response structure from API:", data); // Log the full data object for inspection!
                    throw new Error("Invalid response structure received from API.");
                }

                // Return the content part of the assistant's message
                return {
                    response: data.choices[0].message.content,
                };
            }
        }

        // Clase SpeechManager (for Speech Recognition)
        class SpeechManager {
            constructor() {
                // Check for browser support
                if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
                    console.warn("Speech Recognition not supported in this browser.");
                    this.recognition = null;
                    return;
                }
                this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                this.recognition.lang = 'es-ES'; // Spanish
                this.recognition.interimResults = false; // Get final result only
                this.recognition.continuous = false; // Stop after first pause
                this.isListening = false;
                this.onResultCallback = null; // Callback when result is final
                this.onErrorCallback = null; // Callback for errors
                this.onEndCallback = null; // Callback when recognition ends

                this._setupEventHandlers();
            }

            _setupEventHandlers() {
                if (!this.recognition) return;

                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    // console.log("Transcript:", transcript); // Reduce noise
                    if (this.onResultCallback) {
                        this.onResultCallback(transcript); // Pass transcript to callback
                    }
                };

                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    if (this.onErrorCallback) {
                        this.onErrorCallback(event.error);
                    }
                     this.isListening = false;
                     const micButton = document.getElementById('micButton');
                     const inputContainer = document.getElementById('inputContainer');
                     if (micButton) micButton.classList.remove('listening');
                     if (inputContainer) inputContainer.classList.remove('listening');
                };

                this.recognition.onend = () => {
                    // console.log("Speech recognition ended."); // Reduce noise
                    this.isListening = false;
                     const micButton = document.getElementById('micButton');
                     const inputContainer = document.getElementById('inputContainer');
                     if (micButton) micButton.classList.remove('listening');
                     if (inputContainer) inputContainer.classList.remove('listening');

                    if (this.onEndCallback) {
                        this.onEndCallback();
                    }
                };
            }

            startListening(onResult, onError, onEnd) {
                if (!this.recognition) {
                     alert("El reconocimiento de voz no es compatible con este navegador.");
                     return;
                }
                if (!this.isListening) {
                    this.onResultCallback = onResult;
                    this.onErrorCallback = onError;
                    this.onEndCallback = onEnd;
                    try {
                        this.recognition.start();
                        this.isListening = true;
                        console.log("Speech recognition started.");
                        const micButton = document.getElementById('micButton');
                        const inputContainer = document.getElementById('inputContainer');
                        if (micButton) micButton.classList.add('listening');
                        if (inputContainer) inputContainer.classList.add('listening');
                    } catch (error) {
                        console.error("Could not start speech recognition:", error);
                         this.isListening = false;
                         const micButton = document.getElementById('micButton');
                         const inputContainer = document.getElementById('inputContainer');
                         if (micButton) micButton.classList.remove('listening');
                         if (inputContainer) inputContainer.classList.remove('listening');
                        if(onError) onError(error.name === 'NotAllowedError' ? 'Permission denied' : error.message || "Could not start listening");
                    }
                } else {
                    console.log("Already listening. Call stopListening() to interrupt.");
                }
            }

            stopListening() {
                if (!this.recognition) return;
                if (this.isListening) {
                    try { // Add try-catch as stop() can sometimes throw errors if already stopped
                        this.recognition.stop();
                        console.log("Speech recognition stopped.");
                    } catch (e) {
                        console.warn("Error stopping recognition (might be already stopped):", e.message);
                    }
                    this.isListening = false; // Ensure state is false
                    const micButton = document.getElementById('micButton');
                    const inputContainer = document.getElementById('inputContainer');
                    if (micButton) micButton.classList.remove('listening');
                    if (inputContainer) inputContainer.classList.remove('listening');
                 }
            }
        }


        // --- UIManager (REMOVED _removeExampleMessages) ---
        class UIManager {
            constructor(chatArea, audioArea, messageInput, filesPreviewGrid, audioSphere, audioStatus) {
                this.chatArea = chatArea;
                this.audioArea = audioArea;
                this.messageInput = messageInput;
                this.filesPreviewGrid = filesPreviewGrid; // Reference to the grid container
                this.audioSphere = audioSphere;
                this.audioStatus = audioStatus;
                this.attachedFiles = []; // Stores { name, type, file object, id }
                this.isAudioMode = false;
                this.loadingElement = null; // To keep track of the loading indicator
            }

            toggleMode(isAudioMode) {
                this.isAudioMode = isAudioMode;
                window.speechSynthesis.cancel();
                 if(speechManager) {
                    speechManager.stopListening();
                 }

                if (isAudioMode) {
                    this.chatArea.classList.add('hidden');
                    this.filesPreviewGrid.classList.add('hidden');
                    this.audioArea.classList.remove('hidden');
                    this.audioStatus.textContent = 'Esperando...';
                    this.audioSphere.classList.remove('speaking');
                    this.audioSphere.style.transform = 'scale(1)';
                } else {
                    this.chatArea.classList.remove('hidden');
                    this.filesPreviewGrid.classList.remove('hidden');
                    this.audioArea.classList.add('hidden');
                     this.scrollToBottom();
                }
            }

            _createAvatar(type) {
                 const avatarDiv = document.createElement('div');
                 avatarDiv.className = type === 'user' ? 'avatar' : 'assistant-avatar';
                 const svgIcon = type === 'user'
                     ? `<svg viewBox="0.0 0 24 24" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
                     : `<svg viewBox="0.0 0 24 24" fill="none" stroke-width="2"><path d="M12 8v8m-4-4h8"></path><circle cx="12" cy="12" r="10"></circle><path d="M12 1v2"></path><path d="M12 21v2"></path><path d="m4.2 4.2 1.4 1.4"></path><path d="m18.4 18.4 1.4 1.4"></path><path d="M1 12h2"></path><path d="M21 12h2"></path><path d="m4.2 19.8 1.4-1.4"></path><path d="m18.4 5.6 1.4-1.4"></path></svg>`;
                 avatarDiv.innerHTML = svgIcon;
                 const svgElement = avatarDiv.querySelector('svg');
                 if (svgElement) {
                     svgElement.style.stroke = 'var(--bg-color)';
                 }
                 return avatarDiv;
            }

            addUserMessage(message) {
                // REMOVED _removeExampleMessages call

                const messageElement = document.createElement('div');
                messageElement.className = 'user-message-container';

                const bubble = document.createElement('div');
                bubble.className = 'message-bubble user-message';
                bubble.textContent = message.content; // Simple text content for user

                messageElement.appendChild(bubble);
                messageElement.appendChild(this._createAvatar('user'));

                this.chatArea.appendChild(messageElement);
                this.scrollToBottom();
            }

            addAssistantMessage(message, speechDecorator) {
                this.removeLoadingIndicator();
                // REMOVED _removeExampleMessages call

                const messageContainer = document.createElement('div');
                messageContainer.className = 'assistant-message-container';

                const bubble = document.createElement('div');
                bubble.className = 'message-bubble assistant-message';

                const boldDecorator = new BoldDecorator(message);
                bubble.innerHTML = boldDecorator.getContent();


                messageContainer.appendChild(this._createAvatar('assistant'));
                messageContainer.appendChild(bubble);

                this.chatArea.appendChild(messageContainer);
                this.scrollToBottom();
            }

             // REMOVED _removeExampleMessages method

            addLoadingIndicator() {
                // REMOVED _removeExampleMessages call
                 if (this.loadingElement && this.chatArea.contains(this.loadingElement)) {
                     this.scrollToBottom();
                     return this.loadingElement;
                 }

                this.loadingElement = document.createElement('div');
                this.loadingElement.className = 'assistant-message-container loading-indicator';

                const bubble = document.createElement('div');
                bubble.className = 'message-bubble assistant-message';
                bubble.innerHTML = 'Escribiendo... <span class="dot-flashing"></span>';

                this.loadingElement.appendChild(this._createAvatar('assistant'));
                this.loadingElement.appendChild(bubble);

                this.chatArea.appendChild(this.loadingElement);
                this.scrollToBottom();
                return this.loadingElement;
            }

            removeLoadingIndicator() {
                 if (this.loadingElement && this.chatArea.contains(this.loadingElement)) {
                    this.chatArea.removeChild(this.loadingElement);
                    this.loadingElement = null;
                }
            }

            addFile(file) {
                if (!file) return;
                 if (this.attachedFiles.some(f => f.name === file.name && f.file.size === file.size)) {
                    alert(`El archivo "${file.name}" ya ha sido adjuntado.`);
                    return;
                }

                const fileInfo = { name: file.name, type: file.type, file: file, id: Date.now() + Math.random() + file.size };
                this.attachedFiles.push(fileInfo);

                const filePreviewContainer = document.createElement('div');
                filePreviewContainer.className = 'file-preview-container';
                filePreviewContainer.dataset.fileId = fileInfo.id;

                const previewContent = document.createElement('div');
                previewContent.className = 'file-preview-content';

                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.alt = file.name;
                    const reader = new FileReader();
                    reader.onload = (e) => { img.src = e.target.result; };
                    reader.readAsDataURL(file);
                    previewContent.appendChild(img);
                } else if (file.type === 'application/pdf') {
                    const pdfIcon = document.createElement('div');
                    pdfIcon.className = 'file-icon';
                    pdfIcon.textContent = 'PDF';
                    previewContent.appendChild(pdfIcon);
                } else {
                     const fileIcon = document.createElement('div');
                     fileIcon.className = 'file-icon';
                     const extension = file.name.split('.').pop()?.substring(0, 4).toUpperCase() || 'FILE';
                     fileIcon.textContent = extension;
                     previewContent.appendChild(fileIcon);
                }

                const fileNameSpan = document.createElement('span');
                fileNameSpan.className = "file-name";
                fileNameSpan.textContent = file.name;
                fileNameSpan.title = file.name;
                previewContent.appendChild(fileNameSpan);

                filePreviewContainer.appendChild(previewContent);

                const removeButton = document.createElement('button');
                removeButton.className = 'remove-file';
                removeButton.type = 'button';
                removeButton.title = 'Quitar archivo';
                removeButton.innerHTML = `<svg viewBox="0.0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                removeButton.onclick = () => {
                     this.removeFileById(fileInfo.id);
                     filePreviewContainer.remove();
                };

                filePreviewContainer.appendChild(removeButton);
                this.filesPreviewGrid.appendChild(filePreviewContainer);
                this.scrollToBottom();
            }

             removeFileById(id) {
                 this.attachedFiles = this.attachedFiles.filter(f => f.id !== id);
                 // console.log("Files after removal:", this.attachedFiles);
             }

            clearFiles() {
                this.attachedFiles = [];
                 this.filesPreviewGrid.innerHTML = ''; // Clear the preview grid in the UI
            }

            getAttachedFiles() {
                return [...this.attachedFiles];
            }

            scrollToBottom() {
                 setTimeout(() => {
                     if (this.chatArea) {
                        this.chatArea.scrollTop = this.chatArea.scrollHeight;
                     }
                 }, 50); // Slightly shorter delay might be okay now
            }
        }


        // --- ChatManager (ADDED startNewChat method) ---
        class ChatManager {
            constructor(apiClient, uiManager, visitor) {
                this.apiClient = apiClient;
                this.uiManager = uiManager;
                this.visitor = visitor;
                this.chatHistory = [];
                this.isProcessing = false;
            }

            // --- NEW METHOD ---
            async startNewChat() {
                console.log("Starting new chat...");
                
                // Archive current chat if it has messages
                if (this.chatHistory.length > 0) {
                    try {
                        await this.archiveCurrentChat();
                    } catch (error) {
                        console.error("Error archiving chat:", error);
                    }
                }

                this.chatHistory = []; // Clear internal history
                this.uiManager.chatArea.innerHTML = ''; // Clear visual chat
                this.uiManager.clearFiles(); // Clear attached files and previews
                this.uiManager.messageInput.value = ''; // Clear input field
                this.uiManager.removeLoadingIndicator(); // Ensure no loading indicator remains
                this.isProcessing = false; // Reset processing state
                window.speechSynthesis.cancel(); // Stop any ongoing speech
                if (speechManager) speechManager.stopListening(); // Stop listening if active

                // Reset audio status if needed
                if (this.uiManager.isAudioMode) {
                    this.uiManager.audioStatus.textContent = 'Esperando...';
                }
                console.log("New chat started.");
            }

            async archiveCurrentChat() {
                try {
                    // Generate chat name from first message or date
                    const chatName = this.chatHistory.length > 0 
                        ? (typeof this.chatHistory[0].content === 'string'
                            ? this.chatHistory[0].content.substring(0, 30)
                            : this.chatHistory[0].content[0]?.text?.substring(0, 30) || 'Nueva conversación')
                        : 'Nueva conversación';

                    // Prepare messages with chat name
                    const messagesToArchive = this.chatHistory.map(msg => {
                        const archivedMsg = {
                            role: msg.role,
                            content: typeof msg.content === 'string' ? msg.content 
                                    : msg.content.map(c => c.text).join('\n')
                        };
                        
                        if (msg.attachments) {
                            archivedMsg.attachments = msg.attachments.map(file => ({
                                type: file.type,
                                url: file.url || '',
                                name: file.name
                            }));
                        }
                        return archivedMsg;
                    });

                    const response = await fetch('api.php?action=archive_chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            chat_name: chatName,
                            messages: messagesToArchive
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to archive chat');
                    }

                    const data = await response.json();
                    console.log("Chat archived successfully with ID:", data.chat_id);
                    
                    // Refresh chat list
                    await this.loadChatList();
                    
                    return data;
                } catch (error) {
                    console.error("Archive error:", error);
                    throw error;
                }
            }

            async loadChatList() {
                try {
                    const response = await fetch('api.php?action=get_chat_list');
                    if (!response.ok) throw new Error('Failed to load chat list');
                    
                    const data = await response.json();
                    this.updateChatSidebar(data.chats);
                } catch (error) {
                    console.error("Error loading chat list:", error);
                }
            }

            updateChatSidebar(chats) {
                const sidebar = document.getElementById('archivedChatsList');
                if (!sidebar) return;
                
                sidebar.innerHTML = '';
                
                chats.forEach(chat => {
                    const chatElement = document.createElement('div');
                    chatElement.className = 'chat-item';
                    
                    // Format date nicely
                    const date = new Date(chat.fecha_archivado);
                    const formattedDate = date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    // Create preview text (first 50 chars of last message)
                    let previewText = chat.preview || 'Nuevo chat';
                    if (previewText.length > 50) {
                        previewText = previewText.substring(0, 50) + '...';
                    }
                    
                    chatElement.innerHTML = `
                        <div class="chat-preview">${previewText}</div>
                        <div class="chat-date">${formattedDate}</div>
                    `;
                    
                    chatElement.addEventListener('click', () => {
                        this.loadChat(chat.id_chat);
                    });
                    
                    sidebar.appendChild(chatElement);
                });
            }

            async loadChat(chatId) {
                // Check if already loaded to prevent duplicates
                if (this.currentChatId === chatId) return;
                this.currentChatId = chatId;
                
                try {
                    const response = await fetch(`api.php?action=get_chat&id=${chatId}`);
                    if (!response.ok) throw new Error('Failed to load chat');
                    
                    const data = await response.json();
                    
                    // Clear current chat
                    this.chatHistory = [];
                    this.uiManager.chatArea.innerHTML = '';
                    
                    // Load messages
                    data.messages.forEach(msg => {
                        const message = new MessageBuilder()
                            .setContent(msg.content)
                            .setType(msg.role === 'user' ? 'user' : 'assistant')
                            .build();
                            
                        if (msg.role === 'user') {
                            this.uiManager.addUserMessage(message);
                        } else {
                            this.uiManager.addAssistantMessage(message);
                        }
                        
                        // Add to history
                        this.chatHistory.push({
                            role: msg.role,
                            content: msg.content
                        });
                    });
                    
                    this.uiManager.scrollToBottom();
                } catch (error) {
                    console.error("Error loading chat:", error);
                }
            }
            // --- END NEW METHOD ---


            async sendMessage(message) {
                 if (this.isProcessing) {
                     console.warn("Processing already in progress. Please wait.");
                     if (uiManager.isAudioMode) {
                         uiManager.audioStatus.textContent = "Procesando...";
                     }
                     return;
                 }
                 if (!message.content && message.files.length === 0) {
                     console.log("No message content or files to send.");
                     return;
                 }

                 this.isProcessing = true;
                 this.uiManager.removeLoadingIndicator();

                 this.visitor.visitUserMessage(message, this.uiManager);

                 if (!this.uiManager.isAudioMode) {
                     this.uiManager.addLoadingIndicator();
                 } else {
                     this.uiManager.audioStatus.textContent = 'Pensando...';
                 }

                 const prompt = message.content;
                 const filesToSend = message.files;
                 const filesSentInThisRequest = [...filesToSend];

                 try {
                     const response = await this.apiClient.generateResponse(prompt, filesSentInThisRequest, this.chatHistory);

                     const userMessageForHistory = { role: "user", content: [] };
                     if (prompt) userMessageForHistory.content.push({ type: "text", text: prompt });

                     filesSentInThisRequest.forEach(f => {
                         if(f.type.startsWith("image/")) {
                              userMessageForHistory.content.push({ type: "text", text: `[Imagen adjunta procesada: ${f.name}]` });
                         } else if (f.type === 'application/pdf') {
                              userMessageForHistory.content.push({ type: "text", text: `[PDF adjunto (ignorado): ${f.name}]` });
                         }
                     });
                      if (userMessageForHistory.content.length > 0) {
                        this.chatHistory.push(userMessageForHistory);
                      }

                     this.chatHistory.push({ role: "assistant", content: response.response });

                     const assistantMessage = new MessageBuilder()
                         .setContent(response.response)
                         .setType('assistant')
                         .setFiles([])
                         .setAudioMode(message.isAudioMode)
                         .build();

                     const speechDecorator = new SpeechDecorator(
                         assistantMessage,
                         this.uiManager.audioSphere,
                         this.uiManager.audioStatus
                     );

                     if (!this.uiManager.isAudioMode) {
                        this.uiManager.removeLoadingIndicator();
                     }

                     this.visitor.visitAssistantMessage(assistantMessage, this.uiManager, speechDecorator);


                 } catch (error) {
                     console.error("Error during message processing:", error);
                     this.uiManager.removeLoadingIndicator();
                      if (this.uiManager.isAudioMode) {
                          this.uiManager.audioStatus.textContent = 'Error';
                      }

                      const errorMessageContent = `Lo siento, ha ocurrido un error: ${error.message || 'Error desconocido'}. Por favor, inténtalo de nuevo.`;
                     const errorMessage = new MessageBuilder()
                         .setContent(errorMessageContent)
                         .setType('assistant')
                         .setFiles([])
                         .setAudioMode(message.isAudioMode)
                         .build();

                     const errorSpeechDecorator = new SpeechDecorator(
                         errorMessage,
                         this.uiManager.audioSphere,
                         this.uiManager.audioStatus
                     );
                      this.visitor.visitAssistantMessage(errorMessage, this.uiManager, errorSpeechDecorator);


                 } finally {
                     this.isProcessing = false;
                     this.uiManager.messageInput.value = '';

                     filesSentInThisRequest.forEach(sentFile => {
                         this.uiManager.removeFileById(sentFile.id);
                         const previewElement = this.uiManager.filesPreviewGrid.querySelector(`[data-file-id="${sentFile.id}"]`);
                         if (previewElement) {
                             previewElement.remove();
                         }
                     });

                     if (this.uiManager.isAudioMode && this.uiManager.audioStatus.textContent === 'Error') {
                         setTimeout(() => {
                             if (!this.isProcessing && !window.speechSynthesis.speaking) {
                                this.uiManager.audioStatus.textContent = 'Esperando...';
                             }
                         }, 2000);
                     }
                 }
            }
        }


        // --- Utility Functions (resizeImage, readFileAsBase64) SIN CAMBIOS ---
         function resizeImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.85) {
             return new Promise((resolve, reject) => {
                 if (!file || !file.type || !file.type.startsWith('image/')) {
                      reject(new Error("File is not a valid image"));
                      return;
                 }

                 const img = new Image();
                 const reader = new FileReader();

                 reader.onload = (e) => {
                     if (!e.target || !e.target.result) return reject(new Error("FileReader failed to load image."));
                     img.src = e.target.result;
                 };
                 reader.onerror = (err) => reject(err || new Error("FileReader error"));
                 reader.readAsDataURL(file);

                 img.onload = () => {
                     const canvas = document.createElement('canvas');
                     let { width, height } = img;
                     canvas.toBlob((blob) => {
                         if (!blob) {
                             reject(new Error("Canvas to Blob conversion failed"));
                             return;
                         }
                         resolve(blob);
                     }, file.type, quality);
                 };
                 img.onerror = (error) => {
                     reject(new Error("Image could not be loaded for resizing."));
                 };
             });
         }

        async function readFileAsBase64(file) {
             if (!file) throw new Error("No file provided to readFileAsBase64");

             try {
                 const blobToRead = file.type.startsWith('image/')
                     ? await resizeImage(file)
                     : file;

                 return new Promise((resolve, reject) => {
                     const reader = new FileReader();
                     reader.onload = () => {
                         const resultString = reader.result;
                          if (typeof resultString !== 'string' || !resultString.includes(',')) {
                              reject(new Error("FileReader result is not a valid Data URL."));
                              return;
                          }
                         const base64String = resultString.split(',')[1];
                         if (typeof base64String !== 'string' || base64String.length === 0) {
                             reject(new Error("Failed to extract base64 string from Data URL."));
                             return;
                         }
                         resolve(base64String);
                     };
                     reader.onerror = (error) => {
                          reject(error || new Error("Unknown FileReader error"));
                     };
                     reader.readAsDataURL(blobToRead);
                 });

             } catch (error) {
                 console.error("Error in readFileAsBase64 (potentially during resize):", error);
                 throw error;
             }
         }

        // --- Global instance Declarations ---
        let speechManager;
        let uiManager;
        let chatManager; // Make chatManager accessible globally within the script

        // --- Initialization and Event Listeners (UPDATED) ---
        document.addEventListener('DOMContentLoaded', () => {

            // Instantiate Core Components
            const apiClient = new ApiClient(OPENROUTER_API_KEY, YOUR_SITE_URL, YOUR_SITE_NAME, SYSTEM_INSTRUCTIONS);
            uiManager = new UIManager( // Assign to global
                document.getElementById('chatArea'),
                document.getElementById('audioArea'),
                document.getElementById('messageInput'),
                document.getElementById('filesPreviewGrid'),
                document.getElementById('audioSphere'),
                document.getElementById('audioStatus')
            );
            speechManager = new SpeechManager(); // Assign to global
            const visitor = new MessageVisitor();
            chatManager = new ChatManager(apiClient, uiManager, visitor); // Assign to global

            // --- Setup Event Listeners ---

            // Mode Toggle Switch
            const modeSwitch = document.getElementById('modeSwitch');
            if (modeSwitch) {
                 // Set initial state based on HTML (which is unchecked)
                 // uiManager.toggleMode(modeSwitch.checked); // Called after startNewChat now

                modeSwitch.addEventListener('change', () => {
                    uiManager.toggleMode(modeSwitch.checked);
                });
            }

            // Send Button Click
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                sendButton.addEventListener('click', handleSendMessage);
            }

            // Enter Key in Input Field
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                });
            }

             // File Input Change
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files);
                     if (!files.length) return;

                    const MAX_FILES = 5;
                    const MAX_TOTAL_SIZE_MB = 20;
                    const currentFiles = uiManager.getAttachedFiles();
                    const currentTotalSize = currentFiles.reduce((sum, f) => sum + f.file.size, 0);
                    const newFilesSize = files.reduce((sum, f) => sum + f.file.size, 0);

                    if (currentFiles.length + files.length > MAX_FILES) {
                        alert(`Puedes adjuntar un máximo de ${MAX_FILES} archivos.`);
                        e.target.value = '';
                        return;
                    }
                    if ((currentTotalSize + newFilesSize) / (1024 * 1024) > MAX_TOTAL_SIZE_MB) {
                         alert(`El tamaño total de los archivos no puede exceder ${MAX_TOTAL_TOTAL_SIZE_MB} MB.`);
                         e.target.value = '';
                         return;
                    }

                    files.forEach(file => {
                        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                            alert(`Archivo no soportado: ${file.name}. Solo se permiten imágenes y PDF.`);
                            return;
                        }
                        const command = new AddFileCommand(uiManager, file);
                        command.execute();
                    });
                    e.target.value = '';
                });
            }


            // Microphone Button Click
            const micButton = document.getElementById('micButton');
            if (micButton && speechManager && speechManager.recognition) {
                micButton.addEventListener('click', () => {
                     if (chatManager.isProcessing) {
                         console.warn("Cannot start microphone while processing a request.");
                         return;
                     }
                     if (!speechManager.isListening) {
                        const handleSpeechResult = (transcript) => {
                            if (!transcript) return;
                            const message = new MessageBuilder()
                                .setContent(transcript.trim())
                                .setType('user')
                                .setFiles(uiManager.getAttachedFiles())
                                .setAudioMode(true) // Assume mic use implies audio mode response
                                .build();
                            const command = new SendMessageCommand(chatManager, message);
                            command.execute();
                        };

                        const handleSpeechError = (error) => {
                             console.error("Speech Recognition Error:", error);
                             let errorMsg = 'Error Rec.';
                             if (error === 'not-allowed' || error === 'Permission denied') {
                                 errorMsg = 'Permiso denegado';
                                 alert("Necesitas permitir el acceso al micrófono en tu navegador.");
                             } else if (error === 'no-speech') {
                                 errorMsg = 'No se detectó voz';
                             } else if (error === 'audio-capture') {
                                 errorMsg = 'Error de micrófono';
                             }
                              if (uiManager.isAudioMode) {
                                uiManager.audioStatus.textContent = errorMsg;
                                setTimeout(() => {
                                    if (uiManager.audioStatus.textContent === errorMsg) {
                                        uiManager.audioStatus.textContent = 'Esperando...';
                                    }
                                }, 3000);
                             }
                         };

                         const handleSpeechEnd = () => {
                              // console.log("Recognition process finished.");
                         };

                        // Switch to audio mode if not already in it when mic is pressed
                        if (!uiManager.isAudioMode) {
                             if(modeSwitch) modeSwitch.checked = true; // Update checkbox UI
                             uiManager.toggleMode(true); // Switch manager state
                        }
                         uiManager.audioStatus.textContent = "Escuchando...";
                        speechManager.startListening(
                            handleSpeechResult,
                            handleSpeechError,
                            handleSpeechEnd
                        );

                     } else {
                        speechManager.stopListening();
                    }
                });
            } else if (micButton) {
                 micButton.disabled = true;
                 micButton.title = "Reconocimiento de voz no soportado";
                 micButton.style.opacity = "0.5";
                 micButton.style.cursor = "not-allowed";
            }

            // --- NEW CHAT BUTTON LISTENER ---
            const newChatButton = document.getElementById('newChatButton');
            if (newChatButton) {
                newChatButton.addEventListener('click', () => {
                    // Use the globally accessible chatManager instance
                    if (chatManager) {
                        chatManager.startNewChat();
                    } else {
                        console.error("ChatManager not initialized yet.");
                    }
                });
            }
            // --- END NEW CHAT BUTTON LISTENER ---

            // Evento de clic en el botón de cerrar sesión
            const logoutButton = document.querySelector('.logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    console.log("Logout button clicked!"); // Add this line for debugging
                    Swal.fire({
                        title: '¿Estás seguro?',
                        text: "¿Quieres cerrar la sesión actual?",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Sí, cerrar sesión',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Redirigir a logout.php para destruir la sesión
                            window.location.href = 'logout.php';
                        }
                    });
                });
            }

            // Evento de clic en el botón de configuración
            const configButton = document.querySelector('.config-button');
            if (configButton) {
                configButton.addEventListener('click', () => {
                    Swal.fire({
                        title: 'Configuración',
                        html: `
                            <div style="text-align: left;">
                                <label for="themeSwitch" style="display: block; margin-bottom: 10px;">
                                    <input type="checkbox" id="themeSwitch" style="margin-right: 10px;">
                                    Modo Oscuro
                                </label>
                            </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Guardar',
                        cancelButtonText: 'Cancelar',
                        preConfirm: () => {
                            const themeSwitch = document.getElementById('themeSwitch');
                            return themeSwitch.checked;
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            const isDarkTheme = result.value;
                            if (isDarkTheme) {
                                document.documentElement.classList.add('dark-theme');
                            } else {
                                document.documentElement.classList.remove('dark-theme');
                            }
                        }
                    });
                });
            }

            // --- Helper Function to Handle Sending ---
            function handleSendMessage() {
                 if (!chatManager || chatManager.isProcessing) return;

                const currentMessage = uiManager.messageInput.value.trim();
                const files = uiManager.getAttachedFiles();

                if (!currentMessage && files.length === 0) {
                    return;
                }

                 const message = new MessageBuilder()
                    .setContent(currentMessage)
                    .setType('user')
                    .setFiles(files)
                    .setAudioMode(modeSwitch ? modeSwitch.checked : false)
                    .build();

                 const command = new SendMessageCommand(chatManager, message);
                 command.execute();
            }

             // --- Initial Setup ---
             // Start a new chat session every time the page loads
             if (chatManager) {
                 chatManager.startNewChat();
             }
             // Set initial UI mode after resetting chat
             if (modeSwitch && uiManager) {
                uiManager.toggleMode(modeSwitch.checked);
             }


        }); // End DOMContentLoaded
