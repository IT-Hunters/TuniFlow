# syntax=docker/dockerfile:1.4

# Stage 1: Development
FROM node:lts AS development

ENV CI=true
ENV PORT=3000

WORKDIR /code
COPY package.json /code/package.json
COPY package-lock.json /code/package-lock.json
RUN npm ci
COPY . /code

# Build the application
RUN npm run build

# Stage 2: Nginx to serve built app
FROM nginx:alpine

# Copy the build from the builder stage
COPY --from=development /code/dist /usr/share/nginx/html


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
