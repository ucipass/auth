FROM node:16-alpine as gui
RUN apk --no-cache add git
WORKDIR /source/auth
COPY frontend/package.json .
COPY frontend/package-lock.json .
COPY frontend/package.json .
COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/babel.config.js .
COPY frontend/vue.config.js .
COPY frontend/jsconfig.json .
RUN npm install
RUN npm run build

FROM node:16-alpine
RUN apk --no-cache add git
WORKDIR /source/auth
COPY --from=gui /source/auth/dist ./frontend/dist
COPY ./package.json ./package.json
COPY ./index.js ./index.js
COPY ./lib ./lib
RUN npm install --only=production

ENV NODE_PATH=/source/auth
ENV LOG_LEVEL=info
ENV PORT=80
ENV USERNAME=admin
ENV PASSWORD=admin
# ENV REDIS_URL="redis://:foobared@172.18.2.64"
EXPOSE 80
CMD ["sh", "-c", "node index.js"]