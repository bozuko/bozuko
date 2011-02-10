#!/bin/bash

# node volume manager (nvm)
git clone git://github.com/creationix/nvm.git ~/.nvm
echo '. ~/.nvm/nvm.sh' >> ~/.bashrc
. ~/.nvm/nvm.sh

# node.js
nvm install v0.2.6
nvm use v0.2.6

# node packages
npm install connect-auth express jade mongodb mongoose monomi oauth qs socket.io supervisor
