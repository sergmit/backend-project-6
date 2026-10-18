FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci && md5sum package-lock.json | cut -d' ' -f1 > node_modules/.lock-hash

COPY . .

EXPOSE 3000

CMD ["sh", "docker/node/entrypoint.sh"]
