# Build stage for frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Production stage for backend
FROM node:18-alpine

WORKDIR /app

# Install dependencies for production
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy backend source
COPY backend/ ./

# Build the backend
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Command to run the application
CMD ["node", "dist/server.js"]
