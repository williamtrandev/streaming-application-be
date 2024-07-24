FROM node:20
RUN mkdir -p /var/www/src/
WORKDIR /var/www/src/
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]