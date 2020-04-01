## Building and Running application locally
```
# install nodejs dependencies
npm install

# builds and compiles to dist/index.js
npm run build

# runs application withh hot-reloading
npm start

# runs application in "production mode"
# npm run prod
```


## Dockerizing React Application

- uses nginx as a webserver to serve application

```
# Building the docker image
docker build . -t hysds_ui:latest

# Running image
docker run -p 8080:80 --network="host" hysds_ui:latest
```