# Multi-stage Docker build for CANNA Visit Report Application

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
COPY vite.config.js ./
COPY jsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY components.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY index.html ./

# Build the frontend
RUN npm run build

# Stage 2: Setup the backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source
COPY server/ ./server/

# Stage 3: Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

# Copy backend from builder
COPY --from=backend-builder /app/backend ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "server:start"]