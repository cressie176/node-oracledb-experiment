FROM oraclelinux:8.6

ENV ORA_SDTZ=UTC
ENV LD_LIBRARY_PATH=/opt/instantclient_21_6

RUN dnf install -y libaio unzip
RUN dnf install -y @nodejs:16

RUN cd /opt && \
	curl -O https://download.oracle.com/otn_software/linux/instantclient/216000/instantclient-basiclite-linux.x64-21.6.0.0.0dbru.zip && \
	unzip /opt/instantclient-basiclite-linux.x64-21.6.0.0.0dbru.zip

