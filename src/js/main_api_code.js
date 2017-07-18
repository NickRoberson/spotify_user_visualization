// gets all the songs with the playlist id given
async function getPlaylistSongs(playlist) {

	var playlist_id = playlist.id;
  	var call_url = "https://api.spotify.com/v1/users/" + user.id + "/playlists/" + playlist_id + "/tracks";
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
			userPlaylists.currentPlaylist.items = result.items;
			setTypes(userPlaylists.currentPlaylist.items, "track");
    	}
  	});
};

async function getGenreBreakdown(items) {
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

function setTypes(items, type) {
	items.forEach(function(item) {
		item.type = type;
	});
}


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

function getTrackMetadata(track) {

}

function getTracksMetaData(tracks) {

}