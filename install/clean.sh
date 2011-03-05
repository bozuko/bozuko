#!/bin/bash -e

# source the common stuff.
. $(pwd)/common.sh

# remove nvm, node and npm
rm -rf ~/.nvm

# remove npm installed apps and config
rm -rf $NPM_LIB
rm -rf $NPM_BIN
rm -f ~/.npmrc