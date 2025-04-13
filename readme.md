# 🗣️ Figma Voice Transcription Plugin

This plugin allows users to transcribe their voice directly into selected Figma text layers using browser-based speech recognition.

## 🎯 Features

- Multi-step popup inside Figma:  
  - Choose to insert new text or update an existing one
  - Automatically opens a browser window for transcription
  - Inserts transcription text directly into selected layer
- Cross-browser support (Chrome, Safari, Opera, Edge*)  
- No paid APIs – uses the browser's built-in `SpeechRecognition` API
- Works on Figma Mac app & Figma browser
- Secure and session-based transcription
- Fully deployable with free hosting (via Railway + GitHub Pages)

---

## 🗂️ File Structure

figma-transcription-plugin/ 
│ ├── manifest.json # Figma plugin definition 
├── code.js # Plugin backend logic ├── ui.html # Multi-step Figma popup UI │ ├── public/ │ └── transcription.html # Browser-based voice recorder UI │ ├── server.js # Node/Express server to store & fetch transcriptions ├── package.json # Node dependencies for Railway deployment ├── render.yaml # (optional) Railway deployment config └── README.md