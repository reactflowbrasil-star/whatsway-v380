FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV CI=true
RUN apt-get update   && apt-get install -y --no-install-recommends python3 make g++   && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY packages ./packages
COPY shared ./shared
COPY server ./server
COPY client ./client
COPY public ./public
COPY migrations ./migrations
COPY scripts ./scripts
COPY brain ./brain
COPY drizzle.config.ts tailwind.config.ts postcss.config.js tsconfig.json vite.config.ts vitest.config.ts ./
RUN npm ci
RUN npm run build
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
RUN apt-get update   && apt-get install -y --no-install-recommends ca-certificates   && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/packages ./packages
EXPOSE 5000
CMD ["npm", "start"]

