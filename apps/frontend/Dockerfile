FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci --workspace apps/frontend --include-workspace-root

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY apps/frontend apps/frontend
RUN npm run frontend:build
RUN npm prune --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/frontend/package.json apps/frontend/package.json
COPY --from=build /app/apps/frontend/.next apps/frontend/.next

EXPOSE 3001
CMD ["npm", "--workspace", "apps/frontend", "run", "start"]
