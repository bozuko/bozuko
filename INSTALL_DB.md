## Privileged Install (root)
Run the following as root to setup a brand new image
This page will use **playground** as the example user and **db1** as the hostname

#### Install emacs
    apt-get install emacs

#### Create proper user (bozuko, playground, etc...)
     adduser playground 

#### Give the user sudo privileges

Add the user to the sudo group by editing **/etc/group**

    sudo:x:37:playground

#### Set the hostname
    echo db1 > /etc/hostname
    hostname -F /etc/hostname

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

Ensure you call install_priveleged.sh with either **playground** or **production**. Install defaults to playground.
    
    git clone git@github.com:bozuko/bozuko.git
    cd bozuko/install
    ./install_privileged.sh playground

#### Setup static networking for the private IP 

Add the following to **/etc/network/interfaces**. Use the address and netmask from the Linode "Remote Access" Tab.

    auto eth0:0
    iface eth0:0 inet static
    address X.X.X.X
    netmask Y.Y.Y.Y

Restart networking for the changes to take effect.
    /etc/init.d/networking restart


### Lock Down SSH

First you need to create a .ssh directory for the user since he hasn't logged in yet. Note for dbs, the user doesn't need a key on this machine as Bozuko will not be installed there.

    SSH_DIR=~playground/.ssh 
    mkdir $SSH_DIR
    cp ~/bozuko/install/config/playground/authorized_keys $SSH_DIR/authorized_keys
    chown -hR playground:playground $SSH_DIR

Edit **/etc/ssh/sshd_config** for the following operations.

Disable Root Login
    
    PermitRootLogin no

Disable Password Authentication. If you do this without configuring ssh keys you won't be able to login. 
New keys can be added later via sudo from the user account.

    PasswordAuthentication no

Restart ssh for the changes to take effect.

    restart ssh


## Configure the DB
All DB configruation should be done as root. The replica set name is **playground** in this example.

#### Configure mongodb to start in replica set mode

Add *--replSet* parameter to mongod in **/etc/init/mongodb.conf** 

Also bind on **private** IP and localhost. Ensure the --bind_ip argument doesn't have any spaces!

    --exec  /usr/bin/mongod -- --config /etc/mongodb.conf --replSet playground --bind_ip '127.0.0.1,X.X.X.X'

Restart mongodb ensuring it re-reads it's config

    stop mongodb
    start mongodb

#### Configure the replica set on the proposed master

Use only **Private IPs or Host Names** to configure your replSet. Use the primary application server as an arbiter.

You must configure your replica set inside the mongo shell on the proposed master. Wait a second to get the response from rs.initiate().

    mongo
    > Config = {
    ... _id: 'playground', members: [
    ... {_id: 0, host: 'X.X.X.X'},
    ... {_id: 1, host: 'Y.Y.Y.Y'},
    ... {_id: 2, host: 'Z.Z.Z.Z', arbiterOnly: true}]}

    > rs.initiate(Config)
 
 Wait a minute and keep checking the status. You should see a Primary, Secondary and Arbiter.

    playground:PRIMARY> rs.status()
    {
        "set" : "playground",
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
