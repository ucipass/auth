# Stage 1: Build Vue frontend application
FROM node:18 AS frontend
WORKDIR /app
COPY ./frontend/vite.config.js ./
COPY ./frontend/index.html ./
COPY ./frontend/package*.json ./
COPY ./frontend/public ./public
COPY ./frontend/src ./src
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build Nodejs backend application
FROM node:18-alpine
LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.architecture="amd64"
LABEL org.label-schema.architecture="arm64"

RUN apk --no-cache add git
WORKDIR /app
COPY ./backend/package*.json ./
COPY ./backend/index.js ./
COPY ./backend/lib ./lib
RUN npm install --only=production
COPY --from=frontend /app/dist /app/dist

ENV NODE_PATH=/app
ENV LOG_LEVEL=info
ENV PORT=80
ENV USERNAME=admin
ENV PASSWORD=admin
ENV REDIS_URL="redis://admin:foobared@redis"
EXPOSE 80
CMD ["sh", "-c", "node index.js"]