FROM node:lts

WORKDIR /app/backend
COPY backend/package*.json /app/backend/
RUN npm ci

COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
RUN npm run build

WORKDIR /app/backend
CMD [ "node", "/app/backend/dist/index.js" ]