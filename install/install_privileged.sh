# Add mongodb packages to apt repository
echo "deb http://downloads.mongodb.org/distros/ubuntu 10.10 10gen" >> /etc/apt/sources.list
apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10

# bring the base ubuntu distribution up to date
apt-get update
apt-get upgrade

# install mongodb
apt-get install mongodb-stable

# install essential libraries and build tools
apt-get install -y build-essential libssl-dev

# install useful tools and utilities
apt-get install -y emacs vim
