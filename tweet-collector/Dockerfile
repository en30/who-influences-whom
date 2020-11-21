FROM hexpm/elixir:1.11.2-erlang-23.1.1-debian-stretch-20200607 AS build

# install build dependencies
RUN apt-get update
RUN apt-get install -y curl locales

RUN sed -i 's/^# *\(en_US.UTF-8\)/\1/' /etc/locale.gen
RUN locale-gen
ENV LC_ALL=en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8

# prepare build dir
WORKDIR /app

# install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# set build ENV
ENV MIX_ENV=prod

# install mix dependencies
COPY mix.exs mix.lock ./
COPY config config
RUN mix do deps.get, deps.compile

# COPY priv priv

# compile and build release
COPY lib lib

# uncomment COPY if rel/ exists
# COPY rel rel
RUN mix do compile, release

# prepare release image
FROM debian:stretch-20200607 AS app
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y openssl libncurses5 ca-certificates
RUN update-ca-certificates --fresh

WORKDIR /app

RUN groupadd -r deploy && useradd -r -g deploy deploy && chown deploy:deploy /app

USER deploy:deploy

COPY --from=build --chown=deploy:deploy /app/_build/prod/rel/tweet_collector ./
COPY --from=asia-docker.pkg.dev/berglas/berglas/berglas:latest /bin/berglas /bin/berglas

ENV HOME=/app

CMD exec /bin/berglas exec -- bin/tweet_collector start
