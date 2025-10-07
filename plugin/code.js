// Figma Voice Transcription Plugin - With Enhanced Accessibility
// Main JavaScript code - Aligns with popup.html workflow

// Global variables
let sessionToken = null;
let serverUrl = 'https://your-project.vercel.app'; // IMPORTANT: Replace with your actual Vercel deployment URL
let pollInterval = null;
let textInsertMode = 'new'; // 'new' or 'existing'
let selectedTextNode = null;
let lastOperationStatus = null; // Track operation status for announcements

// Initialize the plugin when Figma launches it
figma.showUI(__html__, { 
  width: 400, 
  height: 480,
  // Added visibility accessibility setting
  themeColors: true // Ensures UI respects Figma's theme for better contrast
});

// Accessibility constants for consistent messaging
const ACCESSIBILITY_MESSAGES = {
  SELECTION_VALID: (name) => `Selected text layer "${name}" is valid and ready for transcription.`,
  SELECTION_INVALID: 'No valid text layer selected. Please select a single text layer.',
  TRANSCRIPTION_RECEIVED: 'Voice transcription successfully added to your Figma document.',
  TRANSCRIPTION_NOT_FOUND: 'No transcription found yet. Still waiting.',
  TEXT_INSERTION_ERROR: (msg) => `Error inserting text: ${msg}. Please try again.`,
  BROWSER_OPENING: 'Opening transcription tool in your browser. Please allow microphone access when prompted.',
  NO_SESSION: 'Session information is missing. Please restart the plugin.',
  SERVER_ERROR: (status) => `Server returned an error: ${status}.`
};

// Main entry point for the plugin with improved error handling and accessibility
figma.ui.onmessage = async (msg) => {
  if (!msg || !msg.type) return;
  
  try {
    switch (msg.type) {
      case 'mode-new':
        // User wants to create a new text node
        textInsertMode = 'new';
        sessionToken = msg.session;
        lastOperationStatus = 'New text node mode selected';
        break;
        
      case 'check-selection':
        // User wants to update existing text
        sessionToken = msg.session;
        checkTextSelection();
        break;
        
      case 'open-transcription-tool':
        // Open the transcription tool in a new browser window
        openTranscriptionTool(msg.session);
        break;
        
      case 'check-for-transcription':
        // Check if transcription is available
        checkForTranscription();
        break;

      case 'read-status':
        // Send last operation status to UI for screen reader announcement
        if (lastOperationStatus) {
          figma.ui.postMessage({ 
            type: 'status-update', 
            message: lastOperationStatus 
          });
        }
        break;
        
      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    lastOperationStatus = `Error: ${error.message || 'An unknown error occurred'}`;
    figma.ui.postMessage({ 
      type: 'error', 
      error: error.message || 'An unknown error occurred' 
    });
  }
};

// Enhanced text selection check with better feedback
function checkTextSelection() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 1 && selection[0].type === 'TEXT') {
    const textNode = selection[0];
    selectedTextNode = textNode.id;
    
    // Store operation status for screen readers
    lastOperationStatus = ACCESSIBILITY_MESSAGES.SELECTION_VALID(textNode.name);
    
    // Notify UI that selection is valid with improved details
    figma.ui.postMessage({ 
      type: 'selection-valid',
      id: textNode.id,
      name: textNode.name,
      // Added accessibility properties
      accessibilityMessage: lastOperationStatus,
      fontSize: textNode.fontSize || 'default',
      textLength: textNode.characters.length
    });
    
    textInsertMode = 'existing';
    return true;
  } else {
    // Store operation status for screen readers
    lastOperationStatus = ACCESSIBILITY_MESSAGES.SELECTION_INVALID;
    
    // Notify UI that selection is invalid with accessibility message
    figma.ui.postMessage({ 
      type: 'selection-invalid',
      accessibilityMessage: lastOperationStatus
    });
    return false;
  }
}

// Enhanced browser opening with accessibility feedback
function openTranscriptionTool(session) {
  if (!session) {
    lastOperationStatus = ACCESSIBILITY_MESSAGES.NO_SESSION;
    figma.ui.postMessage({ 
      type: 'error',
      error: lastOperationStatus
    });
    return;
  }

  const url = `${serverUrl}/web/transcription.html?session=${session}`;
  
  // Store operation status for screen readers
  lastOperationStatus = ACCESSIBILITY_MESSAGES.BROWSER_OPENING;
  
  // Open URL in default browser with better accessibility messaging
  figma.ui.postMessage({ 
    type: 'opening-browser',
    accessibilityMessage: lastOperationStatus,
    // Include URL for display in UI but not for actual navigation
    url: url.split('?')[0] // Only send base URL without session token for security
  });
  
  figma.openExternal(url);
}

// Enhanced transcription checking with proper error handling and accessibility
// Fixed to avoid using AbortController
async function checkForTranscription() {
  try {
    if (!sessionToken) {
      console.error('No session token available');
      lastOperationStatus = ACCESSIBILITY_MESSAGES.NO_SESSION;
      figma.ui.postMessage({ 
        type: 'transcription-check-error',
        accessibilityMessage: lastOperationStatus 
      });
      return;
    }
    
    // Create a Promise with timeout to handle request timeouts
    // This avoids using AbortController which may not be available
    const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
      return new Promise((resolve, reject) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timed out. Server may be unavailable.'));
        }, timeout);
        
        // Start fetch
        fetch(url, options)
          .then(response => {
            clearTimeout(timeoutId);
            resolve(response);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    };
    
    try {
      const response = await fetchWithTimeout(
        `${serverUrl}/api/get-transcription?session=${sessionToken}`, 
        {}, 
        10000  // 10 second timeout
      );
      
      if (response.status === 404) {
        // No transcription found yet - not an error
        lastOperationStatus = ACCESSIBILITY_MESSAGES.TRANSCRIPTION_NOT_FOUND;
        figma.ui.postMessage({ 
          type: 'no-transcription-found',
          accessibilityMessage: lastOperationStatus
        });
        return;
      }
      
      if (!response.ok) {
        lastOperationStatus = ACCESSIBILITY_MESSAGES.SERVER_ERROR(response.status);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.text) {
        // Process the transcription text
        await insertTextToFigma(data.text);
      } else {
        lastOperationStatus = ACCESSIBILITY_MESSAGES.TRANSCRIPTION_NOT_FOUND;
        figma.ui.postMessage({ 
          type: 'no-transcription-found',
          accessibilityMessage: lastOperationStatus 
        });
      }
    } catch (fetchError) {
      throw fetchError;
    }
  } catch (error) {
    console.error('Error checking for transcription:', error);
    lastOperationStatus = `Error: ${error.message || 'Failed to check for transcription'}`;
    figma.ui.postMessage({ 
      type: 'transcription-check-error',
      error: error.message || 'Failed to check for transcription',
      accessibilityMessage: lastOperationStatus
    });
  }
}

// Enhanced text insertion with accessibility considerations
async function insertTextToFigma(transcriptionText) {
  try {
    if (!transcriptionText || transcriptionText.trim() === '') {
      throw new Error('No text to insert');
    }

    let targetTextNode;
    let isExistingNode = false;
    
    // Check if we're inserting into existing text or creating new
    if (textInsertMode === 'existing' && selectedTextNode) {
      // Find the target text node
      const textNodes = figma.currentPage.findAll(node => node.type === 'TEXT');
      targetTextNode = textNodes.find(node => node.id === selectedTextNode);
      
      if (!targetTextNode) {
        throw new Error('Selected text layer no longer exists');
      }
      
      isExistingNode = true;
    } else {
      // Create a new text node
      targetTextNode = figma.createText();
      
      // Position in the center of the viewport
      const centerX = figma.viewport.center.x;
      const centerY = figma.viewport.center.y;
      targetTextNode.x = centerX - (targetTextNode.width / 2);
      targetTextNode.y = centerY - (targetTextNode.height / 2);
      
      // Name the node in a more accessible way
      targetTextNode.name = 'Voice Transcription - ' + new Date().toLocaleString();
    }
    
    // Load font before setting text
    await figma.loadFontAsync(targetTextNode.fontName);
    
    // Store original text for accessibility messaging
    const originalText = targetTextNode.characters;
    const originalTextLength = originalText.length;
    
    // Set the text content
    targetTextNode.characters = transcriptionText;
    
    // Select the text node
    figma.currentPage.selection = [targetTextNode];
    
    // Zoom to the text node with proper padding for accessibility
    figma.viewport.scrollAndZoomIntoView([targetTextNode]);
    
    // Store detailed operation status for screen readers
    if (isExistingNode) {
      lastOperationStatus = `Updated existing text layer "${targetTextNode.name}" with ${transcriptionText.length} characters of transcribed text, replacing ${originalTextLength} characters.`;
    } else {
      lastOperationStatus = `Created new text layer "${targetTextNode.name}" with ${transcriptionText.length} characters of transcribed text.`;
    }
    
    // Notify UI of success with accessibility details
    figma.ui.postMessage({ 
      type: 'transcription-received',
      accessibilityMessage: lastOperationStatus,
      nodeId: targetTextNode.id,
      nodeName: targetTextNode.name,
      textLength: transcriptionText.length,
      isNewNode: !isExistingNode
    });
  } catch (error) {
    console.error('Error inserting text:', error);
    lastOperationStatus = ACCESSIBILITY_MESSAGES.TEXT_INSERTION_ERROR(error.message || 'unknown reason');
    figma.ui.postMessage({ 
      type: 'text-insertion-error',
      error: error.message || 'Failed to insert text',
      accessibilityMessage: lastOperationStatus
    });
  }
}

// Handle the 'start' command from the plugin menu
figma.command === 'start' && init();

// Enhanced initialization with accessibility improvements and error handling
async function init() {
  try {
    // Try to load server URL from client storage
    const savedUrl = await figma.clientStorage.getAsync('serverUrl').catch(() => null);
    if (savedUrl) {
      serverUrl = savedUrl;
    }
    console.log('Plugin initialized with server URL:', serverUrl);
    
    // Check if user has accessibility settings enabled in Figma
    const accessibilitySettings = await figma.clientStorage.getAsync('accessibilitySettings').catch(() => null);
    
    // Notify UI to show the initial view with accessibility information
    figma.ui.postMessage({ 
      type: 'plugin-initialized',
      serverUrl: serverUrl,
      accessibilitySettings: accessibilitySettings || {
        highContrast: false,
        reducedMotion: false,
        screenReader: false
      }
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    figma.ui.postMessage({ 
      type: 'initialization-error',
      error: error.message || 'Failed to initialize plugin'
    });
  }
}

// New function to save accessibility settings
async function saveAccessibilitySettings(settings) {
  if (!settings) return;
  
  try {
    await figma.clientStorage.setAsync('accessibilitySettings', settings);
    console.log('Accessibility settings saved:', settings);
  } catch (error) {
    console.error('Error saving accessibility settings:', error);
  }
}
