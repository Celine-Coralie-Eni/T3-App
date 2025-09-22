# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package.json and install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy pre-built Next.js application and static files
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Copy generated Prisma and ZenStack files
COPY prisma ./prisma
COPY .zenstack ./zenstack

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