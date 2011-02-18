#!/bin/bash

NODE_VER=v0.4.0
LIB=~/bozuko/node/lib

# create a library for unpackaged node modules
mkdir -p $LIB

# node version manager (nvm)
echo "*** Installing nvm"
git clone git://github.com/creationix/nvm.git ~/.nvm
echo '. ~/.nvm/nvm.sh' >> ~/.bashrc
. ~/.nvm/nvm.sh

# Create a fake npm so that nvm doesn't try to install it
# this is needed to prevent installing with sudo
echo "*** Installing fake npm"
PATH=~/bozuko/install:$PATH
touch npm
chmod +x npm

# node.js
echo "*** Installing node $NODE_VER"
nvm install $NODE_VER
echo "*** Using node $NODE_VER"
nvm use $NODE_VER

# Remove fake npm
echo "*** Removing fake npm"
rm npm

#node package manager (npm)
echo "*** Installing npm"
git clone http://github.com/isaacs/npm.git
cd npm
git submodule update --init
npm_config_unsafe_perm=true make install
cd ..
rm -rf npm

# node packages
echo "*** Installing node packages with npm"
npm config set unsafe-perm true
npm install connect-auth express jade mongodb mongoose monomi oauth qs socket.io supervisor

# multi-node
echo "*** Installing multi-node"
git clone https://github.com/kriszyp/multi-node.git multi-node
mv multi-node/lib/multi-node.js $LIB
rm -rf multi-node
