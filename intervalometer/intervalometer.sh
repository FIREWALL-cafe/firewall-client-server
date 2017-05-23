#!/bin/bash

# Install this as a cronjob
# Works with Chrome v59+
# https://developers.google.com/web/updates/2017/04/headless-chrome
# https://www.google.com/chrome/browser/beta.html
# Also uses ffmpeg to convert into JPGs

WHOAMI=`python -c 'import os, sys; print os.path.realpath(sys.argv[1])' $0`
DIR=`dirname $WHOAMI`

if [ ! -f "$DIR/config.sh" ]
then
	cp "$DIR/config-example.sh" "$DIR/config.sh"
fi

source "$DIR/config.sh"

"$chrome" --headless --disable-gpu --screenshot --window-size=$size $url >> /dev/null
sips -s format jpeg "$DIR/screenshot.png" --out "$DIR/images/$timestamp.jpg"
