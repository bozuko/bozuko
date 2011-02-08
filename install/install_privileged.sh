# install essential libraries and build tools
apt-get install -y build-essential libssl-dev

# create mongodb directories
mkdir -p /data/db/
chown `id -u` /data/db
# FIXME: cp a run script to the right spot to be started on boot

# install useful tools and utilities
apt-get install -y emacs vim
