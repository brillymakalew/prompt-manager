FROM node:20-alpine AS base
WORKDIR /app

# Avoid running as root in a real deployment. For MVP/dev, keep it simple.

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
