#!/bin/bash

NODE_VER=v0.4.0
LIB=~/bozuko/node/lib

# create a library for unpackaged node modules
mkdir -p $LIB

# node version manager (nvm)
git clone git://github.com/creationix/nvm.git ~/.nvm
echo '. ~/.nvm/nvm.sh' >> ~/.bashrc
. ~/.nvm/nvm.sh

# node.js
nvm install $NODE_VER
nvm use $NODE_VER

# node packages
npm install connect-auth express jade mongodb mongoose monomi oauth qs socket.io supervisor

# multi-node
git clone https://github.com/kriszyp/multi-node.git multi-node
mv multi-node/lib/multi-node.js $LIB
rm -rf multi-node
