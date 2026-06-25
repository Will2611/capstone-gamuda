FROM node:24-alpine 

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
EXPOSE 5173
# ENTRYPOINT ["npm", "run", "dev"]
CMD ["npm", "run", "dev"]
# CMD ["node", "index.js"]
