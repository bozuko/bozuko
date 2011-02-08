#!/bin/bash

# node volume manager (nvm)
git clone git://github.com/creationix/nvm.git ~/.nvm
chmod 755 ~/.nvm/nvm.sh
echo '. ~/.nvm/nvm.sh' >> ~/.bashrc
. ~/.bashrc

# node.js
nvm install v0.2.6

# node packages
npm install connect-auth express jade mongodb mongoose monomi oauth qs socket.io supervisor

# mongo-db
cd ~
MONGO_VER=mongodb-linux-x86_64-1.6.5
wget http://fastdl.mongodb.org/linux/${MONGO_VER}.tgz
tar xzf ${MONGO_VER}.tgz
rm ${MONGO_VER}.tgz