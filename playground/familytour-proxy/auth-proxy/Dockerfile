FROM node:lts-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=build /app/dist ./dist
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
