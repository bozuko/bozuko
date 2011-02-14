# Add add-apt-repository command
apt-get update
apt-get install -y python-software-properties

# Add mongodb repository
echo "deb http://downloads.mongodb.org/distros/ubuntu 10.10 10gen" >> /etc/apt/sources.list
apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10

# Add nginx repository
nginx=development
add-apt-repository ppa:nginx/$nginx

# bring the base ubuntu distribution up to date
apt-get update
apt-get upgrade

# install nginx
apt-get install -y nginx
cp config/nginx.conf /etc/nginx/

# install mongodb
apt-get install -y mongodb-stable

# make mongodb restartable if it crashes
echo "respawn" >> /etc/init/mongodb.conf
echo "respawn limit 10 5" >> /etc/init/mongodb.conf

# install essential libraries and build tools
apt-get install -y build-essential libssl-dev

# install useful tools and utilities
apt-get install -y emacs vim

#install all upstart scripts
cp upstart/* /etc/init
