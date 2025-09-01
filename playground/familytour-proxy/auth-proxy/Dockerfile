FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=optional && npm install --only=dev ts-node typescript @types/node

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
