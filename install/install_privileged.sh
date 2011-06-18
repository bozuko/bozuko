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

# install essential libraries and build tools
apt-get install -y build-essential libssl-dev libgd2-xpm-dev g++

# install useful tools and utilities
apt-get install -y emacs vim js2-mode

# install all upstart scripts
cp upstart/* /etc/init

# don't let ssh timeout
echo "ClientAliveInterval 30" >> /etc/ssh/sshd_config
echo "ClientAliveCountMax 4" >> /etc/ssh/sshd_config


# tweak kernel for servers
echo "*		 soft    nofile          50000" >> /etc/security/limits.conf
echo "* 	 hard	 nofile		 50000" >> /etc/security/limits.conf

