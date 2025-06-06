# The platform option fixes `exec /usr/local/bin/docker-entrypoint.sh: exec format error` error in ECS
FROM --platform=linux/amd64 node:16.15.0
ENV NODE_ENV=production

WORKDIR /usr/app

# Copy all project files
COPY . .


# Install dependencies (for debugging and required libraries)
RUN apt-get update && apt-get install -y \
    vim \
    libsdl-pango-dev \
    postgresql \
    postgresql-contrib

# Setup PostgreSQL directories (ephemeral)
RUN mkdir -p /tmp/pgdata && chown -R postgres:postgres /tmp/pgdata

# Install Node dependencies
RUN npm install -g npm@9.1.3 react-scripts
RUN npm install

# Install dependencies
# RUN apt-get install -y libsdl-pango-dev
# RUN npm install -g \
#     npm@9.1.3 \
#     react-scripts

RUN cd /usr/app && npm install

# Build react
RUN cp react/src/config.dev.js react/src/config.js

# Make start script executable
RUN chmod +x /usr/app/start.sh

# Start both PostgreSQL and your app
CMD service postgresql start && \
    su - postgres -c "initdb -D /tmp/pgdata" && \
    su - postgres -c "pg_ctl -D /tmp/pgdata -l /tmp/logfile start" && \
    sleep 3 && \
    bash /usr/app/start.sh