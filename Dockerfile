# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
###########################
# Multi-stage Dockerfile  #
###########################

# Stage 1: Build
FROM node:lts-alpine as builder

# Set working directory and copy package files
WORKDIR /app
COPY package.json package-lock.json* ./

# Install all dependencies including dev dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the project (transpiles TypeScript to JavaScript)
RUN npm run build

# Stage 2: Production
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy only necessary files from builder
COPY package.json package-lock.json* ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only
RUN npm install --production --ignore-scripts

# Expose the port (default 3000)
EXPOSE 3000

# Start the MCP server
CMD [ "node", "dist/index.js" ]
