FROM ghcr.io/centrefordigitalhumanities/ianalyzer-backend:latest

RUN pip install --upgrade pip
# make a directory in the container
WORKDIR /backend
# copy requirements from the host system to the directory in the container
COPY requirements.txt /backend/
# run pip install on container
RUN pip install -r requirements.txt
