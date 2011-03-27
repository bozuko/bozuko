export NODE_VER=v0.4.4
export LIB=~/bozuko/node/lib
export NPM_BIN=~/.npmbin
export NPM_LIB=~/.npmlib

function install_nvm() {
    echo "*** Installing nvm"
    if [[ ! -d ~/.nvm ]] ; then
        git clone git://github.com/creationix/nvm.git ~/.nvm
        echo '. ~/.nvm/nvm.sh' >> ~/.bashrc
    fi
    . ~/.nvm/nvm.sh || echo "ok"
}

function install_node() {
    echo "*** Installing node $NODE_VER"
    if [[ ! -d ~/.nvm/$NODE_VER ]] ; then
        nvm install $NODE_VER
        echo "nvm use $NODE_VER" >> ~/.bashrc
    fi
    nvm use $NODE_VER
}

function patch_expresso() {
    echo "*** Patching Expresso"
    git clone git://github.com/andrewjstone/expresso.git
    mv expresso/bin/expresso `which expresso`
    rm -rf expresso
}

