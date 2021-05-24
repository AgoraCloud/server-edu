# https://blog.logrocket.com/containerized-development-nestjs-docker/
FROM node:12.13-alpine as development
WORKDIR /agoracloud
COPY package*.json ./
ARG NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
RUN echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN} \
    @agoracloud:registry=https://npm.pkg.github.com" > /agoracloud/.npmrc && \
    npm i && \
    rm -f /agoracloud/.npmrc
COPY . .
RUN npm i rimraf
RUN npm run build

FROM node:12.13-alpine as production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /agoracloud
COPY package*.json ./
ARG NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
RUN echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN} \
    @agoracloud:registry=https://npm.pkg.github.com" > /agoracloud/.npmrc && \
    npm i && \
    rm -f /agoracloud/.npmrc
COPY . .
COPY --from=development /agoracloud/dist ./dist
CMD ["npm", "run", "start:prod"]