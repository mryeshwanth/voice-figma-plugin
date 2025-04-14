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

## 🚀 Setup

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/figma-transcription-plugin.git
cd figma-transcription-plugin
npm install

2. Test Locally
bash
Copy
Edit
node server.js
# Server will run on http://localhost:8080
Your browser window (opened by the plugin) should point to:

bash
Copy
Edit
http://localhost:8080/public/transcription.html?session=someToken


🧩 Load Plugin in Figma
Open Figma → Plugins → Development → New Plugin...

Choose "Link existing manifest.json"

Browse to manifest.json inside this repo

Launch the plugin → it will open the new multi-step popup

🌐 Browser Support
Browser Supported
Chrome  ✅ Yes
Safari  ✅ Partial
Edge (latest) ⚠️ Partial
Opera ✅ Yes
Brave ❌ No
Firefox ❌ No
Arc ❌ No
Internet Explorer ❌ No
🔐 Microphone Permissions
Make sure to allow mic access:

Mac:
System Settings → Privacy & Security → Microphone → Enable for your browser

Windows:
Settings → Privacy → Microphone → Allow access for apps and browsers

📌 Notes
All transcription happens locally in the browser

No audio is stored or sent to servers

Works across both Figma Desktop and Browser

🙌 Credits
Made with ❤️ for the Figma community.
Voice recognition powered by the Web Speech API.

📃 License
MIT

yaml
Copy
Edit

---

Let me know if you'd like me to customize the GitHub repo link or project name!