// The initial channel
let channel = DEFAULT_CHANNEL;

// Recurring timers
let playlistPoll;
let statusPoll;

//initial volume
let currentVolume = parseInt("10",10);

const audioContext = new window.AudioContext();
const audioTag = document.getElementById("audio");

function ajax_with_json(url, func) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if(httpRequest.readyState === XMLHttpRequest.DONE && httpRequest.status === 200) {
                //console.log(httpRequest.responseText);
            let response = JSON.parse(httpRequest.responseText);
                //console.log(response);
            func(response);
        }
    };

    httpRequest.open("GET", url);
    httpRequest.send();
}

function populate_channel_list() {
    ajax_with_json(ICECAST_STATUS_URL, function(response) {
        // Get the list of channels, the default.
        let channels = [];
        //console.log(channels);

        for(let id in response.icestats.source) {
            let source = response.icestats.source[id];
            let sname = source.server_name;
            if(sname !== undefined && sname.startsWith("[mpd] ") && sname.endsWith(" (mp3)")) {
                channels.push(sname.substr(6, sname.length-12));
            }
        }

        // Sort them.
        channels.sort();
        console.log(channels);

        // Add to the selector drop-down.
        let dropdown = document.getElementById("channel");
        for(let id in channels) {
            let channel = channels[id];
            dropdown.options[dropdown.options.length] = new Option(channel, channel, channel == DEFAULT_CHANNEL, channel == DEFAULT_CHANNEL);
        }
    });
}

function check_playlist() {
    function format_track(track){
        return (track.artist) ? (track.artist + " - " + track.title) : track.title;
    }

    function add_track_to_tbody(tbody, track, acc, ago) {
        // Create row and cells
        let row   = tbody.insertRow((ago === true) ? 0 : tbody.rows.length);
        let dcell = row.insertCell(0);
        let tcell = row.insertCell(0);
        dcell.className = "dur";
        tcell.className = "track";

        // The track
        tcell.innerText = format_track(track);

        if(acc == undefined) {
            dcell.classList.add("current_track");
            tcell.classList.add("current_track");

            let arrow = document.createElement("i");
            arrow.classList.add("fa");
            arrow.classList.add("fa-arrow-circle-o-left");
            dcell.appendChild(arrow);
        } else {
            // The duration
            let time = "";
            if(acc < 60) {
                time = "under a min";
            } else {
                time = Math.round(acc / 60);
                time += " min" + ((time==1) ? "" : "s");
            }
            dcell.innerText = ago ? time + " ago" : "in " + time;
        }

        // New accumulator
        return acc + parseFloat(track.time);
    }

    function swap_tbody(id, tbody) {
        let old = document.getElementById(id);
        old.parentNode.replaceChild(tbody, old);
        tbody.id = id;
    }

    ajax_with_json(`/playlist/${channel}.json`, function(response) {
        // Update the "now playing"
        document.getElementById("nowplaying").innerText = format_track(response.current);
        document.getElementById("nowalbum").innerText = response.current.album;

        let new_playlist = document.createElement("tbody");
        let until = parseFloat(response.current.time) - parseFloat(response.elapsed);
        let ago   = parseFloat(response.elapsed);
        for(let i in response.before) {
            ago = add_track_to_tbody(new_playlist, response.before[i], ago, true);
        }
        add_track_to_tbody(new_playlist, response.current, undefined, false);
        for(let i in response.after) {
            until = add_track_to_tbody(new_playlist, response.after[i], until, false);
        }
        swap_tbody("playlist_body", new_playlist);

        LainPlayer.updateProgress({
            length: response.current.time,
            elapsed: response.elapsed,
        });

        //listeners are broken RN it's all 1 peak 1 so instead we go and find it elsewhere:
        // Update the current/peak listeners counts
        //document.getElementById("listeners").innerText = `${response.listeners.current}`;
        //if ('peak' in response.listeners) {
         //   document.getElementById("listeners").innerText += ` (peak ${response.listeners.peak})`;
        //}
    });
        ajax_with_json(`/radio/status-json.xsl`, function(response) {
                //console.log(`${channel}`);
                //for(i=0 ; i<4 ; i++){
                //console.log(response.icestats.source);
                //}
                let iceresponse = response.icestats.source;
                //console.log(iceresponse);
                let currentchannel= `${channel}`;
                for(d in iceresponse){
                        //console.log(d);
                        //console.log(iceresponse[d]);
                        //CHECK IF iceresponse[d].server_name EXISTS OR NOT !!!!!!!!
                        //that is because for some reason on the icecast status list, there are some streams like cyberia.mp3 (NOT mpd-cyberia.mp3) which dont even have the listeners tag
                        if(typeof(iceresponse[d].server_name) != "undefined")
                        {
                                let icechannel = iceresponse[d].server_name ;
                                let listedchannel =  icechannel.substr(6, icechannel.length-12);
                                //console.log(listedchannel);
                                //console.log(currentchannel);
                                if(listedchannel == currentchannel){
                                        //console.log("do the listeners!")
                                        //console.log(currentchannel);
                                        //console.log(iceresponse[d].listeners)
                                        //console.log(iceresponse[d].listener_peak)
                                        document.getElementById("listeners").innerText = `${iceresponse[d].listeners}`;
                                        document.getElementById("listeners").innerText += `  (peak ${iceresponse[d].listener_peak})`;
                                }
                        }

                        //if(reponse[i].server_name == `${channel}`){
                        //      console.log('we gottem')
                        //}else{
                        //      console.log('we dont gottem')
                        //}
                }
        });

}

function change_channel(e) {
    //console.log(e)
    //console.log(e.value)
    channel = e.value;
    LainPlayer.changeChannel(channel);

    // Update the stream links.
    document.getElementById("mp3link").href = `${ICECAST_STREAM_URL_BASE}/${channel}.mp3`;

    // Update the file list link.
    document.getElementById("fileslink").href = "/file-list/" + channel + ".html";

    // clear the running Intervals
    // this is needed for the smooth progressbar update to be in sync
    clearInterval(statusPoll);
    clearInterval(playlistPoll);

    // Update the playlist and reset the Intervals
    check_playlist();
    playlistPoll = setInterval(check_playlist, 15000);
}


function change_channel2(e) {
    //get the dropdown list of items of channels
    var list = document.getElementsByTagName('option');
    for(var i = 0; i < list.length; ++i){
        //alert(list.options[i].value);
        if(list[i].value == e){
                list[i].selected = true;
                break;
        }
    }

    //ususal channel switching:
    channel = e;
    LainPlayer.changeChannel(channel);

    // Update the stream links.
    document.getElementById("mp3link").href = `${ICECAST_STREAM_URL_BASE}/${channel}.mp3`;

    // Update the file list link.
    document.getElementById("fileslink").href = "/file-list/" + channel + ".html";

    // clear the running Intervals
    // this is needed for the smooth progressbar update to be in sync
    clearInterval(statusPoll);
    clearInterval(playlistPoll);

    // Update the playlist and reset the Intervals
    check_playlist();
    playlistPoll = setInterval(check_playlist, 15000);


}

function next_channel(){
    ajax_with_json(ICECAST_STATUS_URL, function(response) {
        let channels = [];
        //console.log(channels);

        for(let id in response.icestats.source) {
            let source = response.icestats.source[id];
            let sname = source.server_name;
            if(sname !== undefined && sname.startsWith("[mpd] ") && sname.endsWith(" (mp3)")) {
                channels.push(sname.substr(6, sname.length-12));
            }
        }

        // Sort them.
        channels.sort();
        //console.log(channels);

        //get the CURRENT channel
        let iceresponse = response.icestats.source;
        let currentchannel= `${channel}`;

        // find the current channel index in the array
        for(index in channels){
                //console.log(channels[index])
                if(currentchannel == channels[index]){
                        let currentindex = index;
                        //console.log(currentindex)
                        //console.log(channels[currentindex])

                        let next = parseInt(currentindex, 10)-1;
                        //console.log(channels)
                        //console.log(channels.length-1)
                        if(next<0){
                                next=channels.length-1;
                        }
                        console.log(channels[next])
                        console.log(next)

                        //console.log(next)
                        //console.log(channels[next])
                        //change_channel2(channels[next])
                        change_channel2(channels[next])

                }
        }

    });
}



function prev_channel(){
    ajax_with_json(ICECAST_STATUS_URL, function(response) {
        let channels = [];
        //console.log(channels);

        for(let id in response.icestats.source) {
            let source = response.icestats.source[id];
            let sname = source.server_name;
            if(sname !== undefined && sname.startsWith("[mpd] ") && sname.endsWith(" (mp3)")) {
                channels.push(sname.substr(6, sname.length-12));
            }
        }

        // Sort them.
        channels.sort();
        //console.log(channels);

        //get the CURRENT channel
        let iceresponse = response.icestats.source;
        let currentchannel= `${channel}`;

        // find the current channel index in the array
        for(index in channels){
                //console.log(channels[index])
                if(currentchannel == channels[index]){
                        let currentindex = index;
                        //console.log(currentindex)
                        //console.log(channels[currentindex])

                        let next = parseInt(currentindex, 10)+1;
                        //console.log(channels)
                        //console.log(channels.length-1)
                        if(next>channels.length-1){
                                next=0;
                        }
                        console.log(channels[next])
                        console.log(next)

                        //console.log(next)
                        //console.log(channels[next])
                        //change_channel2(channels[next])
                        change_channel2(channels[next])

                }
        }

    });
}

function volumeUp() {
  if (currentVolume < 100) {
      currentVolume = currentVolume + 10;
      soundVolume = currentVolume / 100;
      //var $toastContent = $('<span>Volume '+ currentVolume+ ' %' + '</span>' );
      //Materialize.toast($toastContent, 2000);
      console.log(soundVolume);
      document.getElementById("volume").innerHTML = currentVolume;
      //LainPlayer.updateVolume(soundVolume);
      audioTag.volume = soundVolume;
  }
}

function volumeDown() {
  if (currentVolume > 0) {
      currentVolume = currentVolume - 10;
      soundVolume = currentVolume / 100;
      //var $toastContent = $('<span>Volume '+ currentVolume+ ' %' + '</span>' );
      //Materialize.toast($toastContent, 2000);
      console.log(soundVolume);
      document.getElementById("volume").innerHTML = currentVolume;
      //LainPlayer.updateVolume(soundVolume);
      audioTag.volume = soundVolume;
  }
}
window.onload = () => {
    // Show and hide things
    let show = document.getElementsByClassName("withscript");
    let hide = document.getElementsByClassName("noscript");
    for(let i = 0; i < show.length; i++) {
        if (show[i].classList.contains("inline")) {
            show[i].style.display = "inline-block";
        } else if(show[i].tagName == "DIV" || show[i].tagName == "HEADER" || show[i].tagName == "TABLE") {
            show[i].style.display = "block";
        } else if(show[i].tagName == "TD") {
            show[i].style.display = "table-cell";
        } else {
            show[i].style.display = "inline";
        }
    }
    for(let i = 0; i < hide.length; i++) { hide[i].style.display = "none"; }

    // Populate the channel list.
    populate_channel_list();

    // Get the initial playlist and set a timer to regularly update it.
    check_playlist();
    playlistPoll = setInterval(check_playlist, 15000);
    LainPlayer.togglePlay()

    document.addEventListener('keyup', (e) => {
        if(e.keyCode == 32){
            LainPlayer.togglePlay()
        }
    });

    //goto next channel
    document.addEventListener('keyup', (e) => {
        if(e.keyCode == 37){
            //rightarrow to go to next channel (upward)
            next_channel()
        }
    });

    //goto previous channel
    document.addEventListener('keyup', (e) => {
        if(e.keyCode == 39){
            //leftarrow to go to prev channel (downward)
            prev_channel()
        }
    });

        //uparrow sound up
    document.addEventListener('keyup', (e) => {
        if(e.keyCode == 38){
            //uparrow to upvolume
            volumeUp()
        }
    });
        //downarrow sound down
    document.addEventListener('keyup', (e) => {
        if(e.keyCode == 40){
            //downarrow to downvolume
            volumeDown()
        }
    });


};
