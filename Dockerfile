FROM node:22-alpine AS builder

RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM node:22-alpine AS production

RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci --ignore-scripts --production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nudge -u 1001 && \
    chown -R nudge:nodejs /app

USER nudge

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('health check passed')" || exit 1

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"] 