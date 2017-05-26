var access_token = sessionStorage.getItem('OAuth');
var user = JSON.parse(sessionStorage.getItem('user'));


// CONSTANTS
var MAX_ARTISTS = 50;
var MAX_TRACKS = 50;
var MAX_PLAYLISTS = 50;
var RANGE_ARTIST_GRAPH = 5;
var DEPTH_USER_GRAPH = 3;
var list_area;

// DATA
var userPlaylists;
var topTracks;
var topArtists;
var graph = {};
graph.nodes = [];
graph.links = [];

//STARTUP FUNCTION TO INITIALIZE THE PAGE
startup();
/*
SUNBURST CHART FOR TOP ARTIST GENRES AND TOP SONGS ANALYSIS
https://bl.ocks.org/mbostock/4348373
*/
function startup() {
  d3.select('#user_title').text(user.display_name);
  list_area = d3.select('#song_area');
  console.log("Access Token = " + access_token);
  console.log(user);
  $('#user_graph').hide();

  // PRELOAD DATA FOR USER
  populateArtistGraph();

  populateUserPlaylists();
  populateUserTopTracks();
  populateUserTopArtists();
  $('#user_graph').show();

  // TABS
  topPlaylists = d3.select('#playlists')
                        .on("click",function() {
                            console.log("Getting playlists for user.");
                            console.log(userPlaylists);
                            addItems(userPlaylists);
                        });
  topPlaylists = d3.select('#top_songs')
                        .on("click",function() {
                            console.log("Getting top songs for user.");
                            console.log(topTracks);
                            addItems(topTracks);
                        });
  topArtists = d3.select('#top_artists')
                        .on('click', function() {
                            console.log("Getting top artists for user.");
                            console.log(topArtists);
                            addItems(topArtists);
                        });
  userGraph = d3.select('#user_graph')
                      .on('click', function() {
                          console.log("Generating User graph.");
                          makeUserGraph(graph);
                        });
  //makeUserGraph();
}


// gets top X (0 through 50) playlists determined by 'limit'
function populateUserPlaylists() {
  console.log("List Playlists");
  var base_url = "https://api.spotify.com/v1/me/playlists";
  var call_url = base_url + '?' + $.param({
    'limit' : MAX_PLAYLISTS
  });  $.ajax({
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
        //console.log(val.genres);
        for(i in val.genres) {
          var key = val.genres[i];
          //console.log(val.genres[i]);
          if(genres[key]) {
            genres[key]++;
          } else {
            genres[key] = 1
          }
        }
      }
      console.log(genres);
      topArtists = result.items;
      //addItems(result);
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
      graph.nodes.push({ 'id' : user.display_name,
                         'data' : user,
                         'depth' : 0});
      for(i = 0; i < RANGE_ARTIST_GRAPH; i++) {
        var new_artist = data[i];
        // make link for current users realted artists
        graph.links.push({ 'source' : user.display_name,
                          'target' : new_artist.name });
        // make node from current user to new artists
        graph.nodes.push({ 'id' : new_artist.name,
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
            graph.nodes.push({ 'id' : new_artist.name,
                                'data' : new_artist,
                                'depth' : new_depth});
            // make link from passed artist to new artist
            graph.links.push({'source' : artist.name,
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




function addGenreBarChart(genres) {

// Parameters for our plot
var svg_width = 800;
var svg_height = 800;
var left_margin = 90;
var text_height = 12;
var margin = 40;
var plot_width = svg_width - margin - left_margin;
var plot_height = svg_height - 2 * margin;

// Create the SVG
var svg = d3.select('#plot').append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height);

// Make an x scale and axis for our term bars
var xscale = d3.scaleBand()
               .paddingInner(0.3)
               .paddingOuter(0.3)
               .domain(Object.keys(word_counts))
               .range([left_margin, left_margin + plot_width]);

var xaxis = d3.axisBottom(xscale);

// Make a y scale and axis for our percentages
var yscale = d3.scaleLinear()
               .domain([0, 0.01])
               .range([margin + plot_height, margin]);

var yaxis = d3.axisLeft(yscale).tickFormat(d3.format(".1%"));

// Add the x axis
svg.append('g')
   .attr('class', 'xaxis')
   .attr('transform', 'translate(0, ' + (margin + plot_height) + ')')
   .call(xaxis);

// Add the y axis
svg.append('g')
   .attr('class', 'yaxis')
   .attr('transform', 'translate(' + left_margin + ', 0)')
   .call(yaxis);

// Add the x axis label
svg.append('text')
   .attr('class', 'xaxis-label')
   .attr('transform', 'translate(' + (left_margin + plot_width/2) + ', ' + (svg_height) + ')')
   .attr('text-anchor', 'middle')
   .text('Term');

// Add the y axis label
svg.append('text')
   .attr('class', 'yaxis-label')
   .attr('transform', 'translate(' + text_height + ', ' + (margin + plot_height/2) + ') rotate(-90)')
   .attr('text-anchor', 'middle')
   .text('Percent of Tweets Containing Term');
}

// code to make bar chart of genres for users artists
function update_plot() {
  // Update our yscale
  yscale.domain([0, Math.max(0.01, d3.max(Object.values(word_counts)) / tweet_count)])
        .nice();

  // Re-generate the y axis with our new y scale
  d3.select('g.yaxis')
    .transition().duration(500) // Use a transition so the y axis changes smoothly
      .call(yaxis);

  // Make a data join between rectangles and our word count data.
  // We use the d3.entries function to transform our object:
  // {'Happy': 0, 'Sad': 0} becomes [{key: 'Happy', value: 0}, {key: 'Sad', value: 0}]
  var join = svg.selectAll('rect').data(d3.entries(genres));

  join.enter() // For new bars, create a rect with zero height at the bottom of the bar chart
        .append('rect')
        .attr('class', d => 'bar ' + d.key)
        .attr('x', d => xscale(d.key))
        .attr('y', yscale(0))
        .attr('height', 0)
        .attr('width', xscale.bandwidth())
      .merge(join) // Update *all* rects to be the right height, but use a transition
        .transition().duration(500)
        // Move the bar down 0.5 so the bar outline overlaps the axis line
        .attr('y', d => yscale(d.value / tweet_count) + 0.5)
        .attr('height', d => yscale(0) - yscale(d.value / tweet_count));
}
