/************************/
/* API CALLS FOR TRACKS */
/************************/

function getTrackFeatures(track) {
	var call_url = "https://api.spotify.com/v1/audio-features/"+ track.id;
	$.ajax({
      	url: call_url,
      	headers: {
        	'Authorization': 'Bearer ' + access_token
      	},
     	dataType: "json",
      	type : "GET",
      	success : function(result) { 
			console.log(result);			
			// To Do 
		}
    });
}

function getMultipleTrackFeatures(tracks) {
	var ids;
	tracks.forEach(function(track, index) {
		ids += track.id + ",";
	});
	var call_url = "https://api.spotify.com/v1/audio-features/" + ids;
	$.ajax({
      	url: call_url,
      	headers: {
        	'Authorization': 'Bearer ' + access_token
      	},
     	dataType: "json",
      	type : "GET",
      	success : function(result) { 
			console.log(result);
			// To Do 
		}
    });
}

/*************************/
/* API CALLS FOR ARTISTS */
/*************************/

function appendArtistsTopTracks(list_id, artist_id, artist_name) {
	var call_url = "https://api.spotify.com/v1/artists/" + artist_id + "/top-tracks?country=US";
	$.ajax({
      	url: call_url,
      	headers: {
        	'Authorization': 'Bearer ' + access_token
      	},
     	dataType: "json",
      	type : "GET",
      	success : function(result) {
            if(result.tracks != null) {
				setTypes(result.tracks, "track");
			    appendToList(list_id, result.tracks, artist_name);     
            }	 
		}
    });
}

/***************************/
/* API CALLS FOR PLAYLISTS */
/***************************/

function getPlaylistSongs(playlist) {
	console.log(user);
	var call_url = "https://api.spotify.com/v1/users/" + playlist.owner.id + "/playlists/" + playlist.id + "/tracks";
	console.log(call_url + " : " + access_token);
	$.ajax({
		url: call_url,
		headers: {
			'Authorization': 'Bearer ' + access_token
		},
		dataType: "json",
		type : "GET",
		success : function(result) {
			console.log(result);
			userPlaylists.currentPlaylist = playlist;
			userPlaylists.currentPlaylist.type = "playlist";
			userPlaylists.currentPlaylist.genres = getGenreBreakdown(result.items);
			// add items to current playlist
			userPlaylists.currentPlaylist.items = [];
			result.items.forEach(function(item) {
			userPlaylists.currentPlaylist.items.push(item.track);
			});
			setTypes(userPlaylists.currentPlaylist.items, "track");
		}
	});
};

/***********/
/* HELPERS */
/***********/

function setTypes(items, type) {
	items.forEach(function(item) {
		item.type = type;
	});
}

function getGenreBreakdown(items) {
    var genres = {};
    for (val of items) {
        for(i in val.genres) {
            var key = val.genres[i];
            if(genres[key]) {
                genres[key]++;
            } else {
                genres[key] = 1
            }
        }
    }
    return genres;
}