FROM node:10-alpine

RUN apk add git

RUN mkdir /usr/app
WORKDIR /usr/app

COPY package.json yarn.lock /usr/app/

RUN yarn

COPY ./src /usr/app/src/
COPY ./tsconfig.json /usr/app

RUN yarn build

CMD ["yarn", "start"]

