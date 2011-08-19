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

# Install multimeter. Use normal npm install when bar.prototype.ratio patch is accepted.
git clone git@github.com:andrewjstone/node-multimeter.git
npm install node-multimeter
rm -rf node-multimeter

# node packages
echo "*** Installing node packages with npm"
cd ~ && npm install connect connect-auth express jade less mongodb mongoose@1.8.0 monomi   \
    qs socket.io markdown-js async sprintf nodeunit nodemailer dateformat relative-date    \
    cluster imap node-uuid node-gd knox validator charm 
