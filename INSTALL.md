## Privileged Install (root)
Run the following as root to setup a brand new image
This page will use **api** as the example user and **db1** as the hostname


#### Install emacs
    apt-get install emacs

#### Create proper user (bozuko, api, etc...)
     adduser api 

#### Give the user sudo privileges

Add the user to the sudo group by editing **/etc/group**

    sudo:x:37:api

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
    ssh-keygen -t rsa -b 4096 -C "root@db1.bozuko.com"

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

Add the following to **/etc/network/interfaces**. Use the address and netmask from the Linode "Remote Access" Tab.

    auto eth0:0
    iface eth0:0 inet static
    address X.X.X.X
    netmask Y.Y.Y.Y

Restart networking for the changes to take effect.

    /etc/init.d/networking restart

### Lock Down SSH

First you need to create a .ssh directory for the user since he hasn't logged in yet.

    mkdir ~api/.ssh && chown -hR api:api ~api/.ssh

Setup ssh keys for login on your local machine and install them as authorized keys for the appropriate user.

Follow the instructions on the [Security](https://github.com/bozuko/bozuko/wiki/Security) wiki page.

Edit **/etc/ssh/sshd_config** for the following operations.

Disable Root Login
    
    PermitRootLogin no

Disable Password Authentication. If you do this without configuring ssh keys you won't be able to login. 
New keys can be added later via sudo from the user account.

    PasswordAuthentication no

Restart ssh for the changes to take effect.

    restart ssh

## User Install

Login as the appropriate user and run the following commands


#### Generate ssh keys for your user. **Always use a password!**
    
    ssh-keygen -t rsa -b 4096 -C "api@db1.bozuko.com"

#### Add the key to the bozuko github account.
    
    cat ~/.ssh/id_rsa.pub

####Install bozuko

    cd ~/bozuko/install
    ./install.sh
    . ~/.bashrc


## DB configuration

All DB configruation should be done as root. The replica set name is **production** in this example.

If this server is not a DB, config server or arbiter you should uninstall mongodb. 

    apt-get remove mongodb


#### Configure mongodb to start in replica set mode

Add *--replSet* and *--nohttpinterface* parameters to mongod in **/etc/init/mongodb.conf** 

Also bind on **private** IP and localhost.

    --exec  /usr/bin/mongod -- --config /etc/mongodb.conf --replSet production --nohttpinterface --bind_ip '127.0.0.1, X.X.X.X'

Restart mongodb ensuring it re-reads it's config

    stop mongodb
    start mongodb

#### Configure the replica set on the proposed master

Use only **Private IPs** to configure your replSet. Use the primary application server as an arbiter.

You must configure your replica set inside the mongo shell on the proposed master. Wait a second to get the response from rs.initiate().

    mongo
    > Config = {
    ... _id: 'production', members: [
    ... {_id: 0, host: 'X.X.X.X'},
    ... {_id: 1, host: 'Y.Y.Y.Y'},
    ... {_id: 2, host: 'Z.Z.Z.Z', arbiterOnly: true}]}

    > rs.initiate(Config)
 
 Wait a minute and keep checking the status. You should see a Primary, Secondary and Arbiter.

    production:PRIMARY> rs.status()
    {
        "set" : "production",
        "date" : ISODate("2011-06-27T00:28:24Z"),
        "myState" : 1,
        "members" : [
            {
                "_id" : 0,
                "name" : "X.X.X.X",
                "health" : 1,
                "state" : 1,
                "stateStr" : "PRIMARY",
                "optime" : {
                    "t" : 1309134090000,
                    "i" : 1
                },
                "optimeDate" : ISODate("2011-06-27T00:21:30Z"),
                "self" : true
            },
            {
                "_id" : 1,
                "name" : "Y.Y.Y.Y",
                "health" : 1,
                "state" : 2,
                "stateStr" : "SECONDARY",
                "uptime" : 396,
                "optime" : {
                    "t" : 1309134090000,
                    "i" : 1                                                                                      },
                "optimeDate" : ISODate("2011-06-27T00:21:30Z"),
                "lastHeartbeat" : ISODate("2011-06-27T00:28:23Z"),
             },
             {
                  "_id" : 2,
                  "name" : "Z.Z.Z.Z",
                  "health" : 1,
                  "state" : 7,
                  "stateStr" : "ARBITER",
                  "uptime" : 396,
                  "optime" : {
                      "t" : 0,
                      "i" : 0
                  },
                  "optimeDate" : ISODate("1970-01-01T00:00:00Z"),
                  "lastHeartbeat" : ISODate("2011-06-27T00:28:22Z")
              }
          ], 
         "ok" : 1
     }
