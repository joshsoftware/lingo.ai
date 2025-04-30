FROM node:22-bullseye-slim

WORKDIR /lingo/app

COPY package.json package-lock.json* ./

RUN npm install --force

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]
