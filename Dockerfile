FROM node:slim AS builder
RUN apt-get update || : && apt-get install -y python3 build-essential
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:slim
LABEL Maintainer Michael Shihjay Chen <shihjay2@gmail.com>
WORKDIR /usr/src/app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static
VOLUME /hostpipe
USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]