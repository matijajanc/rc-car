# Hardware-free RC car bridge — runs the WebSocket server with the built-in
# car simulator, so the whole stack works with zero serial hardware.
#
# For talking to a REAL car, run the server on the host (npm start with
# SIMULATE=false) where the serial device and the optional native `serialport`
# module are available. This image deliberately omits that native dependency.
#
# Build context is the repository root (the server imports ../../shared/protocol):
#   docker build -f node_server/Dockerfile -t rc-car-server .
FROM node:20-alpine

WORKDIR /app
RUN chown node:node /app
USER node

# Install dependencies first for better layer caching. Optional native deps
# (serialport) are skipped — the simulator needs no hardware or native build.
COPY --chown=node:node node_server/package.json node_server/package-lock.json ./node_server/
RUN cd node_server && npm ci --omit=optional --no-audit --no-fund

# Source: the shared protocol must keep its relative position to node_server.
COPY --chown=node:node tsconfig.base.json ./tsconfig.base.json
COPY --chown=node:node shared ./shared
COPY --chown=node:node node_server ./node_server

WORKDIR /app/node_server

ENV NODE_ENV=production \
    SIMULATE=true \
    WS_PORT=8085 \
    WS_HOST=0.0.0.0

EXPOSE 8085
CMD ["npm", "start"]
