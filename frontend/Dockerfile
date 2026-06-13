# Multi-stage build for SovScan frontend
# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --quiet

COPY . .
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Stage 2: Serve via nginx
FROM nginx:1.27-alpine
COPY nginx/default.template /etc/nginx/conf.d/default.template
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

# envsubst on startup: BACKEND_URL -> BACKEND_HOST extracted, then run nginx
CMD ["/bin/sh", "-c", "export BACKEND_HOST=$(echo $BACKEND_URL | sed -e 's|https://||' -e 's|http://||' -e 's|/.*||') && envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
