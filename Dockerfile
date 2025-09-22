# Multi-stage Docker build for Next.js production deployment
# Stage 1: Dependencies - Install all dependencies including devDependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# # Install dependencies
# RUN npm ci --only=production --ignore-scripts

# Install dependencies
RUN npm ci --ignore-scripts

# Generate Prisma Client
RUN npx prisma generate

# Generate ZenStack artifacts
RUN npx zenstack generate

# Build Next.js application
RUN npm run build

# Stage 2: Builder - Build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# Generate Prisma client
RUN npx prisma generate

# Remove broken symlink (ZenStack runtime is used directly)
RUN rm -f .zenstack

# Build Next.js application
RUN npm run build

# Stage 3: Runner - Production runtime
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma generated files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Install curl for health check (before switching to non-root user)
RUN apk add --no-cache curl

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
