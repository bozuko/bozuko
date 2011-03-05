#!/bin/bash -e

# source the common stuff.
. $(pwd)/common.sh

install_nvm
install_node
npm update
patch_expresso

