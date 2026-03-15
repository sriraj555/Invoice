FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 4001
ENV PORT=4001
CMD ["node", "dist/server.js"]
