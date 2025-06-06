#!/bin/bash

function prd() { 

    set -e

    echo "=> Starting PostgreSQL service"
    /etc/init.d/postgresql start

    echo "=> Setting password for postgres user"
    su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""

    echo "=> Creating 'myipc' database if not exists"
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'myipc'\"" | grep -q 1 || \
    su - postgres -c "createdb myipc"

    echo "=> Installing IPC"
    node ipc-install

    echo "=> Starting Node App"
    node index
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
