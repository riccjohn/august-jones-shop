# Build stage — compiles TypeScript to plain JS. typescript and @types/node
# are installed here only (not shipped in the runtime image); the relay has
# zero runtime dependencies (node:http, node:crypto, global fetch only).
FROM node:22-slim AS build
WORKDIR /app
COPY tsconfig.json ./
COPY src ./src
# Tests aren't part of the production image and pull in vitest, which isn't
# installed here — drop them before compiling.
RUN rm -rf src/__tests__
RUN npm install --no-save --no-package-lock typescript@5.9.3 @types/node@22
RUN npx tsc -p tsconfig.json

# Runtime stage — just the compiled output and the Node runtime.
FROM node:22-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
