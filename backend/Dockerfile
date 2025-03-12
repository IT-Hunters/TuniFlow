# Stage 1: Build dependencies 
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

# Stage 2: Copy application code and install production dependencies
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY . .


EXPOSE 3000

CMD ["npm", "start"]
