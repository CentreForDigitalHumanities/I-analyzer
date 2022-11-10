# Base image
FROM python:3.8-buster
# Setting this means stdout and stderr streams are sent to terminal in real time
ENV PYTHONUNBUFFERED 1
# Get required libraries for xmlsec
RUN apt-get -y update
RUN apt-get install -y pkg-config libxml2-dev libxmlsec1-dev libxmlsec1-openssl default-libmysqlclient-dev

# make a directory in the container
WORKDIR /backend
# copy files from the host system to the directory in the container
COPY requirements.txt /backend/
# run pip install on container
RUN pip install -r requirements.txt
