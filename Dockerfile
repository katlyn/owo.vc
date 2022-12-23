FROM node:19-alpine

WORKDIR /usr/owo-vc

EXPOSE 80

COPY prisma prisma
COPY package.json package-lock.json ./

RUN npm ci && npx prisma generate

COPY static static
COPY src src
COPY ./tsconfig.json ./

RUN npm run build

CMD ["npm", "run", "start"]

