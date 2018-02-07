#!/bin/sh

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`

UBUNTU=`dirname $WHOAMI`
ROOT=`dirname $UBUNTU`

echo "Installing dependencies"
sudo apt-get -qq update
sudo apt-get -qq -y install apache2 apache2-utils
sudo apt-get -qq -y install php php-cli php-curl php-mcrypt php-memcache php-mysql libapache2-mod-php7.0

echo "Configuring Apache"
for mod in proxy_wstunnel.load rewrite.load proxy.load proxy.conf proxy_http.load ssl.conf ssl.load socache_shmcb.load headers.load
do

    if [ -L /etc/apache2/mods-enabled/${mod} ]
    then
        sudo rm /etc/apache2/mods-enabled/${mod}
    fi

    if [ -f /etc/apache2/mods-enabled/${mod} ]
    then
        sudo mv /etc/apache2/mods-enabled/${mod} /etc/apache2/mods-enabled/${mod}.bak
    fi

    sudo ln -s /etc/apache2/mods-available/${mod} /etc/apache2/mods-enabled/${mod}
done

for conf_disable in javascript-common
do
    if [ -L /etc/apache2/conf-enabled/${conf_disable} ]
    then
        sudo rm /etc/apache2/conf-enabled/${conf_disable}
    fi

    if [ -f /etc/apache2/conf-enabled/${conf_disable} ]
    then
        sudo mv /etc/apache2/conf-enabled/${conf_disable} /etc/apache2/conf-enabled/${conf_disable}.disabled
    fi
done

echo "Configuring PHP"
for ctx in apache2 cli
do

    # We don't really need this part as long as 20-mcrypt.ini gets symplinked by default.
    # (20170317/dphiffer)

    #for mod in mcrypt.ini
    #do
    #    if [ -L /etc/php7/${ctx}/conf.d/${mod} ]
    #    then
    #        sudo rm /etc/php7/${ctx}/conf.d/${mod}
    #    fi

    #    if [ -f /etc/php7/${ctx}/conf.d/${mod} ]
    #    then
    #        sudo mv /etc/php7/${ctx}/conf.d/${mod} /etc/php7/${ctx}/conf.d/${mod}.bak
    #    fi

    #    sudo ln -s /etc/php7/mods-available/${mod} /etc/php7/${ctx}/conf.d/${mod}
    #done
    sudo perl -p -i -e "s/short_open_tag = Off/short_open_tag = On/" /etc/php7/${ctx}/php.ini;
done

if [ ! -d ${ROOT}/wordpress ]
then
    mkdir ${ROOT}/wordpress
fi

if [ ! -d ${ROOT}/wordpress/wp-admin ]
then
    echo "Downloading WordPress"
    curl -s -o ${ROOT}/wordpress/wordpress.zip https://wordpress.org/latest.zip
    echo "Unpacking WordPress"
    unzip -q ${ROOT}/wordpress/wordpress.zip
fi

if [ ! -f ${ROOT}/wordpress/wp-config.php ]
then
    echo "Configuring WordPress"
    cp ${ROOT}/wordpress/wp-config-sample.php ${ROOT}/wordpress/wp-config.php
    sed -i 's/database_name_here/firewall/' ${ROOT}/wordpress/wp-config.php
    sed -i 's/username_here/firewall/' ${ROOT}/wordpress/wp-config.php
    sed -i 's/password_here/thisisnotsecure123/' ${ROOT}/wordpress/wp-config.php
    sed -i 's/localhost/127.0.0.1/' ${ROOT}/wordpress/wp-config.php
fi

echo "Adjusting file permissions"
sudo chown -R www-data:www-data ${ROOT}/wordpress

sudo service apache2 restart
