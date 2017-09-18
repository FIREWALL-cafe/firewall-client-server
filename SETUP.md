# FWC Setup

## translate.firewallcafe.com

The hostname `translate.firewallcafe.com` points to the code in the `server` folder. In the Oslo installation, this ran on a Raspberry Pi. For the New York Freedom Forum installation, we are using an AWS EC2 micro instance.

### Install a cloud-based server

1. Launch a new EC2 server at https://console.aws.amazon.com/ec2 (Ubuntu 16.04 micro)
2. Copy the public IP address (in this case `34.235.124.69`)
3. Generate/download a new SSH key and save it to your `~/.ssh` folder (in our case, `translate.pem`)
4. Set up `~/.ssh/config`  
    ```
    Host translate
      Hostname 34.235.124.69
      ForwardAgent yes
      User ubuntu
      IdentityFile ~/.ssh/translate.pem
    ```
5. Set the file permissions: `chmod 600 ~/.ssh/translate.pem`
6. Extract the public key: `ssh-keygen -f ~/.ssh/translate.pem -y`
7. Copy/paste the public key into a new SSH key on GitHub: https://github.com/settings/keys
8. Login to the new machine: `ssh translate`
9. `sudo apt update` to update package list
10. `sudo apt upgrade -y` to upgrade software (keep existing `menu.lst` if prompted for it)
11. `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -` to [install `nodejs`](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
12. `sudo apt install nodejs -y`
13. `git clone git@github.com:dphiffer/firewall-cafe.git`
14. `cd firewall-cafe/server`
15. `cp config-example.js config.js`
16. `vi config.js`, edit `apiKey` value and `spreadsheetId`


### Flash a Raspberry Pi
1. Download the [latest Raspbian “lite” image](https://www.raspberrypi.org/downloads/raspbian/).
2. Plug in a MicroSD card.
3. Figure out which disk device it is. In this case, `/dev/disk2`:
```
df -h                                                                                    
Filesystem      Size   Used  Avail Capacity  iused      ifree %iused  Mounted on
/dev/disk1     926Gi  567Gi  358Gi    62% 52761306 4242205973    1%   /
devfs          189Ki  189Ki    0Bi   100%      654          0  100%   /dev
map -hosts       0Bi    0Bi    0Bi   100%        0          0  100%   /net
map auto_home    0Bi    0Bi    0Bi   100%        0          0  100%   /home
/dev/disk2s1    15Gi   32Ki   15Gi     1%        0          0  100%   /Volumes/NO NAME
```
4. Unmount it:
```
diskutil unmountDisk /dev/disk2
```
5. Write it to the disk device:
```
sudo dd bs=1m if=/Users/dphiffer/Downloads/2017-09-07-raspbian-stretch-lite.img of=/dev/rdisk2
```
6. Eject it: 
```
sudo diskutil eject /dev/disk2
```
7. Log in to the RPI and move through config sequence.

### Setup wireless router
1. Connect the wireless router to power, and connect to its network.
2. On a TP-Link router, access http://tplinkwifi.net to log in as admin (pw: `admin`).
3. Replace default password.
4. Go to Quick Setup > Client. Give the device a static IP.
5. Connect Ethernet cable to bottom of router, and plug into Ethernet switch.
6. Plug RPI into Ethernet switch.
7. Test connection to the Internet.

### Hardware
- In Chrome Extensions, ensure Firewall Cafe is installed and enabled. The proxy our extension enforces passes Google traffic through a VPN connection.
- Make sure your `~/.ssh/config` file contains the appropriate Raspberry PI host:

```
Host  vpn
      Hostname  phiffer.org
      User  fwc_client
      IdentityFile ~/.ssh/fwc_client
      DynamicForward 8888
      Compression yes
      ServerAliveInterval 300
      ServerAliveCountMax 2
```

One computer needs *not* to be routing its traffic through the VPN.


### Supply List
1. One or more Mac Minis
2. RaspberryPI
3. Wireless router (Using TP-Link 300Mbps Wireless N Mini Router)
4. Monitor
5. Ethernet switch

