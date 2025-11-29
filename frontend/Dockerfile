FROM node:22

WORKDIR /app

COPY package.json ./
COPY vite.config.mts ./
RUN npm install

COPY index.html ./
COPY src ./src
COPY . .

RUN npm install react-router-dom --force

RUN npm install -D @types/react-router-dom --force

EXPOSE 5173

CMD ["npm", "run", "dev", "--","--host"]
