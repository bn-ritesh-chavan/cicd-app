FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .


FROM node:20-alpine

WORKDIR /app


RUN addgroup -S appgroup && adduser -S appuser -G appgroup


COPY --from=builder /app /app


RUN npm prune --production

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]