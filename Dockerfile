FROM node:18

# Add debugging information
RUN node --version
RUN npm --version

WORKDIR /app

# Install dependencies with verbose logging
COPY package*.json ./
RUN npm install --verbose

# Copy and build with logging
COPY . .
RUN echo "Starting build process..."
RUN npm run build
RUN echo "Build completed"

# Setup uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ping || exit 1

EXPOSE 3000

# Start with more verbose logging
CMD echo "Starting server..." && NODE_DEBUG=* npm start