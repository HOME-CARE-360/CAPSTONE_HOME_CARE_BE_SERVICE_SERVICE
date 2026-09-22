# Service catalog

The public catalog: services, categories, detail pages, suggestions, and the chat entry point.

## How it is called

A NestJS microservice listening on **TCP transport**. The HTTP gateway forwards
requests as message patterns; this service never talks to a browser directly.

| Pattern (`cmd`) |
|---|
| `chat` |
| `detail` |
| `get-list-category` |
| `get-list-service` |
| `get-suggestion` |

5 handlers. Persistence is PostgreSQL through Prisma.

## Run

```bash
pnpm install
cp .env.example .env   # if present; otherwise set the variables below
pnpm start:dev
```

## Configuration

Read from the environment (names as used in the code; no values are committed):

- `ACCESS_TOKEN_EXPIRES_IN`
- `ACCESS_TOKEN_SECRET`
- `APP_NAME`
- `CRON_TZ`
- `CRON_WATCH_INTERVAL_MS`
- `MAX_PER_ASSET`
- `MIN_SCORE`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_CLF_MODEL`
- `OPENAI_MODEL`
- `OPENAI_RESEARCH_ATTEMPTS`
- `OPENAI_RESEARCH_BACKOFF_MS`
- `OPENAI_RESEARCH_CONCURRENCY`
- `OPENAI_RESEARCH_MODEL`
- `OPENAI_RESEARCH_TIMEOUT_MS`
- `PAYMENT_API_KEY`
- `REDIS_HOST`
- `REDIS_URL`
- `REFRESH_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`
- `RESEARCH_MAX_ASSETS`
- `RESEARCH_MAX_CANDIDATES`
- `RESEARCH_MODE`
- `RESEND_API_KEY`
- `S3_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `S3_ENPOINT`
- `S3_REGION`
- `S3_SECRET_KEY`
- `SERPAPI_FETCH_PRODUCT_IMAGES`
- `SERPAPI_KEY`
- `SERVICE_HTTP_PORT`
- `SERVICE_TCP_PORT`


## Part of Home Care 360

FPT University capstone project (2024–2025), built by a team of four; backend
services by [@tientran1234](https://github.com/tientran1234). The platform
overview, architecture diagram and the list of every service live in
[CAPSTONE_HOME_CARE_BE_MICROSERVICES](https://github.com/HOME-CARE-360/CAPSTONE_HOME_CARE_BE_MICROSERVICES).
