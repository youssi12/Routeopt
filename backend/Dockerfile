FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build && ls -la dist/

# Remove dev dependencies
RUN npm prune --omit=dev

EXPOSE 4000
CMD ["node", "dist/app.js"]
