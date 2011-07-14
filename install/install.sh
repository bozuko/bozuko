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
cd ~ && npm install connect connect-auth express jade less mongodb mongoose@1.4.0 monomi oauth qs socket.io markdown-js async sprintf nodeunit nodemailer dateformat relative-date cluster imap node-uuid node-gd knox validator

#install commando
git clone git@github.com:bozuko/commando.git
npm install commando
rm -rf commando
cp ~/bozuko/install/config/commando.conf ~/.commando

#install mycroft
git clone git@github.com:bozuko/mycroft.git
npm install mycroft
rm -rf mycroft
cp ~/bozuko/install/config/mycroft.conf ~/.mycroft
