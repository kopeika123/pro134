FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm config set fetch-retries 5 && npm config set fetch-retry-factor 2 && npm config set fetch-retry-mintimeout 2000 && npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["node", "dist/main.js"]
