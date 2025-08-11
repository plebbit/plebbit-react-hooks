#!/usr/bin/env bash

xterm -geometry "-0+0" -e "yarn build:watch" &
xterm -geometry "-0-0" -e "yarn test:server" &
sleep infinity
