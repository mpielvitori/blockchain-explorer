FROM node:18.18.0-alpine3.18

COPY package.json /app/

WORKDIR /app

RUN npm i

ARG NODE_ENV=development
ENV NODE_ENV $NODE_ENV

COPY ./ /app/

ENTRYPOINT ["npm","start"]
