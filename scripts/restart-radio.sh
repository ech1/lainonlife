#!/bin/bash

GREEN="\033[0;32m"
ORANGE="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -en "${GREEN}[+]${NC} Stopping Lainradio and Icecast... \n"
systemctl stop lainradio
systemctl stop icecast

echo -en "${GREEN}[+]${NC} Shutting down Lainradio backend ... \n"
kill $(pidof python3 backend.py)

echo -en "${GREEN}[+]${NC} Restarting Lainradio and Icecast ... \n"
systemctl enable --now lainradio
systemctl enable --now icecast

echo -en "${GREEN}[+]${NC} Waiting 5 seconds for icecast... \n"
sleep 5

echo -en "${GREEN}[+]${NC} Restarting the existing MPD channels... \n"




#save IFS
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")


CHANNELS="mpd*.service"

cd /etc/systemd/system/
for CHANNEL in $CHANNELS ;
do
        echo -en "${ORANGE}[+]${NC} Restarting $CHANNEL ... \n"
        systemctl restart $CHANNEL
done
cd -

#restore IFS
IFS=$SAVEIFS
