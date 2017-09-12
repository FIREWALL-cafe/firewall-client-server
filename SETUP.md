# Setup Instructions for Project Booth

### Flash the Raspberry Pi
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

