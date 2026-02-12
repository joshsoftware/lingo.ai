# Build stage
FROM node:22-bullseye-slim AS builder

WORKDIR /lingo/app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Set dummy DATABASE_URL for build (real one injected at runtime via env_file)
# This is needed for Next.js build process but not actually used
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL

# Build the application
RUN npm run build

# Production stage
FROM node:22-bullseye-slim

WORKDIR /lingo/app

ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built application and necessary files from builder
COPY --from=builder /lingo/app/.next ./.next
COPY --from=builder /lingo/app/public ./public
COPY --from=builder /lingo/app/scripts ./scripts
COPY --from=builder /lingo/app/migrations ./migrations

# Copy other necessary config files
COPY next.config.* ./

EXPOSE 3000

CMD sh -c "npm run migrate && npm start"
