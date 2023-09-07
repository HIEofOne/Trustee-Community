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
ENV NODE_ENV production
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
RUN mkdir -p /usr/src/app/trustees
RUN mkdir -p /usr/src/app/routes
EXPOSE 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]