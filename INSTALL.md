## Privileged Install (root)
Run the following as root to setup a brand new image
This page will use **api** as the example user and **db1** as the hostname


#### Install emacs
    apt-get install emacs

#### Create proper user (bozuko, api, etc...)
     adduser api 

#### Set the hostname
    echo db1 > /etc/hostname
    hostname -F /etc/hostname

Open /etc/hosts and add the hostname to the end of the localhost line
    127.0.0.1 localhost db1 db1.bozuko.com

#### Prevent DHCP from setting the hostname
    emacs /etc/default/dhcpcd 

Comment out SET_HOSTNAME

     #SET_HOSTNAME='yes'

#### Install git
    apt-get install git

#### Generate ssh keys for root. **Always use a password!**
    ssh-keygen -t rsa -C "root@db1.bozuko.com"

#### Add key to bozuko github account
Copy the **public** key and add it to the github bozuko account 
http://help.github.com/linux-key-setup/

    cat ~/.ssh/id_rsa.pub

#### Clone the bozuko repo and install all dependencies that require root privileges
    BOZ_DIR=~api/bozuko
    git clone git@github.com:bozuko/bozuko.git $BOZ_DIR
    chown -hR api:api $BOZ_DIR
    cd $BOZ_DIR/install
    ./install_privileged.sh

#### Setup static networking for the private IP 

Add the following /etc/network/interfaces. Use the address you added from the Linode "Remote Access" Tab.
    auto eth0:0
    iface eth0:0 inet static
    address X.X.X.X
    netmask 255.255.255.0

Restart networking for the changes to take effect.
    /etc/init.d/networking restart
    

## User Install

Login as the appropriate user and run the following commands


#### Generate ssh keys for your user. **Always use a password!**
    ssh-keygen -t rsa -C "api@db1.bozuko.com"

#### Add the key to the bozuko github account.
     cat ~/.ssh/id_rsa.pub

####Install bozuko

    cd ~/bozuko/install
    ./install.sh
    . ~/.bashrc
