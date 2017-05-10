#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

DEBIAN=`dirname $WHOAMI`
ROOT=`dirname $DEBIAN`

if [ ! -f /home/vagrant/.gitconfig ]; then
	# Putting this at the top so we don't fail midway through certified-ca.sh setup
	echo "This setup script uses your .gitconfig to autodetect your email address."
	echo "Please run:"
	echo
	echo "    git config --global user.email \"you@example.com\""
	echo "    git config --global user.name \"Your Name\""
	exit 1
fi

sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y install ruby-dev

# RDISCOUNT=`gem list | grep rdiscount | wc -l`
# guh.... dunno why this is necessary but it seems to be
# (20160226/thisisaaronland)

sudo gem install rdiscount

if [ ! -d ${ROOT}/certified ]
then

	sudo apt-get install -y ruby-ronn

	git clone https://github.com/rcrowley/certified.git ${ROOT}/certified
	cd ${ROOT}/certified

	sudo make install
	cd -
fi

TEST=`grep /certified ${ROOT}/.gitignore | wc -l`

if [ ${TEST} = 0 ]
then
    echo "/certified" >> ${ROOT}/.gitignore
fi
