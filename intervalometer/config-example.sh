#!/bin/bash

# change these parts
chrome="/Applications/Google Chrome beta.app/Contents/MacOS/Google Chrome"
size="1920,1080"
query="party"

# urlencode the query
query="$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$query")"

# insert the query
url="https://image.baidu.com/search/index?tn=baiduimage&ipn=r&ct=201326592&cl=2&lm=-1&st=-1&fm=index&fr=&hs=0&xthttps=111111&sf=1&fmq=&pv=&ic=0&nc=1&z=&se=1&showtab=0&fb=0&width=&height=&face=0&istype=2&ie=utf-8&word=$query&oq=$query&rsp=-1"
timestamp=`date +"%Y%m%d-%H%M%S"`
filename="$timestamp.png"

echo "$url => $filename"
