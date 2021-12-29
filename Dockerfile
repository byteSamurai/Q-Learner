FROM node:16-alpine as build
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run gulp -- --production

FROM nginx:alpine as prod
COPY --from="build" /usr/src/app/index.html /usr/share/nginx/html/index.html
COPY --from="build" /usr/src/app/css /usr/share/nginx/html/css 
COPY --from="build" /usr/src/app/img /usr/share/nginx/html/img 
COPY --from="build" /usr/src/app/dist /usr/share/nginx/html/dist 
COPY --from="build" /usr/src/app/node_modules/systemjs/dist/system.js /usr/share/nginx/html/node_modules/systemjs/dist/system.js 
COPY --from="build" /usr/src/app/node_modules/jquery/dist/jquery.min.js /usr/share/nginx/html/node_modules/jquery/dist/jquery.min.js 
