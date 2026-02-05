// Frontend JS for the legal chatbot
// Handles all the UI stuff - chat, file uploads, modals, etc.

// DOM elements - will get these after page loads
let messageInput;
let documentPaste;
let sendBtn;
let analyzeBtn;
let clearBtn;
let chatMessages;
let loadingIndicator;
let textTab;
let documentTab;
let textInputSection;
let documentInputSection;
let fileInput;
let uploadArea;
let disclaimerModal;
let acceptDisclaimerBtn;

// Some state variables
let isProcessing = false;
let disclaimerAccepted = false;

// Wait for page to load, then set everything up
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    setupEventListeners();
    checkDisclaimerStatus();
    loadWelcomeMessage();
    loadLegalFeatures();
    
    // Debug stuff - can remove later
    console.log('acceptDisclaimerBtn found:', !!acceptDisclaimerBtn);
    console.log('disclaimerModal found:', !!disclaimerModal);
});

// Get all the DOM elements we need
function initializeDOMElements() {
    messageInput = document.getElementById('messageInput');
    documentPaste = document.getElementById('documentPaste');
    sendBtn = document.getElementById('sendBtn');
    analyzeBtn = document.getElementById('analyzeBtn');
    clearBtn = document.getElementById('clearBtn');
    chatMessages = document.getElementById('chatMessages');
    loadingIndicator = document.getElementById('loadingIndicator');
    textTab = document.getElementById('textTab');
    documentTab = document.getElementById('documentTab');
    textInputSection = document.getElementById('textInputSection');
    documentInputSection = document.getElementById('documentInputSection');
    fileInput = document.getElementById('fileInput');
    uploadArea = document.getElementById('uploadArea');
    disclaimerModal = document.getElementById('disclaimerModal');
    acceptDisclaimerBtn = document.getElementById('acceptDisclaimerBtn');
}

// Check if user already accepted the disclaimer
function checkDisclaimerStatus() {
    if (!disclaimerModal) {
        console.error('disclaimerModal not found');
        return;
    }
    
    const accepted = localStorage.getItem('legalease_disclaimer_accepted');
    if (accepted === 'true') {
        disclaimerAccepted = true;
        enableApplication();
        disclaimerModal.style.display = 'none';
    } else {
        // Show mandatory disclaimer modal
        disclaimerModal.style.display = 'block';
        disclaimerModal.classList.add('mandatory-disclaimer');
        disableApplication();
    }
}

// Enable everything after disclaimer is accepted
function enableApplication() {
    disclaimerAccepted = true;
    
    // Ensure elements are initialized
    if (!messageInput) messageInput = document.getElementById('messageInput');
    if (!documentPaste) documentPaste = document.getElementById('documentPaste');
    if (!sendBtn) sendBtn = document.getElementById('sendBtn');
    if (!analyzeBtn) analyzeBtn = document.getElementById('analyzeBtn');
    if (!clearBtn) clearBtn = document.getElementById('clearBtn');
    if (!textTab) textTab = document.getElementById('textTab');
    if (!documentTab) documentTab = document.getElementById('documentTab');
    if (!fileInput) fileInput = document.getElementById('fileInput');
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = 'Ask a legal question or paste legal text here...';
    }
    
    if (documentPaste) {
        documentPaste.disabled = false;
        documentPaste.placeholder = 'Or paste document text here...';
    }
    
    if (sendBtn) sendBtn.disabled = false;
    if (analyzeBtn) analyzeBtn.disabled = false;
    if (clearBtn) clearBtn.disabled = false;
    if (textTab) textTab.disabled = false;
    if (documentTab) documentTab.disabled = false;
    if (fileInput) fileInput.disabled = false;
    
    // Load legal features once disclaimer is accepted
    loadLegalFeatures();
}

// Disable everything until disclaimer is accepted
function disableApplication() {
    disclaimerAccepted = false;
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'Please accept the disclaimer first to use LegalEase...';
    }
    
    if (documentPaste) {
        documentPaste.disabled = true;
        documentPaste.placeholder = 'Please accept the disclaimer first to use LegalEase...';
    }
    
    if (sendBtn) sendBtn.disabled = true;
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
    if (textTab) textTab.disabled = true;
    if (documentTab) documentTab.disabled = true;
    if (fileInput) fileInput.disabled = true;
}

// Handle when user accepts the disclaimer
// Made it global so it works with onclick too
window.acceptDisclaimer = function acceptDisclaimer(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('Disclaimer acceptance clicked');
    
    // Get elements if not already defined
    if (!disclaimerModal) {
        disclaimerModal = document.getElementById('disclaimerModal');
    }
    
    if (!disclaimerModal) {
        console.error('disclaimerModal not found');
        alert('Error: Could not find disclaimer modal. Please refresh the page.');
        return false;
    }
    
    try {
        // Save acceptance to localStorage
        localStorage.setItem('legalease_disclaimer_accepted', 'true');
        disclaimerAccepted = true;
        
        // Enable all application features
        enableApplication();
        
        // Hide modal
        disclaimerModal.style.display = 'none';
        disclaimerModal.classList.remove('mandatory-disclaimer');
        
        console.log('Disclaimer accepted, application enabled');
        
        // Show welcome message if it doesn't exist
        const welcomeMsg = document.querySelector('.welcome-message');
        if (!welcomeMsg) {
            if (chatMessages) {
                loadWelcomeMessage();
            }
        }
        
        return false; // Prevent any default behavior
    } catch (error) {
        console.error('Error accepting disclaimer:', error);
        alert('There was an error accepting the disclaimer. Please refresh the page and try again.');
        return false;
    }
};

// Set up all the event listeners
function setupEventListeners() {
    // Disclaimer button - had some issues with this, so added fallbacks
    if (acceptDisclaimerBtn) {
        acceptDisclaimerBtn.addEventListener('click', acceptDisclaimer);
        acceptDisclaimerBtn.onclick = acceptDisclaimer; // fallback
    } else {
        console.error('acceptDisclaimerBtn not found, using event delegation');
        // Try event delegation as backup
        if (disclaimerModal) {
            disclaimerModal.addEventListener('click', (e) => {
                if (e.target && e.target.id === 'acceptDisclaimerBtn') {
                    acceptDisclaimer();
                }
            });
        }
    }
    
    // Set up other listeners
    setupLegalFeaturesListeners();
    
    // Send button click
    sendBtn.addEventListener('click', () => {
        if (disclaimerAccepted) {
            handleTextSend();
        }
    });
    
    // Enter key to send (but not Shift+Enter)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && disclaimerAccepted) {
            e.preventDefault();
            handleTextSend();
        }
    });

    // Analyze button
    analyzeBtn.addEventListener('click', () => {
        if (disclaimerAccepted) {
            handleDocumentAnalyze();
        }
    });
    
    // Ctrl+Enter to analyze document
    documentPaste.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey && disclaimerAccepted) {
            e.preventDefault();
            handleDocumentAnalyze();
        }
    });

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (disclaimerAccepted) {
                handleClearConversation();
            }
        });
    }
    
    // Clear confirmation modal
    setupClearConfirmModal();

    // Tab buttons
    textTab.addEventListener('click', () => {
        if (disclaimerAccepted) {
            switchTab('text');
        }
    });
    
    documentTab.addEventListener('click', () => {
        if (disclaimerAccepted) {
            switchTab('document');
        }
    });

    // File upload stuff
    uploadArea.addEventListener('click', () => {
        if (disclaimerAccepted) {
            fileInput.click();
        }
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        if (disclaimerAccepted) {
            handleDragOver(e);
        }
    });
    
    uploadArea.addEventListener('drop', (e) => {
        if (disclaimerAccepted) {
            handleDrop(e);
        }
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        if (disclaimerAccepted) {
            handleDragLeave(e);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (disclaimerAccepted) {
            handleFileSelect();
        }
    });
}

// Switch between text and document tabs
function switchTab(tab) {
    if (tab === 'text') {
        textTab.classList.add('active');
        documentTab.classList.remove('active');
        textInputSection.classList.add('active');
        documentInputSection.classList.remove('active');
        messageInput.focus();
    } else {
        documentTab.classList.add('active');
        textTab.classList.remove('active');
        documentInputSection.classList.add('active');
        textInputSection.classList.remove('active');
        documentPaste.focus();
    }
}

// Send a text message
async function handleTextSend() {
    if (!disclaimerAccepted) {
        alert('Please accept the disclaimer first.');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;

    await sendMessage(message, false);
    messageInput.value = '';
    messageInput.focus();
}

// Analyze a document
async function handleDocumentAnalyze() {
    if (!disclaimerAccepted) {
        alert('Please accept the disclaimer first.');
        return;
    }
    
    const documentText = documentPaste.value.trim();
    if (!documentText || isProcessing) {
        alert('Please paste or upload a document first.');
        return;
    }

    await sendMessage(documentText, true);
    documentPaste.value = '';
    fileInput.value = '';
}

// Send message to the backend
async function sendMessage(message, isDocument) {
    if (isProcessing) return;

    isProcessing = true;
    setLoading(true);

    // Remove welcome message if it's there
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // Show user's message
    addMessageToChat(message, 'user', isDocument);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                is_document: isDocument
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get response');
        }

        // Show the response
        addMessageToChat(data.message, 'assistant');

    } catch (error) {
        console.error('Error:', error);
        addMessageToChat(
            `Sorry, I encountered an error: ${error.message}. Please check that the Gemini API is configured correctly.`,
            'assistant'
        );
    } finally {
        setLoading(false);
        isProcessing = false;
    }
}

// Add a message to the chat
function addMessageToChat(content, role, isDocument = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (role === 'user') {
        if (isDocument) {
            contentDiv.innerHTML = `<strong>Document:</strong><br>${escapeHtml(content.substring(0, 200))}${content.length > 200 ? '...' : ''}`;
        } else {
            contentDiv.textContent = content;
        }
    } else {
        // Format the assistant's response
        contentDiv.innerHTML = formatResponse(content);
    }

    // Add timestamp
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    chatMessages.appendChild(messageDiv);

    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format the response text - convert markdown to HTML
function formatResponse(text) {
    // Escape HTML to prevent XSS
    let formatted = escapeHtml(text);

    // Add category badges if found
    formatted = extractAndFormatCategories(formatted);

    // Bold text **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Headings
    formatted = formatted.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h3>$1</h3>');

    // Numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>');

    // Bullet lists
    formatted = formatted.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Risk badges
    formatted = formatted.replace(
        /\b(Low|Medium|High)\s+Risk\b/gi,
        '<span class="risk-badge risk-$1">$1 Risk</span>'
    );

    return formatted;
}

// Find and format category badges in the text
function extractAndFormatCategories(text) {
    const categoryMap = {
        'contract': { name: 'Contract Law', class: 'category-contract', icon: '' },
        'contract law': { name: 'Contract Law', class: 'category-contract', icon: '' },
        'employment': { name: 'Employment Law', class: 'category-employment', icon: '' },
        'employment law': { name: 'Employment Law', class: 'category-employment', icon: '' },
        'intellectual property': { name: 'Intellectual Property', class: 'category-ip', icon: '' },
        'ip': { name: 'Intellectual Property', class: 'category-ip', icon: '' },
        'compliance': { name: 'Compliance', class: 'category-compliance', icon: '' },
        'litigation': { name: 'Litigation', class: 'category-litigation', icon: '' },
        'corporate': { name: 'Corporate Law', class: 'category-corporate', icon: '' },
        'corporate law': { name: 'Corporate Law', class: 'category-corporate', icon: '' },
        'privacy': { name: 'Privacy & Data', class: 'category-privacy', icon: '' },
        'privacy & data': { name: 'Privacy & Data', class: 'category-privacy', icon: '' },
        'real estate': { name: 'Real Estate', class: 'category-real_estate', icon: '' },
        'real estate law': { name: 'Real Estate', class: 'category-real_estate', icon: '' }
    };

    // Look for category mentions in the text
    let categoryBadges = '';
    const lowerText = text.toLowerCase();
    
    // Check for category tag section
    const categoryTagMatch = text.match(/CATEGORY\s+TAG[:\s]+(.+?)(?:\n|$)/i);
    if (categoryTagMatch) {
        const categoryText = categoryTagMatch[1].trim().toLowerCase();
        for (const [key, value] of Object.entries(categoryMap)) {
            if (categoryText.includes(key)) {
                categoryBadges = `<span class="legal-category-badge ${value.class}">${value.name}</span>`;
                // Remove the category tag line from the text
                text = text.replace(/CATEGORY\s+TAG[:\s]+.+?(?:\n|$)/i, '');
                break;
            }
        }
    } else {
        // Try to detect category from content
        for (const [key, value] of Object.entries(categoryMap)) {
            if (lowerText.includes(key) && (lowerText.includes('agreement') || lowerText.includes('contract') || lowerText.includes('legal'))) {
                categoryBadges = `<span class="legal-category-badge ${value.class}">${value.name}</span>`;
                break;
            }
        }
    }

    // Prepend category badges if found
    if (categoryBadges) {
        text = categoryBadges + '<br><br>' + text;
    }

    return text;
}

// Escape HTML - security thing
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Set up the clear confirmation modal
function setupClearConfirmModal() {
    const clearConfirmBtn = document.getElementById('clearConfirmBtn');
    const clearCancelBtn = document.getElementById('clearCancelBtn');
    const clearConfirmModal = document.getElementById('clearConfirmModal');
    
    if (clearConfirmBtn) {
        clearConfirmBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Yes button clicked (addEventListener)');
            confirmClearConversation();
            return false;
        });
        console.log('Yes button event listener added');
    } else {
        console.error('clearConfirmBtn not found');
    }
    
    if (clearCancelBtn) {
        clearCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('No button clicked (addEventListener)');
            hideClearConfirmModal();
            return false;
        });
        console.log('No button event listener added');
    } else {
        console.error('clearCancelBtn not found');
    }
    
    // Close modal when clicking outside
    if (clearConfirmModal) {
        clearConfirmModal.addEventListener('click', (e) => {
            if (e.target === clearConfirmModal) {
                hideClearConfirmModal();
            }
        });
    } else {
        console.error('clearConfirmModal not found');
    }
}

// Show the clear confirmation dialog
function showClearConfirmModal() {
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.style.display = 'block';
        modal.style.zIndex = '2500';
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        console.log('Clear confirm modal displayed');
    } else {
        console.error('clearConfirmModal not found in DOM');
        // Fallback to browser confirm if modal doesn't exist
        if (confirm('Do you want to clear the conversation?')) {
            confirmClearConversation();
        }
    }
}

// Hide the clear confirmation dialog
function hideClearConfirmModal() {
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.style.display = 'none';
        // Restore body scroll
        document.body.style.overflow = '';
        console.log('Clear confirm modal hidden');
    }
}

// Make it global for onclick
window.hideClearConfirmModal = hideClearConfirmModal;

// Actually clear the conversation
async function confirmClearConversation() {
    console.log('confirmClearConversation called');
    hideClearConfirmModal();
    
    try {
        const response = await fetch('/api/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Conversation cleared:', data);

        if (chatMessages) {
            chatMessages.innerHTML = '';
            loadWelcomeMessage();
        } else {
            console.error('chatMessages element not found');
            // Try to find it again
            chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
                loadWelcomeMessage();
            }
        }
    } catch (error) {
        console.error('Error clearing conversation:', error);
        alert('Failed to clear conversation: ' + error.message);
    }
}

// Make it global
window.confirmClearConversation = confirmClearConversation;

// Show confirmation before clearing
function handleClearConversation() {
    console.log('handleClearConversation called');
    showClearConfirmModal();
}

// Show or hide the loading spinner
function setLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
        sendBtn.disabled = true;
        analyzeBtn.disabled = true;
    } else {
        loadingIndicator.classList.add('hidden');
        sendBtn.disabled = false;
        analyzeBtn.disabled = false;
    }
}

// Load welcome message if chat is empty
function loadWelcomeMessage() {
    // Welcome message is already in HTML, just ensure it's visible
    const welcomeMsg = document.querySelector('.welcome-message');
    if (!welcomeMsg && chatMessages.children.length === 0) {
        // Welcome message should be in initial HTML
    }
}

// File upload stuff
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-color)';
    uploadArea.style.background = 'rgba(37, 99, 235, 0.1)';
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'var(--background)';
}

function handleDrop(e) {
    e.preventDefault();
    handleDragLeave(e);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (!disclaimerAccepted) {
        alert('Please accept the disclaimer first.');
        return;
    }
    
    const files = e ? e.target.files : fileInput.files;
    if (files && files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    if (!disclaimerAccepted) {
        alert('Please accept the disclaimer first.');
        return;
    }
    
    if (!file.type.match(/text.*/) && !file.name.match(/\.(txt|doc|docx|pdf)$/i)) {
        alert('Please upload a text file, Word document, or PDF.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        documentPaste.value = content;
        switchTab('document');
    };
    reader.readAsText(file);
}

// Close disclaimer - not actually used since it's mandatory
function closeDisclaimer() {
    // Can't close it without accepting, but keeping this for compatibility
}

// Show a toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Fallback to alert if container doesn't exist
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : '!';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Load templates and glossary
async function loadLegalFeatures() {
    if (!disclaimerAccepted) return;
    
    try {
        await Promise.all([
            loadTemplates(),
            loadGlossary()
        ]);
    } catch (error) {
        console.error('Error loading legal features:', error);
    }
}

// Load the document templates
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        const templateList = document.getElementById('templateList');
        if (!templateList) return;
        
        templateList.innerHTML = '';
        
        Object.entries(data.templates).forEach(([id, template]) => {
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.innerHTML = `
                <div class="template-item-name">${escapeHtml(template.name)}</div>
                <div class="template-item-category">${escapeHtml(template.category)}</div>
            `;
            templateItem.addEventListener('click', () => openTemplate(id));
            templateList.appendChild(templateItem);
        });
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Load the glossary terms
async function loadGlossary() {
    try {
        const response = await fetch('/api/glossary');
        const data = await response.json();
        
        const glossaryList = document.getElementById('glossaryList');
        if (!glossaryList) return;
        
        // Store glossary for search
        window.glossaryData = data.glossary;
        
        renderGlossary(data.glossary);
        
        // Setup search
        const glossarySearch = document.getElementById('glossarySearch');
        if (glossarySearch) {
            glossarySearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filtered = Object.entries(data.glossary).filter(([id, term]) => {
                    return term.term.toLowerCase().includes(searchTerm) ||
                           term.definition.toLowerCase().includes(searchTerm);
                });
                renderGlossary(Object.fromEntries(filtered));
            });
        }
    } catch (error) {
        console.error('Error loading glossary:', error);
    }
}

// Render glossary items to the page
function renderGlossary(glossary) {
    const glossaryList = document.getElementById('glossaryList');
    if (!glossaryList) return;
    
    glossaryList.innerHTML = '';
    
    Object.entries(glossary).forEach(([id, term]) => {
        const glossaryItem = document.createElement('div');
        glossaryItem.className = 'glossary-item';
        glossaryItem.innerHTML = `
            <div class="glossary-item-term">${escapeHtml(term.term)}</div>
            <div class="glossary-item-definition">${escapeHtml(term.definition)}</div>
        `;
        glossaryItem.addEventListener('click', () => openGlossaryTerm(id));
        glossaryList.appendChild(glossaryItem);
    });
}

// Open a template in a modal
async function openTemplate(templateId) {
    try {
        const response = await fetch(`/api/templates/${templateId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Template not found');
        }
        
        const modal = document.getElementById('templateModal');
        const title = document.getElementById('templateModalTitle');
        const category = document.getElementById('templateCategory');
        const description = document.getElementById('templateDescription');
        const content = document.getElementById('templateContent');
        
        if (modal && title && category && description && content) {
            title.textContent = data.template.name;
            category.textContent = data.template.category;
            description.textContent = data.template.description;
            content.value = data.template.template;
            
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error opening template:', error);
        alert('Error loading template: ' + error.message);
    }
}

// Open a glossary term in a modal
async function openGlossaryTerm(termId) {
    try {
        const response = await fetch(`/api/glossary/${termId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Term not found');
        }
        
        const modal = document.getElementById('glossaryModal');
        const title = document.getElementById('glossaryModalTitle');
        const definition = document.getElementById('termDefinition');
        const example = document.getElementById('termExample');
        
        if (modal && title && definition && example) {
            const term = data.term_data;
            title.textContent = term.term;
            definition.innerHTML = `<strong>Definition:</strong><br>${escapeHtml(term.definition)}`;
            example.innerHTML = `<strong>Example:</strong><br>${escapeHtml(term.example)}`;
            
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error opening glossary term:', error);
        alert('Error loading term: ' + error.message);
    }
}

// Open the citation formatter modal
function openCitationModal() {
    const modal = document.getElementById('citationModal');
    const input = document.getElementById('citationInput');
    const result = document.getElementById('citationResult');
    
    if (modal && input && result) {
        input.value = '';
        result.classList.add('hidden');
        modal.style.display = 'block';
        input.focus();
    }
}

// Format a citation using the API
async function formatCitation() {
    const input = document.getElementById('citationInput');
    const result = document.getElementById('citationResult');
    
    if (!input || !result) return;
    
    const citationText = input.value.trim();
    if (!citationText) {
        alert('Please enter a citation to format.');
        return;
    }
    
    try {
        result.classList.remove('hidden');
        result.innerHTML = '<div class="spinner"></div> <p>Formatting citation...</p>';
        
        const response = await fetch('/api/cite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ citation: citationText })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to format citation');
        }
        
        result.innerHTML = `
            <h3>Formatted Citation</h3>
            <div class="citation-formatted">${escapeHtml(data.formatted)}</div>
            <div class="citation-meta">
                <strong>Original:</strong> ${escapeHtml(data.original)}
            </div>
        `;
    } catch (error) {
        console.error('Error formatting citation:', error);
        result.innerHTML = `
            <div style="color: var(--danger);">
                <strong>Error:</strong> ${escapeHtml(error.message)}
            </div>
        `;
    }
}

// Set up listeners for sidebar and legal features
function setupLegalFeaturesListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Quick action buttons - using event delegation
    document.addEventListener('click', (e) => {
        if (e.target.closest('.quick-action-btn')) {
            const btn = e.target.closest('.quick-action-btn');
            const action = btn.dataset.action;
            if (action) {
                handleQuickAction(action);
            }
        }
    });
    
    // Template modal close button
    const closeTemplateModal = document.getElementById('closeTemplateModal');
    const templateModal = document.getElementById('templateModal');
    const copyTemplateBtn = document.getElementById('copyTemplateBtn');
    
    if (closeTemplateModal && templateModal) {
        closeTemplateModal.addEventListener('click', () => {
            templateModal.style.display = 'none';
        });
    }
    
    // Copy template button
    if (copyTemplateBtn) {
        copyTemplateBtn.addEventListener('click', async () => {
            const content = document.getElementById('templateContent');
            if (content) {
                try {
                    // Try the modern clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(content.value);
                        showToast('Template copied to clipboard!', 'success');
                    } else if (document.execCommand) {
                        // Old browser fallback
                        content.select();
                        content.setSelectionRange(0, 99999); // mobile fix
                        const successful = document.execCommand('copy');
                        if (successful) {
                            showToast('Template copied to clipboard!', 'success');
                        } else {
                            showToast('Failed to copy template. Please select and copy manually.', 'error');
                        }
                    } else {
                        showToast('Copying not supported. Please select and copy manually.', 'warning');
                    }
                } catch (err) {
                    console.error('Failed to copy:', err);
                    showToast('Failed to copy template. Please select and copy manually.', 'error');
                }
            }
        });
    }
    
    // Glossary modal
    const closeGlossaryModal = document.getElementById('closeGlossaryModal');
    const glossaryModal = document.getElementById('glossaryModal');
    
    if (closeGlossaryModal && glossaryModal) {
        closeGlossaryModal.addEventListener('click', () => {
            glossaryModal.style.display = 'none';
        });
    }
    
    // Citation modal
    const closeCitationModal = document.getElementById('closeCitationModal');
    const citationModal = document.getElementById('citationModal');
    const formatCitationBtn = document.getElementById('formatCitationBtn');
    
    if (closeCitationModal && citationModal) {
        closeCitationModal.addEventListener('click', () => {
            citationModal.style.display = 'none';
        });
    }
    
    if (formatCitationBtn) {
        formatCitationBtn.addEventListener('click', formatCitation);
    }
    
    // Close modals when clicking outside
    const modals = [templateModal, glossaryModal, citationModal].filter(Boolean);
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Handle quick action button clicks
function handleQuickAction(action) {
    switch(action) {
        case 'template-nda':
            openTemplate('nda');
            break;
        case 'template-employment':
            openTemplate('employment_contract');
            break;
        case 'template-privacy':
            openTemplate('privacy_policy');
            break;
        case 'template-service':
            openTemplate('service_agreement');
            break;
        case 'glossary':
            // Scroll to glossary section or open first term
            const glossarySection = document.querySelector('.sidebar-section:last-child');
            if (glossarySection) {
                glossarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const glossarySearch = document.getElementById('glossarySearch');
                if (glossarySearch) {
                    setTimeout(() => glossarySearch.focus(), 500);
                }
            }
            break;
        case 'cite':
            openCitationModal();
            break;
        default:
            console.log('Unknown action:', action);
    }
}
