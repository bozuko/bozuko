#!/bin/bash -e

# source the common stuff.
. $(pwd)/common.sh

echo "NODE_VER = $NODE_VER"

# node version manager (nvm)
install_nvm

# node.js
install_node

echo "export PATH=~/node_modules/.bin/:$PATH" >> ~/.bashrc
source ~/.bashrc

# node packages
echo "*** Installing node packages with npm"
cd ~ && npm install connect connect-auth express jade mongodb mongoose monomi oauth qs socket.io markdown-js async sprintf nodeunit nodemailer dateformat relative-date cluster imap node-uuid node-gd knox
