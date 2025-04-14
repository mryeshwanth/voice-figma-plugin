// code.js
figma.showUI(__html__, { width: 480, height: 420 });

function checkSelection() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && selection[0].type === 'TEXT') {
    figma.ui.postMessage({ type: 'selection-valid' });
  } else {
    figma.ui.postMessage({ type: 'selection-invalid' });
  }
}

const isDev = false;
const BASE_URL = isDev
  ? 'http://localhost:8080'
  : 'https://voice-figma-plugin-production.up.railway.app';

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'mode-new') {
    await figma.clientStorage.setAsync('transcription-mode', 'new');
    await figma.clientStorage.setAsync('transcription-session', { token: msg.session });
  }

  if (msg.type === 'check-selection') {
    await figma.clientStorage.setAsync('transcription-mode', 'existing');
    await figma.clientStorage.setAsync('transcription-session', { token: msg.session });
    checkSelection();
  }

  if (msg.type === 'open-transcription-tool') {
    const sessionData = await figma.clientStorage.getAsync('transcription-session');
    if (!sessionData || !sessionData.token) {
      figma.ui.postMessage({ type: 'browser-open-error', error: 'Session token missing' });
      return;
    }

    const sessionToken = sessionData.token;

    figma.ui.postMessage({ type: 'opening-browser' });
    await figma.openExternal(`${BASE_URL}/web/transcription.html?session=${sessionToken}`);

    // Start polling every 5s to check for transcription
    startPollingForTranscription(sessionToken);
  }

  if (msg.type === 'check-for-transcription') {
    const sessionData = await figma.clientStorage.getAsync('transcription-session');
    const mode = await figma.clientStorage.getAsync('transcription-mode');

    if (!sessionData || !sessionData.token) {
      figma.ui.postMessage({ type: 'no-transcription-found' });
      return;
    }

    const sessionToken = sessionData.token;

    try {
      const response = await fetch(`${BASE_URL}/api/get-transcription?session=${sessionToken}`);
      if (!response.ok) {
        figma.ui.postMessage({ type: 'no-transcription-found' });
        return;
      }

      const data = await response.json();
      if (!data || !data.text) {
        figma.ui.postMessage({ type: 'no-transcription-found' });
        return;
      }

      const font = { family: "Inter", style: "Regular" };

      if (mode === 'existing') {
        const selected = figma.currentPage.selection;
        if (selected.length !== 1 || selected[0].type !== 'TEXT') {
          figma.ui.postMessage({ type: 'selection-invalid' });
          return;
        }

        const node = selected[0];
        await figma.loadFontAsync(font);
        node.characters = data.text;
      } else {
        const newNode = figma.createText();
        await figma.loadFontAsync(font);
        newNode.characters = data.text;
        newNode.x = figma.viewport.center.x;
        newNode.y = figma.viewport.center.y;
        figma.currentPage.appendChild(newNode);
        figma.currentPage.selection = [newNode];
        figma.viewport.scrollAndZoomIntoView([newNode]);
      }

      figma.ui.postMessage({ type: 'transcription-received' });
    } catch (err) {
      console.error('Fetch error:', err);
      figma.ui.postMessage({
        type: 'transcription-check-error',
        error: err.message || 'Unknown error'
      });
    }
  }
};

let pollingInterval = null;

function startPollingForTranscription(sessionToken) {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(() => {
    figma.ui.postMessage({ type: 'check-for-transcription' });
  }, 3000); // every 3 seconds
}
