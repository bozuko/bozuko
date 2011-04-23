#!/bin/bash
#
# The tools in this file do not need to be installed on production servers and probably shouldn't be.
#

# Dependencies
sudo apt-get install ncurses-dev

# Erlang/OTP
OTP=otp_src_R14B02
wget http://www.erlang.org/download/${OTP}.tar.gz
tar xvzf ${OTP}.tar.gz
cd $OTP
./configure && make && sudo make install

# Tsung
TSUNG=tsung-1.3.3
wget http://tsung.erlang-projects.org/dist/${TSUNG}.tar.gz
tar xvzf ${TSUNG}.tar.gz
cd $TSUNG
./configure && make && sudo make install

# Gnuplot
sudo apt-get install gnuplot
