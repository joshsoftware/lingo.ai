# Lingo.ai Setup Guide for macOS

This guide will help you set up the Lingo.ai project on your macOS device. The project consists of:
- **Frontend**: Next.js application
- **Backend**: FastAPI Python service
- **Database**: PostgreSQL
- **AI**: Ollama with Llama 3.2 model

## Prerequisites

### 1. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Python 3.8+ and Node.js
```bash
# Install Python
brew install python@3.11

# Install Node.js
brew install node

# Verify installations
python3 --version
node --version
npm --version
```

### 3. Install FFmpeg
```bash
brew install ffmpeg
```

### 4. Install Ollama
```bash
# Download and install Ollama for macOS
curl -fsSL https://ollama.com/install.sh | sh

# Or download manually from: https://ollama.com/download/Ollama-darwin.zip
```

### 5. Install PostgreSQL
```bash
brew install postgresql@16
brew services start postgresql@16
```

### 6. Install Docker (optional, for containerized setup)
```bash
brew install --cask docker
```

## Project Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lingo.ai
```

### 2. Set Up Environment Variables

Create the following environment files:

**For the Frontend (`app/.env`):**
```bash
# Database
DATABASE_URL="postgresql://abhijeet@localhost:5432/lingo_db"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/oauth2callback"
NEXT_PUBLIC_GOOGLE_CALENDAR_URL="http://localhost:3000/api/auth"

# AWS S3 (optional)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
S3_BUCKET="your_s3_bucket"
AWS_ENDPOINT="https://your-s3-endpoint.com"

# Microservice URL
NEXT_PUBLIC_MICROSERVICE_URL="http://localhost:8000"
```

**For the Backend (`service/.env`):**
```bash
# Database Configuration
DATABASE_URL="postgresql://lingo_user:lingo_password@localhost:5432/lingo_db"

# Google OAuth Configuration (Required for Calendar Integration)
CLIENT_ID="your_google_client_id"
CLIENT_SECRET="your_google_client_secret"
TOKEN_URI="https://oauth2.googleapis.com/token"

# Optional: AWS S3 Configuration (for file uploads)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
S3_BUCKET="your_s3_bucket"
```

### 3. Set Up Database

```bash
# Create database
createdb lingo_db

# Or using psql
psql postgres
CREATE DATABASE lingo_db;
\q
```

### 4. Set Up Backend (Python Service)

```bash
# Navigate to service directory
cd service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download Llama 3.2 model (this may take a while)
ollama run llama3.2

# Start the backend service
uvicorn main:app --host localhost --port 8000 --reload
```

### 5. Set Up Frontend (Next.js)

```bash
# Open a new terminal and navigate to app directory
cd app

# Install dependencies
npm install

# Generate and run database migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# Start the development server
npm run dev
```

### 6. Configure Google OAuth (Required for Calendar Integration)

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/oauth2callback`
     - `http://localhost:3000/api/auth/google/callback`

4. **Update Environment Files**:
   - Copy the Client ID and Client Secret
   - Update `service/.env` with your credentials
   - Update `app/.env` with your credentials

## Running the Application

### Option 1: Manual Setup (Recommended for Development)

1. **Start PostgreSQL** (if not already running):
   ```bash
   brew services start postgresql@16
   ```

2. **Start Ollama** (if not already running):
   ```bash
   ollama serve
   ```

3. **Start Backend** (in one terminal):
   ```bash
   cd service
   source venv/bin/activate
   uvicorn main:app --host localhost --port 8000 --reload
   ```

4. **Start Frontend** (in another terminal):
   ```bash
   cd app
   npm run dev
   ```

### Option 2: Docker Setup

```bash
# Create secrets directory and files
mkdir -p secrets/pg
echo "lingo_user" > secrets/pg/db_user.txt
echo "lingo_password" > secrets/pg/db_password.txt
echo "lingo_db" > secrets/pg/db_name.txt

# Start all services
docker-compose up -d
```

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Ollama**: http://localhost:11434

## API Endpoints

### Backend Endpoints:
- `GET /` - Health check
- `GET /docs` - Swagger UI documentation
- `POST /v1/upload-audio` - Upload audio for processing
- `POST /latest/upload-audio` - Latest version of audio processing
- `GET /api/meetings` - Get Google Calendar meetings (requires OAuth)
- `POST /api/watch-calendar` - Set up calendar webhook (requires OAuth)

### Request Format:
```json
{
  "audio_file_link": "path_to_audio_file"
}
```

### Supported Audio Formats:
- m4a, mp3, webm, mp4, mpga, wav, mpeg

## Troubleshooting

### Common Issues:

1. **Port already in use**:
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :8000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Database connection issues**:
   ```bash
   # Check if PostgreSQL is running
   brew services list | grep postgresql
   
   # Restart PostgreSQL
   brew services restart postgresql@16
   ```

3. **Ollama model not found**:
   ```bash
   # List available models
   ollama list
   
   # Pull the model again
   ollama pull llama3.2
   ```

4. **Python dependencies issues**:
   ```bash
   # Recreate virtual environment
   cd service
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Node.js dependencies issues**:
   ```bash
   # Clear npm cache and reinstall
   cd app
   rm -rf node_modules package-lock.json
   npm install
   ```

6. **Google OAuth issues**:
   ```bash
   # Verify OAuth credentials are correct
   # Check that redirect URIs match exactly
   # Ensure Google Calendar API is enabled
   # Check browser console for OAuth errors
   ```

## Development Workflow

1. **Making changes to the backend**:
   - The FastAPI server will auto-reload when you make changes
   - Check logs in the terminal running the backend

2. **Making changes to the frontend**:
   - Next.js will auto-reload when you make changes
   - Check the browser console for any errors

3. **Database migrations**:
   ```bash
   cd app
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

## Production Setup

For production deployment, consider:
- Using environment-specific configuration files
- Setting up proper SSL certificates
- Configuring a reverse proxy (nginx)
- Setting up monitoring and logging
- Using a production database
- Configuring proper CORS settings

## Support

If you encounter any issues during setup, please:
1. Check the troubleshooting section above
2. Review the logs in your terminal
3. Ensure all prerequisites are properly installed
4. Verify environment variables are correctly set 