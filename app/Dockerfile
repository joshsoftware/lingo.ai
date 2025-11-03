FROM node:22-bullseye-slim

WORKDIR /lingo/app

# Copy package files first
COPY package*.json ./

# Ensure we install dev dependencies
ENV NODE_ENV=development
RUN npm install --force

# Copy rest of the app

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

