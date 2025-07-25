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

---

```
## 🗂️ File Structure

voice-figma-plugin/
│
├── README.md                 # Overview, setup, usage
├── CONTRIBUTING.md           # Contribution guidelines (see below)
├── .gitignore                # Node + web ignores
├── package.json              # Server dependencies + scripts
│── server.js                 # Main API server
│── package-lock.json         # (Generated) JSON session storage
│
├── web/                      # Transcription tool (runs in browser)
│   ├── transcription.html    # Speech input, real-time view, Figma redirect
│   └── styles.css            # Optional: for styling transcription.html
│
├── plugin/                   # Figma Plugin
│   ├── code.js               # Plugin logic (Figma backend)
│   ├── ui.html               # Multi-step popup interface
│   ├── manifest.json         # Plugin definition
│   └── popup.html            # Embedded popup for voice mode selection


🚀 Setup

1. Clone & Install

git clone https://github.com/mryeshwanth/voice-figma-plugin.git
cd voice-figma-plugin
npm install

2. Test Locally

node server.js
# Server will run on http://localhost:8080
Your browser window (opened by the plugin) should point to:
http://localhost:8080/web/transcription.html?session=someToken


🧩 Load Plugin in Figma (Desktop/Mac App)
- Open Figma → Plugins → Development → New Plugin...
- Choose "Link existing manifest.json"
- Browse to manifest.json inside this repo
- Launch the plugin → it will open the new multi-step popup

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
Mac: System Settings → Privacy & Security → Microphone → Enable for your browser
Windows: Settings → Privacy → Microphone → Allow access for apps and browsers

📌 Notes
- All transcription happens locally in the browser
- No audio is stored or sent to servers
- Works across both Figma Desktop and Browser

🙌 Credits
Made with ❤️ for the Figma community.
Voice recognition powered by the Web Speech API.

🤝 Contributing

I welcome contributions! Here's the standard workflow for submitting changes:

1. **Fork the repository**  
2. **Create a new branch** for your feature or bugfix  
   ```
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and ensure everything works as expected  
4. **Commit with clear messages**  
   ```
   git commit -m "Add: [short description of your change]"
   ```
5. **Push to your branch**  
   ```
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request (PR)** on GitHub  
   - Include a short description of the change
   - Link any related issues if applicable

✅ Follow any feedback or requested changes during review.

🧪 Tip: Please test your updates locally using:
```
node server.js
# Then visit http://localhost:8080/web/transcription.html?session=test
```


📃 License
MIT

Security Policy

Data Privacy: This plugin **does not collect, store, or transmit any user data, voice recordings, or personal information** to any external service. All speech recognition is done **locally in your browser** using the native Web Speech API.

Network Access: The plugin connects only to the developer’s hosted instance for sending transcribed text. It does **not transmit any data derived from the Figma API** or access external APIs beyond that.

Reporting a Vulnerability: If you discover a security issue or privacy concern, please open an issue on the GitHub repository or email the maintainer directly.
