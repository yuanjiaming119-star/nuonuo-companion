FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY worker ./worker
COPY scripts/preview.mjs ./scripts/preview.mjs
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "scripts/preview.mjs"]
