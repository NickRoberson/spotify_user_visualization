/********************/
/* Application Data */
/********************/

// Device data 
var colHeight = (screen.height * .7 - 80) + "px";

// User data
var access_token;
var user;

// Constants 
var MAX_ARTISTS = 50, MAX_TRACKS = 50, MAX_PLAYLISTS = 50;
var RANGE_ARTIST_GRAPH = 5;
var DEPTH_USER_GRAPH = 3;

var USER_GRAPH_KEY = "user_graph_key";
var USER_PLAYLISTS_KEY = "user_playlists_key";
var USER_TOP_ARTISTS_KEY = "user_top_artists_key";
var USER_TOP_TRACKS_KEY = "user_top_tracks_key";

var LEFT_HAND_LIST = "left_hand_list";
var RIGHT_HAND_LIST = "right_hand_list";

// Spotify data 

var userPlaylists = {
	items: [],
	type: "playlists",
	currentPlaylist: {}
}; // user's playlists
var userCurrentPlaylist = {}; // user's current selected playlist 

var userTopTracks = {
	items: [],
	type: "tracks",
	currentTrack: {}
}; // user's top tracks

var userTopArtists = {
	items: [],
	type: "artists",
	currentArtist: {}
}; // user's top artists

var userSelectedSongs = {
	items: [],
	type: "tracks"
}; // list of users selected songs

var graph = {
	nodes: [],
	links: []
}; // User graph

var timeRange = "short_term";

// HTML elements 
var footer; // footer of page 
var content_pane; // content pane of page 
var display_name; // use's display name for website 
var shortTermBtn; // term buttons for history
var mediumTermBtn;
var longTermBtn;

init(); // go!  

/*******************************/
/* Main initializaion Function */
/*******************************/

async function init() {

	$('#loading_modal').modal("show");	

	console.log("Starting initialization . . . ");
	initUserInformation();
	initHTMLElements();
	console.log("Fetching data from the Spotify API . . . ");
	await getData();

	// add listener to user playlists nav bar button 				
  	var userPlaylistsButton = d3.select('#user_playlists')
                    .on("click",function() {
						initPlaylistPane(100);
					});

	// add listener to user top songs nav bar button 				
	var userTopSongsButton = d3.select('#user_top_songs')
                    .on("click",function() {
						initTrackPane(100);
                    });

	// add listener to user selected songs nav bar button 				
  	var userSelectedSongsButton = d3.select('#user_selected_songs')
                    .on("click",function() {
						initSelectedSongsPane(100);
                    });

	// add listener to user artists nav bar button 				
  	var userTopArtistsButton = d3.select('#user_top_artists')
                    .on('click', function() {
						initArtistPane(100);
					});

	// add listener to user graph nav bar button 				
  	var userGraphButton = d3.select('#user_graph')
                    .on('click', function() {  						
						initGraphPane(100);
                    });
	// add listener to about navbar option 
  	var about = d3.select('#about')
                    .on('click', function() {
						initAboutPane();
	                });

	// default init to the graph pane	
	$("#content_pane").empty();
	$("#content_pane").load("/src/html/secondary_views/user_graph.html", function() {
		setTimeout(function() {
			initGraphOnStart();
		}, 1500)
	}); 	
	console.log("Finished initialization.");

}

/********************************/
/* Functions with standard view */
/********************************/

function initPlaylistPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/src/html/secondary_views/standard_view.html", function() {
		setUISize(["left_hand_list", "right_hand_list"]);
		d3.select('#page_title').text("Playlists");
		appendItems("left_hand_list", userPlaylists.items); 
	}); 
}

function initArtistPane() {							
	$("#content_pane").empty();
	$("#content_pane").load("/src/html/secondary_views/top_artists.html", function() {
		initTermButtons();
		setUISize(["left_hand_list", "right_hand_list"]);
		d3.select('#page_title').text("Top Artists");
		appendItems("left_hand_list", userTopArtists.items); 
	}); 
}

function initTrackPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/src/html/secondary_views/top_tracks.html", function() {
		initTermButtons();
		setUISize(["left_hand_list", "right_hand_list"]);
		d3.select('#page_title').text("Top Tracks");
		appendItems("left_hand_list", userTopTracks.items); 
	}); 
}

/***********************************/
/* Functions without standard view */
/***********************************/

function initSelectedSongsPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/src/html/secondary_views/selected_tracks.html", function() {
		setUISize(["left_hand_list"]);
		appendItems("left_hand_list", userSelectedSongs.items); 
	}); 
}

function initAboutPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/src/html/secondary_views/explanation.html", function() {
		// callback
	}); 
}

function initGraphPane() {		
	$("#content_pane").empty();
	$("#content_pane").load("/src/html/secondary_views/user_graph.html", function() {
		setUISize(["right_hand_list"]);
		initGraph(graph);
		appendArtistsTopTracks("right_hand_list",
							userTopArtists.items[0].id,
							userTopArtists.items[0].name);
	}); 
}	

/*****************************************/
/* Functions helping with initialization */
/*****************************************/

// set the size of the columns based on the size of the screen we are on 
function setUISize(ids, percent) {
	ids.forEach(function(id) {
		d3.select("#" + id).style('height', colHeight);
	}, this);
}

function initUserInformation() {
  	// PASSED FROM LOGIN_PAGE.JS
  	access_token = sessionStorage.getItem('OAuth');
  	//console.log("Access Token = " + access_token);
	user = JSON.parse(sessionStorage.getItem('user'));
	//console.log(user);

	// Get users display name, in the absence of display name, use email. 
  	if(user.display_name == null) {
  	 	var email = user.email.split("@");
  	 	display_name = email[0];
    	//console.log("user_name = " + user_name);
  	} else {
    	display_name = user.display_name;
   		//console.log("user_name = " + user_name);
  	}

	// Set users name on the main page
  	d3.select('#user_title').text(display_name);
}

function initHTMLElements() {
	// set list area for listing songs and such 
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
}

function getData() {
	// hide the user graph button so that users cannot click it before data is loaded
  	$('#user_graph').hide();

	// populate (1) graph, (2) playlists, (3) top artists, and (4) top tracks.
  	initArtistGraph();
  	initPlaylists();
  	initTopArtists();
  	initTopTracks();

  	$('#user_graph').show();
}

function initGraphOnStart() {
	
	// if there is not enough data to display visualization then tell the user. 
	if(graph.links.length >= 30 && 
	   graph.nodes.length >= 30 && 
	   userPlaylists.items.length >= 50 &&
	   userTopTracks.items.length >= 50) {
		setUISize(["right_hand_list"]);
		initGraph();
		appendArtistsTopTracks("right_hand_list",
							userTopArtists.items[0].id,
							userTopArtists.items[0].name);
		$('#loading_modal').modal("hide");	

	} else {
		initAboutPane();
		var header = d3.select("#modal_header");
		header.selectAll('*').remove();
		header.text('Oops, we ran into an issue!');

		var body = d3.select("#modal_body");
		body.selectAll('*').remove();
		body.text("There was not enough data to load the visualization. Listen to more music!");
	}
}

function initTermButtons() {
	timeRange = "short_term";

	shortTermBtn = d3.select('#btn_short_term')
					 .on('click', function() {
						timeRange = "short_term";
						console.log("New time range -> " + timeRange);
						
						d3.select(this).style("color",'#84bd00');
						d3.select('#btn_medium_term').style("color",'black');
						d3.select('#btn_long_term').style("color",'black');
	});
	mediumTermBtn = d3.select("#btn_medium_term")
					 .on('click', function() {
						timeRange = "medium_term";
						console.log("New time range -> " + timeRange);
						
						d3.select(this).style("color",'#84bd00');
						d3.select('#btn_short_term').style("color",'black');
						d3.select('#btn_long_term').style("color",'black');
	});
	longTermBtn = d3.select("#btn_long_term")
					 .on('click', function() {
						timeRange = "long_term";
						console.log("New time range -> " + timeRange);

						d3.select(this).style("color",'#84bd00');
						d3.select('#btn_medium_term').style("color",'black');
						d3.select('#btn_short_term').style("color",'black');
	});
}

function showNotification(header, text, duration) {
	
	var title = d3.select("#nmodal_title");
	title.selectAll('*').remove();
	title.text(header);

	var body = d3.select("#nmodal_body");
	body.selectAll('*').remove();
	body.text(text);

	$('#notification_modal').modal("show");	
	
	setTimeout(function() {
		$('#notification_modal').modal("hide");	
	}, duration);
}


/**********************************************/
/* FUNCITONS FOR INITIALIZING/POPULATING DATA */
/**********************************************/

function initTopTracks() {
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
      		for(item of result.items) {
        		item = item.track;
      		}
      		result.items.reverse();
            userTopTracks.type = "tracks";
      		userTopTracks.items = result.items;
			setTypes(userTopTracks.items, "track");
      		//addItems(result);
    	}
  	});
};

function initTopArtists() {
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
			userTopArtists.genres = getGenreBreakdown(result.items);
			setTypes(userTopArtists.items, "artist");
      		userTopArtists.items = result.items;
    	}
  	});
};

function initPlaylists() {
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
     		// set fields of user playlists 
      		userPlaylists.items = result.items;
			setTypes(userPlaylists.items, "playlist");
    	}
  	});
}

function initArtistGraph() {
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
      		var items = result.items;
			// push node for user 
			graph.nodes.push(makeNode(user.display_name, user, 0));
      		// push nodes and links for first layer of graph
			for(i = 0; i < RANGE_ARTIST_GRAPH; i++) {
        		var new_artist = items[i];
				graph.links.push(makeLink(user.display_name, new_artist.name));
				graph.nodes.push(makeNode(new_artist.name,new_artist,1));;
        		initArtistGraphHelper(items[i], 2);
      		}
    	}
  	});
}

function initArtistGraphHelper(artist, depth) {
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
				// push nodes and links
          		for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
            		var new_artist = data[i];
					graph.nodes.push(makeNode(new_artist.name, new_artist, new_depth));
					graph.links.push(makeLink(artist.name, new_artist.name));
          		}
          		if (new_depth < DEPTH_USER_GRAPH) {
            		for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
              			initArtistGraphHelper(data[i],new_depth);
            		}
          		}
        	}
     	 }
    });
}

function makeNode(id, data, depth) {
	var node = {'id' : id,
                'data' : data,
                'depth' : depth};
	return node;
}

function makeLink(source, target) {
	var link = {'source' : source,
        		'target' : target };
	return link;
}