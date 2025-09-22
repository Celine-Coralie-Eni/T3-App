# Stage 1: Builder - Prepare dependencies and copy built artifacts
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy pre-built Next.js application and static files
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Copy generated Prisma and ZenStack files
COPY prisma ./prisma
COPY .zenstack ./zenstack

# Stage 2: Runner - Production runtime
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app ./

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]