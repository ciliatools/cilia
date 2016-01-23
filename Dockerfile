FROM node:5
ENV NODE_PATH=/node_modules
RUN npm install connect serve-static vhost http-proxy docker-remote-api
COPY . /src
WORKDIR /src
ENTRYPOINT node server
