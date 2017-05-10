#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

UBUNTU=`dirname $WHOAMI`
ROOT=`dirname $UBUNTU`

if [ -d ${ROOT}/wordpress/wp-content/themes/fwc ]
then
	if [ -d ${ROOT}/wordpress/wp-content/themes/fwc.bak ]
	then
		echo "Cleaning up old theme backup folder"
		sudo rm -rf ${ROOT}/wordpress/wp-content/themes/fwc.bak
	fi
	echo "Backing up current theme folder"
	sudo mv ${ROOT}/wordpress/wp-content/themes/fwc ${ROOT}/wordpress/wp-content/themes/fwc.bak
fi

if [ -L ${ROOT}/wordpress/wp-content/themes/fwc ]
then
	echo "Deleting existing theme symlink"
	sudo rm ${ROOT}/wordpress/wp-content/themes/fwc
fi

echo "Symlinking theme folder"
sudo ln -s ${ROOT}/wordpress-theme ${ROOT}/wordpress/wp-content/themes/fwc

if [ -d ${ROOT}/wordpress/wp-content/plugins ]
then
	if [ -d ${ROOT}/wordpress/wp-content/plugins.bak ]
	then
		echo "Cleaning up old plugins backup folder"
		sudo rm -rf ${ROOT}/wordpress/wp-content/plugins.bak
	fi
	echo "Backing up current plugins folder"
	sudo mv ${ROOT}/wordpress/wp-content/plugins ${ROOT}/wordpress/wp-content/plugins.bak
fi

if [ -L ${ROOT}/wordpress/wp-content/plugins ]
then
	echo "Deleting existing plugins symlink"
	sudo rm ${ROOT}/wordpress/wp-content/plugins
fi

echo "Symlinking plugins folder"
sudo ln -s ${ROOT}/wordpress-plugins ${ROOT}/wordpress/wp-content/plugins

date="$(date +'%Y%m%d')"

echo "Backing up the current database: firewall_${date}.sql"
echo "You will be prompted for the mysql root password..."
mysqldump -u root -p firewall > ${ROOT}/wordpress-db/firewall_${date}.sql

if [ -f ${ROOT}/wordpress-db/firewall.sql ]
then
	echo "Restoring database from: firewall.sql"
	echo "You will be prompted for the mysql root password..."
	mysql -u root -p firewall < ${ROOT}/wordpress-db/firewall.sql
else
	echo "Did not restore database; wordpress-db/firewall.sql was not found"
fi
