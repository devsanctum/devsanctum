#!/bin/bash

# Development startup script for DevSanctum
# Starts both backend and frontend servers

set -e

echo "🚀 Starting DevSanctum Development Environment..."
echo ""

# Check if we're in the project root
if [ ! -f "DEVELOPMENT.md" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env files exist, copy from example if not
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo "📋 No backend .env found, copying from .env.example..."
        cp backend/.env.example backend/.env
    else
        echo "⚠️  Warning: No backend .env or .env.example found"
    fi
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if database exists
if [ ! -f "backend/prisma/dev.db" ]; then
    echo "🗄️  Initializing database..."
    cd backend && npx prisma migrate dev && cd ..
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev > /tmp/devsanctum-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:3000"
    echo "📚 API docs available at http://localhost:3000/docs"
else
    echo "❌ Backend failed to start. Check logs at /tmp/devsanctum-backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev

# Cleanup on exit
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM
