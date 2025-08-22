
FROM node:alpine AS development

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY nest-cli.json ./
COPY tsconfig.build.json ./
COPY tsconfig.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY apps/service apps/service
COPY prisma prisma
COPY libs libs
RUN pnpm prisma generate






RUN pnpm run build service

FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod


COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/node_modules /usr/src/app/node_modules
CMD ["node", "dist/apps/service/main"]
