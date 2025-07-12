#!/bin/bash

# Lingo.ai Setup Script for macOS
# This script will help you set up the Lingo.ai project

set -e  # Exit on any error

echo "🚀 Starting Lingo.ai setup for macOS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Homebrew is installed
check_homebrew() {
    print_status "Checking if Homebrew is installed..."
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        print_success "Homebrew installed successfully!"
    else
        print_success "Homebrew is already installed!"
    fi
}

# Install Python
install_python() {
    print_status "Installing Python 3.11..."
    brew install python@3.11
    print_success "Python 3.11 installed successfully!"
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    brew install node
    print_success "Node.js installed successfully!"
}

# Install FFmpeg
install_ffmpeg() {
    print_status "Installing FFmpeg..."
    brew install ffmpeg
    print_success "FFmpeg installed successfully!"
}

# Install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL..."
    brew install postgresql@16
    brew services start postgresql@16
    print_success "PostgreSQL installed and started successfully!"
}

# Install Ollama
install_ollama() {
    print_status "Installing Ollama..."
    if ! command -v ollama &> /dev/null; then
        curl -fsSL https://ollama.com/install.sh | sh
        print_success "Ollama installed successfully!"
    else
        print_success "Ollama is already installed!"
    fi
}

# Create database
setup_database() {
    print_status "Setting up database..."
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw lingo_db; then
        print_warning "Database 'lingo_db' already exists!"
    else
        createdb lingo_db
        print_success "Database 'lingo_db' created successfully!"
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd service
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Virtual environment created!"
    else
        print_warning "Virtual environment already exists!"
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt
    print_success "Backend dependencies installed!"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd app
    
    # Install dependencies
    npm install
    print_success "Frontend dependencies installed!"
    
    cd ..
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Create frontend .env file
    if [ ! -f "app/.env" ]; then
        cat > app/.env << EOF
# Database Configuration
DATABASE_URL="postgresql://lingo_user:lingo_password@localhost:5432/lingo_db"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/oauth2callback"
NEXT_PUBLIC_GOOGLE_CALENDAR_URL="http://localhost:3000/api/auth"

# Microservice URL
NEXT_PUBLIC_MICROSERVICE_URL="http://localhost:8001"

# Node Environment
NODE_ENV="development"
EOF
        print_success "Frontend .env file created!"
        print_warning "Please edit app/.env with your actual configuration!"
    else
        print_warning "Frontend .env file already exists!"
    fi
    
    # Create backend .env file
    if [ ! -f "service/.env" ]; then
        cat > service/.env << EOF
# Backend Environment Variables
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
EOF
        print_success "Backend .env file created!"
        print_warning "Please edit service/.env with your actual Google OAuth credentials!"
    else
        print_warning "Backend .env file already exists!"
    fi
}

# Download Ollama model
download_ollama_model() {
    print_status "Downloading Llama 3.2 model (this may take a while)..."
    ollama run llama3.2
    print_success "Llama 3.2 model downloaded successfully!"
}

# Main setup function
main() {
    echo "📋 Prerequisites installation..."
    check_homebrew
    install_python
    install_nodejs
    install_ffmpeg
    install_postgresql
    install_ollama
    
    echo "🗄️ Database setup..."
    setup_database
    
    echo "🔧 Project setup..."
    create_env_files
    setup_backend
    setup_frontend
    
    echo "🤖 AI model setup..."
    download_ollama_model
    
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Edit the environment files with your actual configuration:"
    echo "   - app/.env"
    echo "   - service/.env"
    echo ""
    echo "2. Configure Google OAuth (Required for Calendar Integration):"
    echo "   - Go to Google Cloud Console: https://console.cloud.google.com/"
    echo "   - Create a new project or select existing one"
    echo "   - Enable Google Calendar API"
    echo "   - Create OAuth 2.0 credentials"
    echo "   - Add http://localhost:3000/api/oauth2callback to authorized redirect URIs"
    echo "   - Update CLIENT_ID and CLIENT_SECRET in Bot/.env"
    echo ""
    echo "3. Run database migrations:"
    echo "   - cd app && npx drizzle-kit migrate"
    echo ""
    echo "4. Start the services:"
    echo "   - Backend: cd service && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    echo "   - Frontend: cd app && npm run dev"
    echo ""
    echo "5. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:8000"
    echo "   - API Docs: http://localhost:8000/docs"
    echo ""
    echo "📚 For more information, see SETUP_GUIDE.md"
}

# Run main function
main "$@" 