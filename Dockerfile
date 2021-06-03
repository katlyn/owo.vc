FROM node:10-alpine

RUN apk add git

# Don't do dumb things with ssh
RUN git config --global url."https://github.com".insteadOf ssh://git@github.com

RUN mkdir /usr/app
WORKDIR /usr/app

COPY package.json package-lock.json /usr/app/

RUN npm ci

COPY ./src /usr/app/src/
COPY ./tsconfig.json /usr/app

RUN npm run build

CMD ["npm", "run", "start"]

