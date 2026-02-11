FROM node:22-bullseye-slim

WORKDIR /lingo/app

# Copy package files (node_modules will be installed at runtime via volume)
COPY package.json package-lock.json* ./

COPY . .

EXPOSE 3000

# Install/update dependencies, run migrations, then start the dev server
# npm install runs at container start and installs to the named volume (app_node_modules)
# This avoids redundant installation during build since volume mount overwrites it anyway
CMD sh -c "npm install --force && npm run migrate && npm run dev"
