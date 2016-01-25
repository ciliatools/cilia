FROM node:5
RUN mkdir /app
WORKDIR /app
RUN npm install connect body-parser \
  babel-core babel-register babel-preset-es2015 \
  babel-plugin-transform-object-rest-spread \
  nodegit node-fetch
COPY .babelrc /app
COPY index.js /app
COPY api.js /app
ENTRYPOINT ["node", "index"]
