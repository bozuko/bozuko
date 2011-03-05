#!/bin/bash -e

# source the common stuff.
. $(pwd)/common.sh

echo "NODE_VER = $NODE_VER"

# node version manager (nvm)
install_nvm

# node.js
install_node

#node package manager (npm)
PATH=$NPM_BIN:$PATH
echo "export PATH=$PATH" >> ~/.bashrc
NODE_PATH=$NPM_LIB:$NODE_PATH
echo "export NODE_PATH=$NODE_PATH" >> ~/.bashrc
source ~/.bashrc
npm config set root $NPM_LIB
npm config set binroot $NPM_BIN
npm config set unsafe-perm true

# node packages
echo "*** Installing node packages with npm"
npm install connect-auth express expresso jade mongodb mongoose monomi oauth qs socket.io supervisor

# Use our fork of expresso
patch_expresso

# multi-node
echo "*** Installing multi-node"
git clone https://github.com/kriszyp/multi-node.git multi-node
cd multi-node
npm install
cd ..
rm -rf multi-node
