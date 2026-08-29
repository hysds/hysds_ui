# building React app
FROM node:13 as build

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm install --silent
RUN npm run build

# npm 6 running as root (which is what this build is) skips the root package's lifecycle
# scripts with only a warning and still exits 0, so the reactivecore patch can silently
# fail to apply. `prebuild` covers that, but verify rather than assume: an unpatched bundle
# looks identical and reintroduces the stale-results bug.
RUN grep -q "_msearchSeq" node_modules/@appbaseio/reactivecore/lib/actions/query.js \
 && npm test


# Creating the web server
FROM nginx:1.13.12-alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
