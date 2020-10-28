# NODE AND NPM LTS
FROM node:8.6.0

# CREATE APP DIR
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# INSTALL DEPENDENCIES
COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app

RUN npm install

COPY . /usr/src/app

ENV NODE_ENV production

RUN npm run build

# START AND EXPOSE TO HOST-DAEMON
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/npm", "run"]
