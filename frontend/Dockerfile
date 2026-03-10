# Stage 1: Build the React application
FROM node:18-alpine AS build

# Optimalisatie: caching van node_modules
WORKDIR /app
COPY package*.json ./
RUN npm install --quiet

COPY . .

# Build Arguments
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Install gettext for envsubst support
RUN apk add --no-cache gettext

# Use a custom entrypoint script to substitute environment variables
COPY nginx.conf /etc/nginx/conf.d/default.template
COPY --from=build /app/build /usr/share/nginx/html

# We luisteren standaard op 8080 (Scaleway standard / Cloud Run standard)
EXPOSE 8080

# Vervang variabelen in nginx config en start nginx
# Verbeterde CMD: we gebruiken 'envsubst' om zowel BACKEND_URL als BACKEND_HOST in te vullen
CMD ["/bin/sh", "-c", "export BACKEND_HOST=$(echo $BACKEND_URL | sed -e 's|https://||' -e 's|http://||' -e 's|/.*||') && envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
