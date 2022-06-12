FROM cressie176/node-oracledb-experiment-base:latest

RUN mkdir -p /opt/node-oracledb-experiment
WORKDIR /opt/node-oracledb-experiment
ADD dist/package.json .
ADD dist/package-lock.json .
RUN npm install
ADD dist .

CMD node src/index.js