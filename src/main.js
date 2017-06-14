// GET DATA PASSED FROM LOGIN SCREEN
var access_token;
var user;


// CONSTANTS
var MAX_ARTISTS = 50;
var MAX_TRACKS = 50;
var MAX_PLAYLISTS = 50;
var RANGE_ARTIST_GRAPH = 5;
var DEPTH_USER_GRAPH = 3;
var list_area;
var user_name;

var USER_GRAPH_KEY = "user_graph_key";
var USER_PLAYLISTS_KEY = "user_playlists_key";
var USER_TOP_ARTISTS_KEY = "user_top_artists_key";
var USER_TOP_TRACKS_KEY = "user_top_tracks_key";

// DATA
var userPlaylists;
var topTracks;
var topArtists;

// USER GRAPH
var graph = {};
graph.nodes = [];
graph.links = [];

// GENERIC BAR CHART
var yaxis;
var xaxis;


//STARTUP FUNCTION TO INITIALIZE THE PAGE
startup();
/*
SUNBURST CHART FOR TOP ARTIST GENRES AND TOP SONGS ANALYSIS
https://bl.ocks.org/mbostock/4348373
*/
function startup() {
  	// PASSED FROM LOGIN_PAGE.JS
  	access_token = sessionStorage.getItem('OAuth');
  	user = JSON.parse(sessionStorage.getItem('user'));

  	if(user.display_name == null) {
  	 	var email = user.email.split("@");
  	 	user_name = email[0];
    console.log("user_name = " + user_name);
  	} else {
    	user_name = user.display_name;
   		console.log("user_name = " + user_name);
  	}

  	d3.select('#user_title').text(user_name);
  	list_area = d3.select('#song_area');

  	console.log("Access Token = " + access_token);
  	console.log(user);

  	$('#user_graph').hide();

  	populateArtistGraph();
  	populateUserPlaylists();
  	populateUserTopArtists();
  	populateUserTopTracks();

  	$('#user_graph').show();

  	// TABS
  	topPlaylists = d3.select('#playlists')
                    .on("click",function() {
                        console.log("Getting playlists for user.");
                    	console.log(userPlaylists);
                    	addItems(userPlaylists, null);
                    });
  	topPlaylists = d3.select('#top_songs')
                    .on("click",function() {
                        console.log("Getting top songs for user.");
                        console.log(topTracks);
                        addItems(topTracks, null);
                    });
  	topArtists = d3.select('#top_artists')
                    .on('click', function() {
                        console.log("Getting top artists for user.");
                        console.log(topArtists);
                        addItems(topArtists.items, topArtists.genres);
                    });
  	userGraph = d3.select('#user_graph')
                    .on('click', function() {
                        console.log("Generating User graph.");
                        console.log(graph);
                        makeUserGraph(graph);
                    });

  	setTimeout(function(){
   		makeUserGraph(graph);
  	}, 1500);
}


// gets top X (0 through 50) playlists determined by 'limit'
function populateUserPlaylists() {
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
      		userPlaylists = result.items;
    	}
  	});
};

function getPlaylistSongs(playlist_id) {
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
    	}
  	});
};

function populateUserTopTracks() {
  	console.log("List Songs");
  	var base_url = "https://api.spotify.com/v1/me/tracks";
  	var call_url = base_url + '?' + $.param({
    	'limit' : MAX_TRACKS,
    	'time_range':'short_term',
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
      		topTracks = result.items;
      		//addItems(result);
    	}
  	});
};

/* DOESNT WORK IDK WHY */
function populateUserTopArtists() {
  	console.log("List Artists");
  	var base_url = "https://api.spotify.com/v1/me/top/artists";
  	var call_url = base_url + '?' + $.param({
    	'limit': MAX_ARTISTS,
    	'time_range':'short_term',
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
      		topArtists.genres = genres;
      		topArtists.items = result.items;
    	}
  	});
};


// depth set to 3
function populateArtistGraph() {
  	console.log("populateArtistGraph()");
  	var base_url = "https://api.spotify.com/v1/me/top/artists";
	var call_url = base_url + '?' + $.param({
    	'limit': RANGE_ARTIST_GRAPH,
    	'time_range':'short_term',
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

        	getRelatedArtists(data[i], 2);
      		}
    	}
  	});
}



function getRelatedArtists(artist, depth) {
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
              			getRelatedArtists(data[i],new_depth);
            		}
          		}
        	}
     	 }
    });
}
