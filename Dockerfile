FROM node:5
ENV NODE_PATH=/node_modules
RUN npm install connect serve-static vhost http-proxy docker-remote-api
RUN npm install webpack webpack-dev-server react
RUN npm install babel-loader babel-core babel-preset-es2015 babel-preset-react
COPY . /src
WORKDIR /src
ENTRYPOINT node server
