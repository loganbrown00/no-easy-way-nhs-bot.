FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
COPY index.js setup.js ./
USER node
CMD ["npm", "start"]
