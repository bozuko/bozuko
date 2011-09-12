#!/bin/bash -e

# source the common stuff.
. $(pwd)/common.sh

echo "NODE_VER = $NODE_VER"

# node version manager (nvm)
install_nvm

# node.js
install_node

echo "export PATH=~/bozuko/bin:~/node_modules/.bin/:$PATH" >> ~/.bashrc
source ~/.bashrc

# node packages
echo "*** Installing node packages with npm"
cd ~ && npm install connect connect-auth express jade less mongodb@0.9.6-15 mongoose@2.1.2 monomi   \
    qs socket.io markdown-js async sprintf nodeunit nodemailer dateformat relative-date    \
    cluster imap node-uuid node-gd knox validator charm connect-form xml2json

# copy latest mongodb to mongoose dir so w:2 works
cp -R ~/node_modules/mongodb/* ~/node_modules/mongoose/node_modules/mongodb
