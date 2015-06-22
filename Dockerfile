FROM node:0.10-onbuild

ADD . /

WORKDIR /

RUN npm install

ENV SERVICE_PORT=5011
ENV CONTRACT_TIMEOUT=60000
ENV RETRY_TIMEOUT=5000
ENV DISCOVERY_SERVICE_URLS=http://46.101.138.192:8500;http://46.101.191.124:8500
ENV HOOK_URLS=http://46.101.191.124:5984/contracts

ENTRYPOINT npm start
