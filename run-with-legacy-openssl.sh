#!/bin/bash

# Script to run npm commands with legacy OpenSSL provider
# This fixes the Node.js v17+ OpenSSL compatibility issue with older webpack versions

export NODE_OPTIONS="--openssl-legacy-provider"

# Run the command passed as arguments
exec "$@"
