#! /bin/bash

#DISCLAIMER IF YOU WANT TO USE THIS SCRIPT:
#PLACE IT IN /srv/radio/music
# INTO THIS FOLDER THERE MUST BE YOUR CHANNEL FOLDERS
#
# /srv/radio/music/channel/album/songs.mp3
#
# ^ THIS IS THE REQUIRED DIRECTORY TREE
#
# this script will help you TAG the songs.mp3 with the ALBUM album directory they are in, as well as tag their TITLE with their FILENAME.
#

GREEN="\033[0;32m"
ORANGE="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -en "${GREEN}[+]${NC} Type the name of the channel directory (ex: cyberia): "
read channel


#### First list the songs and ask if the user wants to add the album tag to them:

#change IFS
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")


ALBUMS="*"
cd $channel
for ALBUM in $ALBUMS ;
do
        echo -en "\n ${ORANGE}[+] $ALBUM${NC}"
        cd $ALBUM
        SONGS="*"
        for SONG in $SONGS ;
        do
                echo -en "\n ${GREEN} [+] $SONG${NC}"
                if [ $ALBUM == "transitions" ];
                then
                        echo "Lainchan Radio Transitions - $SONG"
                else
                        if [ $ALBUM == "DUMP" ];
                        then
                                echo "$SONG - $SONG"
                        else
                                echo "$ALBUM - $SONG"
                        fi
                fi
        done
        cd ..
done

cd ..

#restore IFS
IFS=$SAVEIFS


echo -en "\n\n${GREEN}[+]${NC} add the ${RED}$album${NC} ${ORANGE}album${NC} tag to these ${GREEN}songs ${NC}? (y/n)"
read choice






####### If user says 'y' then add the album tag to the selected songs:
if [ "$choice" == "y" ];
then
        echo 'yes'
        #change IFS
        SAVEIFS=$IFS
        IFS=$(echo -en "\n\b")


        ALBUMS="*"
        cd $channel
        for ALBUM in $ALBUMS ;
        do
                echo -en "\n ${ORANGE}[+] $ALBUM${NC}"
                cd $ALBUM
                SONGS="*"
                for SONG in $SONGS;
                do
                        echo -en "\n ${GREEN} [+] $SONG${NC}"
                        if [ $ALBUM == "transitions" ];
                        then
                                id3tag  --album="Lainchan Radio Transitions" $SONG
                                id3tag  --song=\"$SONG\" $SONG
                        else
                                if [ $ALBUM == "DUMP" ]; #directory to dump all the tracks into, each song is it's own album in there basically.
                                then
                                        id3tag  --album=\"$SONG\" $SONG
                                        id3tag  --song=\"$SONG\" $SONG
                                else
                                        id3tag  --album=\"$ALBUM\" $SONG
                                        id3tag  --song=\"$SONG\" $SONG
                                fi
                        fi
                done
                cd ..
        done
        cd ..
        #restore IFS
        IFS=$SAVEIFS

else
        echo -en "\n${RED}[+] Cancelling... ${NC}"
fi


echo
exit
