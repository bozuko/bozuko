## PRE_INSTALL
Run the following as root to setup a brand new image

#### Install emacs
    apt-get install emacs

#### Create proper user (bozuko, api, etc...)
     adduser <user> 


#### Set the hostname
    echo "HOSTNAME" > /etc/hostname
    hostname -F /etc/hostname


#### Prevent DHCP from setting the hostname
    emacs /etc/default/dhcpcd 

Comment out SET_HOSTNAME

     #SET_HOSTNAME='yes'


#### Install git
    apt-get install git

#### Generate ssh keys for root
    ssh-keygen -t rsa -C "root@<hostname>.bozuko.com"


#### Add key to bozuko github account
Copy the key and add it to the github bozuko account 
with read-only permissions via the web interface
http://help.github.com/linux-key-setup/

    cat ~/.ssh/id_rsa.pub


#### Clone the bozuko repo and install all dependencies that require root privileges
    BOZ_DIR=~<username>/bozuko
    git clone git@github.com:bozuko/bozuko.git $BOZ_DIR
    chown -hR <username>:<username> $BOZ_DIR
    cd $BOZ_DIR/install

##### If this is an appserver run the following
     ./install_privileged.sh

##### if this is a db server run the following
    ./install_privileged.sh db

If this is not a DB server then you want to install node.

## INSTALL

Run the folllowing as user bozuko to install bozuko and it's dependencies.

    cd ~/bozuko/install
    ./install.sh
    . ~/.bashrc