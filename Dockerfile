FROM node:16-alpine
RUN apk --no-cache add git
WORKDIR /source/auth
COPY ./package.json ./package.json
COPY ./index.js ./index.js
COPY ./lib ./lib
COPY ./frontend ./frontend
WORKDIR /source/auth/frontend
RUN npm install
RUN npm run build
WORKDIR /source/auth
COPY ./frontend/dist ./frontend/dist
RUN npm install --only=production

ENV NODE_PATH=/source/auth
ENV LOG_LEVEL=info
ENV PORT=80
ENV USERNAME=admin
ENV PASSWORD=admin
# ENV REDIS_URL="redis://:foobared@172.18.2.64"
EXPOSE 80
CMD ["sh", "-c", "node index.js"]