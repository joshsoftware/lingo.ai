#!/bin/bash

# Lingo.ai Service Starter Script
# This script helps you start all the required services

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "🚀 Starting Lingo.ai services..."

# Function to check if a service is running
check_service() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_warning "$service_name is already running on port $port"
        return 0
    else
        return 1
    fi
}

# Start PostgreSQL
start_postgresql() {
    print_status "Starting PostgreSQL..."
    if check_service 5432 "PostgreSQL"; then
        print_success "PostgreSQL is already running!"
    else
        brew services start postgresql@16
        print_success "PostgreSQL started successfully!"
    fi
}

# Start Ollama
start_ollama() {
    print_status "Starting Ollama..."
    if check_service 11434 "Ollama"; then
        print_success "Ollama is already running!"
    else
        ollama serve &
        sleep 3
        print_success "Ollama started successfully!"
    fi
}

# Start Backend
start_backend() {
    print_status "Starting Backend (FastAPI)..."
    if check_service 8000 "Backend"; then
        print_warning "Backend is already running on port 8000"
    else
        cd service
        if [ ! -d "venv" ]; then
            print_error "Virtual environment not found. Please run setup.sh first."
            exit 1
        fi
        source venv/bin/activate
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
        cd ..
        sleep 3
        print_success "Backend started successfully!"
    fi
}

# Start Frontend
start_frontend() {
    print_status "Starting Frontend (Next.js)..."
    if check_service 3000 "Frontend"; then
        print_warning "Frontend is already running on port 3000"
    else
        cd app
        if [ ! -d "node_modules" ]; then
            print_error "Node modules not found. Please run setup.sh first."
            exit 1
        fi
        npm run dev &
        cd ..
        sleep 3
        print_success "Frontend started successfully!"
    fi
}

# Main function
main() {
    echo "📋 Starting all services..."
    
    start_postgresql
    start_ollama
    start_backend
    start_frontend
    
    echo ""
    print_success "🎉 All services started successfully!"
    echo ""
    echo "🌐 Access your application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:8000"
    echo "   - API Documentation: http://localhost:8000/docs"
    echo "   - Ollama: http://localhost:11434"
    echo ""
    echo "📋 Google OAuth Setup (Required for Calendar Integration):"
    echo "   - Ensure you've configured Google OAuth credentials"
    echo "   - Check SETUP_GUIDE.md for detailed OAuth setup instructions"
    echo ""
    echo "📝 To stop all services, press Ctrl+C"
    echo ""
    
    # Wait for user to stop
    wait
}

# Handle Ctrl+C
trap 'echo ""; print_warning "Stopping services..."; exit 0' INT

# Run main function
main "$@" 