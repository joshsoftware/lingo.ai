# 🚀 Quick Start Guide - Lingo.ai

## Prerequisites
- macOS with Homebrew installed
- At least 8GB RAM (16GB recommended for AI models)
- At least 10GB free disk space

## One-Command Setup

Run the automated setup script:

```bash
./setup.sh
```

This will install all dependencies and set up the project automatically.

## Manual Setup (if you prefer step-by-step)

### 1. Install Dependencies
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install python@3.11 node ffmpeg postgresql@16
brew services start postgresql@16

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Set Up Environment
```bash
# Copy environment files
cp app/env.example app/.env
# Backend .env will be created by setup.sh

# Edit the environment files with your configuration
# (See SETUP_GUIDE.md for details)
```

### 3. Set Up Backend
```bash
cd service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
ollama run llama3.2
cd ..
```

### 4. Set Up Frontend
```bash
cd app
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
cd ..
```

## Starting the Application

### Option 1: Use the start script
```bash
./start-services.sh
```

### Option 2: Start manually

**Terminal 1 - Backend:**
```bash
cd service
source venv/bin/activate
uvicorn main:app --host localhost --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd app
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## What's Included

- **Speech Recognition**: Whisper model for audio transcription
- **Language Support**: Multiple Indian languages + international languages
- **Entity Extraction**: Extract names, addresses, phone numbers, etc.
- **Summarization**: AI-powered conversation summaries
- **Translation**: Convert to English for processing
- **Google Calendar Integration**: OAuth-based calendar access with automatic token refresh
- **Modern UI**: Next.js with Tailwind CSS

## Troubleshooting

If you encounter issues:

1. **Check logs**: Look at terminal output for error messages
2. **Verify services**: Ensure PostgreSQL and Ollama are running
3. **Check ports**: Make sure ports 3000, 8000, and 5432 are available
4. **Reinstall dependencies**: Run `./setup.sh` again if needed

For detailed troubleshooting, see `SETUP_GUIDE.md`.

## Next Steps

1. Configure Google OAuth credentials (see SETUP_GUIDE.md)
2. Upload an audio file through the web interface
3. Test with different languages
4. Explore the API documentation
5. Test Google Calendar integration
6. Customize the configuration as needed

## Support

- Check `SETUP_GUIDE.md` for detailed instructions
- Review the API documentation at http://localhost:8000/docs
- Check the project README for more information 