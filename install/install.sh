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
cd ~ && npm install connect connect-auth express@2.5.11 jade less mongodb@0.9.7-2-5 mongoose@2.4.8 monomi   \
    qs socket.io markdown-js async sprintf nodeunit nodemailer@0.2.4 dateformat relative-date    \
    cluster imap node-uuid node-gd knox validator charm connect-form xml2json@0.2.4 pdfkit@0.1.6 braintree \
    cli-table cli-chart codify node-expat flatmerge measure

# copy latest mongodb to mongoose dir so w:2 works
cp -R ~/node_modules/mongodb/* ~/node_modules/mongoose/node_modules/mongodb
