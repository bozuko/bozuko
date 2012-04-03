if [ $1 ]; then
    cluster=$1
else
    "cluster not set for install. Defaulting to 'playground'"
    cluster=playground
fi

# Add add-apt-repository command
apt-get update
apt-get install -y python-software-properties

# Add mongodb repository
echo "deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen" >> /etc/apt/sources.list
apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10

# bring the base ubuntu distribution up to date
apt-get update
apt-get upgrade

# install mongodb
apt-get install -y mongodb-10gen
cp config/mongodb.conf /etc/mongodb.conf

# install essential libraries and build tools
apt-get install -y build-essential libssl-dev libgd2-noxpm-dev g++ barcode imagemagick libexpat1-dev curl

# install useful tools and utilities
apt-get install -y emacs vim js2-mode ufw rlwrap sysstat

# install all upstart scripts
cp upstart/* /etc/init

# install all logrotate config files
cp logrotate/* /etc/logrotate.d

# Setup DNS for the private network
cp config/$cluster/hosts /etc/hosts

# don't let ssh timeout
echo "ClientAliveInterval 30" >> /etc/ssh/sshd_config
echo "ClientAliveCountMax 4" >> /etc/ssh/sshd_config


# tweak kernel for servers
echo "*		 soft    nofile          64535" >> /etc/security/limits.conf
echo "* 	 hard	 nofile		 64535" >> /etc/security/limits.conf

# Install support for braintree python library (used for searching)
apt-get install -y python-pycurl-dbg python-pip
pip install braintree
