#!/bin/bash -e

NODE_VER=v0.4.0
LIB=~/bozuko/node/lib

# create a library for unpackaged node modules
mkdir -p $LIB

# node version manager (nvm)
echo "*** Installing nvm"
if [[ ! -d ~/.nvm ]] ; then
    git clone git://github.com/creationix/nvm.git ~/.nvm
    echo '. ~/.nvm/nvm.sh' >> ~/.bashrc
fi
. ~/.nvm/nvm.sh

# node.js
echo "*** Installing node $NODE_VER"
if [[ ! -d ~/.nvm/$NODE_VER ]] ; then
    nvm install $NODE_VER
    echo "nvm use $NODE_VER" >> ~/.bashrc
fi
nvm use $NODE_VER

#node package manager (npm)
NPM_BIN=~/.npmbin
NPM_LIB=~/.npmlib
PATH=$NPM_BIN:$PATH
echo "export PATH=$PATH" >> ~/.bashrc
NODE_PATH=$NPM_LIB:$NODE_PATH
echo "export NODE_PATH=$NODE_PATH" >> ~/.bashrc
npm config set root $NPM_LIB
npm config set binroot $NPM_BIN
npm config set unsafe-perm true

# node packages
echo "*** Installing node packages with npm"
npm install connect-auth express expresso jade mongodb mongoose monomi oauth qs socket.io supervisor

# Patch expresso using my fork -- Remove when expresso gets fixed
echo "*** Patching Expresso"
git clone git://github.com/andrewjstone/expresso.git
cp expresso/bin/expresso `which expresso`
rm -rf expresso

# multi-node
echo "*** Installing multi-node"
git clone https://github.com/kriszyp/multi-node.git multi-node
mv multi-node/lib/multi-node.js $LIB
rm -rf multi-node
