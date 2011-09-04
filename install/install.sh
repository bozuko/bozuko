#!/bin/bash -e

if ($1) then
    cluster=$1
else
    cluster=playground
fi

# source the common stuff.
. $(pwd)/common.sh

echo "NODE_VER = $NODE_VER"

# install authorized keys
cp config/$cluster/authorized_keys ~/.ssh

# node version manager (nvm)
install_nvm

# node.js
install_node

echo "export PATH=~/bozuko/bin:~/node_modules/.bin/:$PATH" >> ~/.bashrc
source ~/.bashrc

# node packages
echo "*** Installing node packages with npm"
cd ~ && npm install connect connect-auth express jade less mongodb mongoose@2.1.0 monomi   \
    qs socket.io markdown-js async sprintf nodeunit nodemailer dateformat relative-date    \
    cluster imap node-uuid node-gd knox validator charm 


# install my version of node-mongodb-native so w:2 works. Remove when patch is accepted.
git clone git@github.com:andrewjstone/node-mongodb-native.git
cp -R node-mongodb-native/* ~/node_modules/mongodb/
cp -R node-mongodb-native/* ~/node_modules/mongoose/node_modules/mongodb/
rm -rf node-mongodb-native
