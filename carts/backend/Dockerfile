FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 4002
ENV PORT=4002
CMD ["node", "dist/server.js"]
