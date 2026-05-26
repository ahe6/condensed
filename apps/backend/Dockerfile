FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci --workspace apps/backend --include-workspace-root

FROM deps AS build
COPY apps/backend apps/backend
RUN npm run db:generate
RUN npm run backend:build
RUN npm prune --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/backend/package.json apps/backend/package.json
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/prisma apps/backend/prisma
COPY --from=build /app/apps/backend/scripts apps/backend/scripts

EXPOSE 3000
CMD ["npm", "--workspace", "apps/backend", "run", "start"]
