#!/bin/bash

# Family Tree Application Startup Script
# ======================================

echo "🌳 Family Tree Application"
echo "=========================="
echo ""

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB is not running on localhost:27017"
    echo ""
    echo "Please start MongoDB first:"
    echo "  • brew services start mongodb-community"
    echo "  • OR docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
    exit 1
fi

echo "✅ MongoDB is running"
echo ""

# Start backend in background
echo "Starting backend server..."
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
sleep 3

# Start frontend
echo "Starting frontend server..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🚀 Application is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait

