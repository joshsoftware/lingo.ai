FROM node:22-bullseye-slim

WORKDIR /lingo/app

COPY package.json package-lock.json* ./

RUN npm install --force

COPY . .

EXPOSE 3000

# Install/update dependencies if needed, run migrations, then start the dev server
# npm install is idempotent and will update dependencies if package.json changed
# Using --force to match build step and resolve peer dependency conflicts
CMD sh -c "npm install --force && npm run migrate && npm run dev"
