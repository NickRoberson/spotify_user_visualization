// GET DATA PASSED FROM LOGIN SCREEN FOR USER
var access_token;
var user;

// CONSTANTS
var MAX_ARTISTS = 50;
var MAX_TRACKS = 50;
var MAX_PLAYLISTS = 50;
var RANGE_ARTIST_GRAPH = 5;
var DEPTH_USER_GRAPH = 3;

var USER_GRAPH_KEY = "user_graph_key";
var USER_PLAYLISTS_KEY = "user_playlists_key";
var USER_TOP_ARTISTS_KEY = "user_top_artists_key";
var USER_TOP_TRACKS_KEY = "user_top_tracks_key";

var LEFT_HAND_LIST = "left_hand_list";
var RIGHT_HAND_LIST = "right_hand_list";

// DATA
// users playlists
var userPlaylists = {};
userPlaylists.items = [];

// users top tracks
var userTopTracks = {};
userTopTracks.items = [];

// users top artists
var userTopArtists = {};
userTopArtists.items = [];

// current selected playlist 
var userCurrentPlaylist = {};

// list of users selected songs
var userSelectedSongs = [];

// USER GRAPH
var graph = {};
graph.nodes = [];
graph.links = [];

// GENERIC BAR CHART
var yaxis;
var xaxis;

// HTML ELEMENTS IN THE PAGE
// FOOTER
var footer;
// CONTENT
var content_pane;
// USER INFO
var list_area;
var user_name;

//STARTUP FUNCTION TO INITIALIZE THE PAGE
init();
/*
SUNBURST CHART FOR TOP ARTIST GENRES AND TOP SONGS ANALYSIS
https://bl.ocks.org/mbostock/4348373
*/
function init() {
  	// PASSED FROM LOGIN_PAGE.JS
  	access_token = sessionStorage.getItem('OAuth');
  	//console.log("Access Token = " + access_token);
	user = JSON.parse(sessionStorage.getItem('user'));
	//console.log(user);

	// Get users display name, in the absence of display name, use email. 
  	if(user.display_name == null) {
  	 	var email = user.email.split("@");
  	 	user_name = email[0];
    	//console.log("user_name = " + user_name);
  	} else {
    	user_name = user.display_name;
   		//console.log("user_name = " + user_name);
  	}

	// Set users name on the main page
  	d3.select('#user_title').text(user_name);

	// set list area for listing songs and such 
  	list_area = d3.select('#svg_area');
	content_pane = d3.select('#content_pane');
	content_pane.attr("height", (screen.height)*.8 + "px")
				.attr("width",  screen.width + "px");
				//.style("border","solid 3px #474747")
				//.style("border-radius","5px");

	// append the spotify iframe to the footer
	footer = d3.select('#footer_wrap').append('iframe')
						.attr("id","iframe_footer")
						.attr("src","https://open.spotify.com/embed?uri=spotify%3Atrack%3A33Q6ldVXuJyQmqs8BmAa0k")
						.attr("height", "80px")
						.attr("width", "100%")
						.attr("frameborder","0")
						.attr("allowtransparency","true");


	// hide the user graph button so that users cannot click it before data is loaded
  	$('#user_graph').hide();

	// populate (1) graph, (2) playlists, (3) top artists, and (4) top tracks.
  	populateUserArtistGraph();
  	populateUserPlaylists();
  	populateUserTopArtists();
  	populateUserTopTracks();

  	$('#user_graph').show();

	// load primary view for user graph
	$("#content_pane").empty();
	$("#content_pane").load("/html/user_graph.html"); 

  	// Add listeners for tabs in the navbar 

	// add listener to user playlists nav bar button 				
  	var userPlaylistsButton = d3.select('#user_playlists')
                    .on("click",function() {
                        console.log("Getting playlists for user.");
                    	console.log(userPlaylists);

						$("#content_pane").empty();
      					$("#content_pane").load("/html/user_playlists.html"); 

						setTimeout(function(){
							addItemsToList("left_hand_list", userPlaylists.items);
  						}, 100);                    
					});

	// add listener to user top songs nav bar button 				
	var userTopSongsButton = d3.select('#user_top_songs')
                    .on("click",function() {
                        console.log("Getting top songs for User.");
                    	console.log(userPlaylists);
                    	//addItemsToList(LIST_TOP_SONGS , topTracks);
						
						$("#content_pane").empty();
      					$("#content_pane").load("/html/top_songs.html"); 
						
						// add items to list
                    });

	// add listener to user selected songs nav bar button 				
  	var userSelectedSongsButton = d3.select('#user_selected_songs')
                    .on("click",function() {
                        console.log("Getting user selected songs.");
                        //console.log();
                        //addItems(topTracks, null);

						$("#content_pane").empty();
      					$("#content_pane").load("/html/selected_songs.html"); 

						// add items to list
                    });

	// add listener to user gratop artists nav bar button 				
  	var userTopArtistsButton = d3.select('#user_top_artists')
                    .on('click', function() {
                        console.log("Getting top artists for user.");
                        console.log(topArtists);
						//addItems(topArtists.items, topArtists.genres);
						
						$("#content_pane").empty();
      					$("#content_pane").load("/html/top_artists.html"); 
                    
						// add items to list				
					});

	// add listener to user graph nav bar button 				
  	var userGraphButton = d3.select('#user_graph')
                    .on('click', function() {
                        console.log("Generating User graph.");
                        console.log(graph);
						
						$("#content_pane").empty();
      					$("#content_pane").load("/html/user_graph.html"); 
  						
						setTimeout(function(){
   							makeUserGraph(graph);
							getArtistsTopTracks("user_graph_list_area", 
												userTopArtists.items[0].id,
												userTopArtists.items[0].name);
							//appendRightHandList("user_graph_list_area", userTopArtists.items[0].id, "Top Artists");
  						}, 100);
                    });

  	setTimeout(function(){
   		makeUserGraph(graph);
		getArtistsTopTracks("user_graph_list_area", 
							userTopArtists.items[0].id,
							userTopArtists.items[0].name);  	
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
      		userPlaylists.items = result.items;
    	}
  	});
};

// gets all the songs with the playlist id given
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
			userCurrentPlaylist.genres = genres;
			userCurrentPlaylist.items = result.items;
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
      		userTopTracks.items = result.items;
      		//addItems(result);
    	}
  	});
};

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
      		userTopArtists.genres = {};
			userTopArtists.genres = genres;
      		userTopArtists.items = result.items;
    	}
  	});
};


// depth set to 3
function populateUserArtistGraph() {
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

        	getArtistRelatedArtists(data[i], 2);
      		}
    	}
  	});
}



function getArtistRelatedArtists(artist, depth) {
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

function getArtistsTopTracks(list_id, artist_id, artist_name) {
	console.log(artist_id);
	var call_url = "https://api.spotify.com/v1/artists/" + artist_id + "/top-tracks?country=US";
    $.ajax({
      	url: call_url,
      	headers: {
        	'Authorization': 'Bearer ' + access_token
      	},
     	dataType: "json",
      	type : "GET",
      	success : function(result) {
			//console.log(result);
			//console.log(result.tracks);
			appendRightHandList(list_id, result.tracks, artist_name);     	 
		}
    });

}
