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

// Handle Messages from UI
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
    figma.ui.postMessage({ type: 'opening-browser' });
    await figma.openExternal(`http://localhost:8080/web/transcription.html?session=${msg.session}`);
  }

  if (msg.type === 'check-for-transcription') {
    try {
      const sessionData = await figma.clientStorage.getAsync('transcription-session');
      const mode = await figma.clientStorage.getAsync('transcription-mode');

      if (!sessionData || !sessionData.token) {
        figma.ui.postMessage({ type: 'no-transcription-found' });
        return;
      }

      const response = await fetch(`http://localhost:8080/api/get-transcription?session=${sessionData.token}`);
      if (!response.ok) return;

      const data = await response.json();
      if (!data || !data.text) {
        figma.ui.postMessage({ type: 'no-transcription-found' });
        return;
      }

      // Insert text
      if (mode === 'existing') {
        const selected = figma.currentPage.selection;
        if (selected.length !== 1 || selected[0].type !== 'TEXT') {
          figma.ui.postMessage({ type: 'selection-invalid' });
          return;
        }

        const node = selected[0];
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        node.characters = data.text;
      } else {
        const newNode = figma.createText();
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        newNode.characters = data.text;
        newNode.x = figma.viewport.center.x;
        newNode.y = figma.viewport.center.y;
        figma.currentPage.appendChild(newNode);
        figma.currentPage.selection = [newNode];
        figma.viewport.scrollAndZoomIntoView([newNode]);
      }

      figma.ui.postMessage({ type: 'transcription-received' });
    } catch (err) {
      figma.ui.postMessage({ type: 'transcription-check-error', error: err.message });
    }
  }
};
