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
COPY libs libs
COPY prisma prisma

RUN pnpm prisma generate
RUN pnpm run build service

COPY requirements.txt ./

RUN apk update && apk add --no-cache \
  python3 \
  py3-pip \
  python3-dev \
  build-base \
  libffi-dev \
  openssl-dev \
  && python3 -m venv /venv \
  && /venv/bin/pip install --upgrade pip \
  && /venv/bin/pip install --no-cache-dir -r requirements.txt \
  && rm -rf /var/cache/apk/*


FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apk update && apk add --no-cache python3 libgomp \
  && rm -rf /var/cache/apk/*

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --prod

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /venv /venv
COPY train_model.py ./
COPY predict.py ./

# Use Python from virtualenv
ENV PATH="/venv/bin:$PATH"

CMD ["node", "dist/apps/service/main"]
