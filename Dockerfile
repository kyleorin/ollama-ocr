FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN mkdir -p uploads && chmod 777 uploads
EXPOSE 3000
CMD ["npm", "start"]