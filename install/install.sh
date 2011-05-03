#!/bin/bash -e

# source the common stuff.
. $(pwd)/common.sh

echo "NODE_VER = $NODE_VER"

# node version manager (nvm)
install_nvm

# node.js
install_node

source ~/.bashrc

# node packages
echo "*** Installing node packages with npm"
cd ~ && npm install connect-auth express expresso jade mongodb mongoose monomi oauth qs socket.io markdown-js async sprintf nodeunit nodemailer dateformat relative-date cluster

# Use our fork of expresso
patch_expresso
