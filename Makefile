setup:
	debian/setup-debian.sh
	debian/setup-wordpress.sh
	debian/setup-apache.sh
	debian/setup-db.sh firewall firewall

certified:
	debian/setup-certified.sh
	sudo debian/setup-certified-ca.sh
	sudo debian/setup-certified-certs.sh
