FROM node:10-alpine

RUN apk add git

RUN mkdir /usr/app
WORKDIR /usr/app

COPY package.json package-lock.json /usr/app/

RUN yarn

COPY ./src /usr/app/src/
COPY ./tsconfig.json /usr/app

RUN npm run build

CMD ["npm", "run", "start"]

