FROM node:18
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 3000
CMD ["node", "dist/server.js"]