FROM node:5
ENV NODE_PATH=/node_modules
RUN npm install -g webpack-dev-server
RUN npm install webpack react react-dom html-webpack-plugin \
  style-loader css-loader imports-loader exports-loader \
  whatwg-fetch moment \
  babel-loader babel-core babel-preset-es2015 babel-preset-react \
  babel-plugin-transform-object-rest-spread
RUN mkdir /app
COPY webpack.config.js /app
WORKDIR /app
ENTRYPOINT ["webpack-dev-server",      \
  "--port", "80", "--host", "0.0.0.0", \
  "--inline", \
  "--progress", "--colors"]
