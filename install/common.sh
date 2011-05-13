export NODE_VER=v0.4.7
export LIB=~/bozuko/node/lib

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


