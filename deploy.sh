#!/bin/bash
set -e

echo "======================================"
echo "🚀 Deploying My Wallet Backend"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null
then
    echo "❌ Docker Compose is not installed. Please install it first."
    exit 1
fi

# Determine the docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

echo "📦 Pulling latest changes (if using git)..."
git pull origin main 2>/dev/null || echo "Not a git repository or no remote configured, skipping git pull."

echo "🏗️ Building and starting Docker containers..."
$DOCKER_COMPOSE_CMD up -d --build

echo "✅ Deployment initiated!"
echo "To view logs, run: $DOCKER_COMPOSE_CMD logs -f"
