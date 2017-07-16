// gets top X (0 through 50) playlists determined by 'limit'
async function populateUserPlaylists() {
  	console.log("List Playlists");
  	var base_url = "https://api.spotify.com/v1/me/playlists";
  	var call_url = base_url + '?' + $.param({
   	 	'limit' : MAX_PLAYLISTS
  	});  
	$.ajax({
    	url: call_url,
    	headers: {
      		'Authorization': 'Bearer ' + access_token
    	},
    	dataType: "json",
    	type : "GET",
    	success : function(result) {
     		console.log(result);
            userPlaylists.type = "playlist";
      		userPlaylists.items = result.items;
    	}
  	});
};

// gets all the songs with the playlist id given
async function getPlaylistSongs(playlist_id) {
  	console.log("List Playlists");
  	var base_url = "https://api.spotify.com/v1/users/" + user.id + "/playlists/" + playlist_id + "/tracks";
  	var playlists;
  	var call_url = base_url;
  	$.ajax({
  		url: call_url,
    	headers: {
      		'Authorization': 'Bearer ' + access_token
    	},
    	dataType: "json",
    	type : "GET",
    	success : function(result) {
      		console.log(result);
			
			var genres = {};
      		for (val of result.items) {
        		for(i in val.genres) {
          			var key = val.genres[i];
          			if(genres[key]) {
           				genres[key]++;
          			} else {
            			genres[key] = 1
          			}
        		}
      		}
            userCurrentPlaylist.type = "playlist";
			userCurrentPlaylist.genres = genres;
			userCurrentPlaylist.items = result.items;
    	}
  	});
};

async function populateUserTopTracks() {
  	console.log("List Songs");
  	var base_url = "https://api.spotify.com/v1/me/tracks";
  	var call_url = base_url + '?' + $.param({
    	'limit' : MAX_TRACKS,
    	'time_range':timeRange,
  	});
  	$.ajax({
   		url: call_url,
    	headers: {
      		'Authorization': 'Bearer ' + access_token
    	},
    	dataType: "json",
    	type : "GET",
    	success : function(result) {
      		console.log(result);
      		for(song of result.items) {
        		song.name = song.track.name;
      		}
      		result.items.reverse();
            userTopTracks.type = "track";
      		userTopTracks.items = result.items;
      		//addItems(result);
    	}
  	});
};

async function populateUserTopArtists() {
  	console.log("List Artists");
  	var base_url = "https://api.spotify.com/v1/me/top/artists";
  	var call_url = base_url + '?' + $.param({
    	'limit': MAX_ARTISTS,
    	'time_range':timeRange,
  	});
  	$.ajax({
   		url: call_url,
    	headers: {
      		'Authorization': 'Bearer ' + access_token
    	},
    	dataType: "json",
    	type : "GET",
    	success : function(result) {
      		console.log(result);
            userTopArtists.type = "artists";
      		userTopArtists.genres = {};
			userTopArtists.genres = getGenreBreakdown(result);;
      		userTopArtists.items = result.items;
    	}
  	});
};

async function getGenreBreakdown(result) {
    var genres = {};
    for (val of result.items) {
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

// depth set to 3
async function populateUserArtistGraph() {
  	console.log("populateArtistGraph()");
  	var base_url = "https://api.spotify.com/v1/me/top/artists";
	var call_url = base_url + '?' + $.param({
    	'limit': RANGE_ARTIST_GRAPH,
    	'time_range':timeRange,
  	});
  	$.ajax({
    	url: call_url,
    	headers: {
      		'Authorization': 'Bearer ' + access_token
    	},
    	dataType: "json",
    	type : "GET",
    	success : function(result) {
      		var data = result.items;
      		console.log(data);
      		//make node for user
      		graph.nodes.push({ 	'id' : user.display_name,
                         		'data' : user,
                         		'depth' : 0});

      		for(i = 0; i < RANGE_ARTIST_GRAPH; i++) {
        		var new_artist = data[i];
       			 // make link for current users realted artists
       			 graph.links.push({	'source' : user.display_name,
                          			'target' : new_artist.name });

        		// make node from current user to new artists
        		graph.nodes.push({	'id' : new_artist.name,
                           			'data' : new_artist,
                           			'depth' : 1});

        	getArtistRelatedArtists(data[i], 2);
      		}
    	}
  	});
}



async function getArtistRelatedArtists(artist, depth) {
  	console.log("getRelatedArtists()");
	var call_url = "https://api.spotify.com/v1/artists/" + artist.id + "/related-artists";
    $.ajax({
      	url: call_url,
      	headers: {
        	'Authorization': 'Bearer ' + access_token
      	},
     	dataType: "json",
      	type : "GET",
      	success : function(result) {
        	var data = result.artists;
        	if(data != undefined && data.length >= RANGE_ARTIST_GRAPH) {
         		var data = result.artists;
          		var new_depth = depth + 1;
          		for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
            		var new_artist = data[i];
            		// make node for new artist
            		console.log(new_artist);
            		graph.nodes.push({	'id' : new_artist.name,
                                		'data' : new_artist,
                                		'depth' : new_depth});

           			// make link from passed artist to new artist
            		graph.links.push({	'source' : artist.name,
                              			'target' : new_artist.name });

          		}
          		if (new_depth < DEPTH_USER_GRAPH) {
            		for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
              			console.log(new_depth + " : !!!!!");
              			getArtistRelatedArtists(data[i],new_depth);
            		}
          		}
        	}
     	 }
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
			    appendToList(list_id, result.tracks, artist_name);     
            }	 
		}
    });

}