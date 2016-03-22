FROM node:5
ENV NODE_PATH=/node_modules
RUN npm install -g webpack-dev-server
RUN npm install webpack react react-dom html-webpack-plugin \
  style-loader css-loader imports-loader exports-loader \
  whatwg-fetch moment ansi_up \
  babel-loader babel-core babel-preset-es2015 babel-preset-react \
  babel-plugin-transform-object-rest-spread
RUN npm install -g http-server
RUN mkdir /app
COPY webpack.config.js /app
WORKDIR /app
COPY . /app
RUN webpack
RUN http-server -p 80 build
