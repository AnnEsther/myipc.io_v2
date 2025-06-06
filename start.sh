#!/bin/bash

function prd() { 
    set -e
    trap "echo 'Stopping Postgres...'; su - postgres -c 'pg_ctl -D /tmp/pgdata stop'" EXIT

    echo "Starting PostgreSQL..."
    service postgresql start

    if [ ! -d /tmp/pgdata ]; then
        echo "Initializing DB..."
        su - postgres -c "initdb -D /tmp/pgdata"
    fi

    echo "Starting Postgres..."
    su - postgres -c "pg_ctl -D /tmp/pgdata -l /tmp/logfile start"

    sleep 3

    echo "=> Running IPC Install"
    node ipc-install || echo "IPC install failed"

    echo "=> Starting Express App"
    node index || echo "App failed to start"
 }

function debug() { sleep 999999999 ; }

function dev() {
    echo "=> start post 3000 and wait for it to become available"
    cd /usr/app/react && npm start&
    while [ 1 ] ; do
        curl -s http://localhost:3000
        [ $? -eq 0 ] && break
        sleep 1
    done

    echo "=> start port 2000"
    cd /usr/app && node index
}

git describe --dirty | tee VERSION
prd
