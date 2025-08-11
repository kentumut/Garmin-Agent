# 🤖 Jarvis AI - Enterprise Voice Assistant

A modern, enterprise-level Electron application with React frontend that provides intelligent voice-to-text transcription using AI. Features a beautiful spotlight-like interface with Apple system fonts and automatic backend management.

## ✨ Features

- **🎙️ Advanced Voice Recording**: Smart voice activity detection with automatic silence detection
- **🧠 AI Transcription**: Powered by Faster Whisper for accurate speech-to-text conversion
- **💫 Modern UI**: Spotlight-inspired interface with glass morphism and smooth animations
- **🚀 Auto Backend**: Automatically spawns and manages Python backend process
- **⚡ Global Hotkey**: `⌘⌥Space` (Cmd+Alt+Space) for instant activation
- **🔄 Real-time Audio**: Live audio level visualization during recording
- **📱 Responsive**: Works beautifully on different screen sizes
- **🛡️ Secure**: Context isolation and secure IPC communication
- **📦 Self-contained**: Includes packaged Python backend binary

## 🏗️ Architecture

```
jarvis-ai/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Secure IPC bridge
│   └── renderer/       # React frontend
├── backend/
│   ├── app/
│   │   ├── api/        # FastAPI routes
│   │   ├── services/   # Business logic
│   │   └── config.py   # Configuration
│   └── server.py       # Entry point
├── scripts/            # Build scripts
└── docs/              # Documentation
```

## 🚀 Quick Start

### Development

1. **Install Dependencies**
   ```bash
   cd jarvis-ai
   npm install
   ```

2. **Install Python Dependencies**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

3. **Start Development**
   ```bash
   cd ../jarvis-ai
   npm run dev
   ```

### Production Build

1. **Build Everything**
   ```bash
   npm run build
   ```

2. **Package Application**
   ```bash
   npm run package:mac  # For macOS
   npm run package:win  # For Windows
   npm run package:linux # For Linux
   ```

## 🎯 Usage

1. **Activate**: Press `⌘⌥Space` anywhere on your system
2. **Speak**: The app will automatically start recording when you speak
3. **Wait**: It stops recording after detecting silence
4. **Read**: Your transcribed text appears instantly
5. **Done**: The window auto-hides after showing results

## ⚙️ Configuration

### Backend Settings (Environment Variables)

```bash
# Model Configuration
WHISPER_MODEL_SIZE=base        # tiny, base, small, medium, large
WHISPER_DEVICE=cpu             # cpu, cuda, auto
WHISPER_COMPUTE_TYPE=int8      # int8, int16, float16, float32

# Server Configuration
HOST=127.0.0.1
PORT=8000                      # Use 0 for auto-discovery
LOG_LEVEL=INFO

# Audio Processing
VAD_FILTER=true               # Voice activity detection
BEAM_SIZE=3                   # Transcription beam size
TEMPERATURE=0.0               # Randomness (0.0 = deterministic)

# File Upload
MAX_FILE_SIZE=10485760        # 10MB limit
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Build for production
- `npm run package` - Create distributable packages
- `npm run test` - Run tests
- `npm run lint` - Check code quality
- `npm run format` - Format code with Prettier

### Tech Stack

**Frontend:**
- Electron 28+ with security best practices
- React 18 with TypeScript
- Vite for fast development and building
- Modern CSS with glass morphism effects

**Backend:**
- FastAPI with async/await
- Faster Whisper for AI transcription
- PyInstaller for binary packaging
- Comprehensive error handling and logging

## 📱 Keyboard Shortcuts

- `⌘⌥Space` (macOS) / `Ctrl+Alt+Space` (Windows/Linux) - Activate Jarvis
- `Escape` - Hide window
- `⌘Q` (macOS) / `Ctrl+Q` (Windows/Linux) - Quit application

## 🔒 Security

- **Context Isolation**: Renderer process is sandboxed
- **No Node Integration**: Prevents code injection
- **Secure IPC**: All communication through controlled channels
- **CORS Protection**: Backend configured for secure cross-origin requests

## 🐛 Troubleshooting

### Common Issues

**Backend not starting:**
- Ensure Python dependencies are installed
- Check that port 8000 (or specified port) is available
- Verify PyInstaller binary is built correctly

**Recording not working:**
- Grant microphone permissions to the app
- Check system audio settings
- Ensure no other apps are using the microphone

**Poor transcription quality:**
- Try a larger Whisper model (`small`, `medium`, `large`)
- Ensure clear audio input
- Check microphone quality and positioning

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check existing [GitHub Issues](../../issues)
- Create a new issue with detailed information
- Include logs and system information

---

Made with ❤️ using Electron, React, and AI
