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

var userPlaylists = {}; // user's playlists
userPlaylists.items = [];
var userCurrentPlaylist = {}; // user's current selected playlist 

var userTopTracks = {}; // user's top tracks
userTopTracks.items = [];

var userTopArtists = {}; // user's top artists
userTopArtists.items = [];

var userSelectedSongs = []; // list of users selected songs

var graph = {}; // User graph
graph.nodes = [];
graph.links = [];

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

	$('#loading_modal').modal({
		'show': true
	});

	console.log("Starting initialization . . . ");

	initUserInformation();
	initHTMLElements();

	console.log("Fetching data from the Spotify API . . . ");
	getData();
	console.log("Data fetched.");

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
	$("#content_pane").load("/html/user_graph.html", function() {
		setTimeout(function() {
			initGraphOnStart();
		}, 1000)
	}); 	
	console.log("Finished initialization.");

}

/********************************/
/* Functions with standard view */
/********************************/

function initPlaylistPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/html/standard_view.html", function() {
		setUISize(["left_hand_list", "right_hand_list"]);
		d3.select('#page_title').text("Playlists");
		addItemsToList("left_hand_list", userPlaylists.items); 
	}); 
}

function initArtistPane() {							
	$("#content_pane").empty();
	$("#content_pane").load("/html/top_artists.html", function() {
		initTermButtons();
		setUISize(["left_hand_list", "right_hand_list"]);
		d3.select('#page_title').text("Top Artists");
		addItemsToList("left_hand_list", userTopArtists.items); 
	}); 
}

function initTrackPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/html/top_tracks.html", function() {
		initTermButtons();
		setUISize(["left_hand_list", "right_hand_list"]);
		d3.select('#page_title').text("Top Tracks");
		addItemsToList("left_hand_list", userTopTracks.items); 
	}); 
}

/***********************************/
/* Functions without standard view */
/***********************************/

function initSelectedSongsPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/html/selected_tracks.html", function() {
		setUISize(["left_hand_list"]);
		addItemsToList("left_hand_list", userSelectedSongs); 
	}); 
}

function initAboutPane() {
	$("#content_pane").empty();
	$("#content_pane").load("/html/explanation.html", function() {
		// callback
	}); 
}

function initGraphPane() {		
	$("#content_pane").empty();
	$("#content_pane").load("/html/user_graph.html", function() {
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
  	populateUserArtistGraph();
  	populateUserPlaylists();
  	populateUserTopArtists();
  	populateUserTopTracks();

  	$('#user_graph').show();
}

function initGraphOnStart() {
	
	// if there is not enough data to display visualization then tell the user. 
	if(graph.links.length >= 30 && graph.nodes.length >= 30) {
		setUISize(["right_hand_list"]);
		initGraph(graph);
		appendArtistsTopTracks("right_hand_list",
							userTopArtists.items[0].id,
							userTopArtists.items[0].name);
		$('#loading_modal').modal({
		'show': false
		});
	} else {
		var header = d3.select("#modal_header");
		header.selectAll('*').remove();
		header.text('Oops, we ran into an issue!');

		var body = d3.select("#modal_body");
		body.selectAll('*').remove();
		body.text("There was not enough data to load the visualization. Listen to more music!");

		initAboutPane();
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