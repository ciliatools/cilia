FROM node:5
ENV NODE_PATH=/node_modules
RUN npm install connect serve-static vhost http-proxy docker-remote-api basic-auth
COPY . /src
WORKDIR /src
ENTRYPOINT ["./entrypoint"]
