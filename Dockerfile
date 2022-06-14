##############################################################################
# BUILD CONTAINER
##############################################################################
FROM oraclelinux:8.6 AS builder

ENV ORA_SDTZ=UTC
ENV LD_LIBRARY_PATH=/opt/instantclient_21_6

RUN dnf install -y libaio unzip
RUN dnf install -y @nodejs:16

RUN cd /opt && \
	curl -O https://download.oracle.com/otn_software/linux/instantclient/216000/instantclient-basiclite-linux.x64-21.6.0.0.0dbru.zip && \
	unzip /opt/instantclient-basiclite-linux.x64-21.6.0.0.0dbru.zip

RUN useradd --create-home node

RUN mkdir -p /home/node/node-oracledb-experiment
WORKDIR /home/node/node-oracledb-experiment

ADD dist/package.json .
ADD dist/package-lock.json .
RUN npm ci
ADD . .

RUN npm run build

WORKDIR /home/node/node-oracledb-experiment/dist

CMD node test/index.js

##############################################################################
# PRODUCTION CONTAINER
##############################################################################
FROM builder 

ENV NODE_ENV=production

RUN npm prune --production

USER node

CMD node src/index.js