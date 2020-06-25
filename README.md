## Pre-Requisites
* Node 6+ installed on machine
* npm installed

## Create config file
```
# create config file (if developing locally)
cp src/config/index.local-development.template.js src/config/index.js

# set your Elasticsearch host:port + indices/aliases
[config/index.js]
exports.GRQ_ES_URL = "http://localhost:9200";
exports.GRQ_ES_INDICES = "grq";
.
.
.
exports.MOZART_ES_URL = "http://localhost:9998";
exports.MOZART_ES_INDICES = "job_status";
```

## Building and Running application locally
```
# install nodejs dependencies
npm install

# builds and compiles to dist/index.js
npm run build

# run application in development mode with hot-reloading
npm start

# run application in "production mode"
npm run prod
```


## Dockerizing React Application

- uses nginx as a webserver to serve application

```
# Building the docker image
docker build . -t hysds_ui:latest

# Running image
docker run -p 8080:80 hysds_ui:latest
```

![Test Image 1](src/images/tosca.png)
