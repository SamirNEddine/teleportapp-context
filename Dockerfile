FROM node:alpine

WORKDIR /usr/src/app

ADD . .

RUN apk --no-cache --virtual build-dependencies add yarn \
    yarn && \
    yarn cache clean

## Wait for mongo database to run
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.5.1/wait /wait
RUN chmod +x /wait

## Launch the wait tool and then the application
CMD /wait && yarn run production