var access_token = sessionStorage.getItem('OAuth');
var user = JSON.parse(sessionStorage.getItem('user'));


// CONSTANTS
var MAX_ARTISTS = 50;
var MAX_TRACKS = 50;
var MAX_PLAYLISTS = 50;
var RANGE_ARTIST_GRAPH = 5;
var DEPTH_USER_GRAPH = 3;
var userGraph;
var topPlaylists;
var topTracks;
var topArtists;
var list_area;

var artists_graph = [];
startup();

function startup() {
  d3.select('#user_title').text(user.display_name);
  list_area = d3.select('#song_area');
  console.log("Access Token = " + access_token);
  console.log(user);

  // TABS
  topPlaylists = d3.select('#playlists')
                        .on("click",function() {
                            console.log("Getting playlists for user.");
                            meAllPlaylists();
                        });
  topPlaylists = d3.select('#top_songs')
                        .on("click",function() {
                            console.log("Getting top songs for user.");
                            listSongs();
                        });
  topArtists = d3.select('#top_artists')
                        .on('click', function() {
                            console.log("Getting top artists for user.");
                            listArtists();
                        });
  userGraph = d3.select('#user_graph')
                      .on('click', function() {
                          console.log("Generating User graph.");
                          populateArtistGraph();
                          makeUserGraph();
                        });
  makeUserGraph();
}


// gets top X (0 through 50) playlists determined by 'limit'
function meAllPlaylists() {
  console.log("List Playlists");
  var base_url = "https://api.spotify.com/v1/me/playlists";
  var playlists;
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
      addItems(result);
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

function listSongs() {
  console.log("List Songs");
  var base_url = "https://api.spotify.com/v1/me/tracks";
  var call_url = base_url + '?' + $.param({
    'limit' : MAX_TRACKS,
    'time_range':'long_term',
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
        console.log(song.track.name);
        song.name = song.track.name;
      }
      result.items.reverse();
      addItems(result);
    }
  });
};

/* DOESNT WORK IDK WHY */
function listArtists() {
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
      addItems(result);
    }
  });
};


function addItems(list) {

  d3.selectAll('svg').remove();
  list_area.selectAll('#list_item').remove();

  list_area.selectAll('list_item')
        .data(list.items)
        .enter()
          .append('div')
          .style('border','2px solid #363636')
          .style('border-radius','15px')
          .style('padding','5px 5px 5px 10px')
          .style('color','white')
          .style('width','350px')
          .style('margin','5px')
          .attr('id','list_item')
          .text(d => d.name)
          .on("mouseover", function(d){
            d3.select(this).style("border-color", "#84bd00");
          })
          .text(d => d.name)
          .on("mouseout", function(d){
            d3.select(this).style("border-color", "#363636");
          });
};

function makeUserGraph() {

  list_area.selectAll('#list_item').remove();
  d3.selectAll('svg').remove();

  var width = screen.width,
    height = screen.height;

var force = d3.layout.force()
    .size([width, height])
    .charge(-400)
    .linkDistance(40)
    .on("tick", tick);

var drag = force.drag()
    .on("dragstart", dragstart);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

d3.json("src/graph.json", function(error, graph) {
  if (error) throw error;

  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  link = link.data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke","#444444");

  node = node.data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 12)
      .style('fill','#888888')
      .on("dblclick", dblclick)
      .call(drag);
});

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function dblclick(d) {
  d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}
}

// depth set to 3
function populateArtistGraph() {
  console.log("populateArtistGraph()")
  var artists = [];
  var base_url = "https://api.spotify.com/v1/me/top/artists";
  var call_url = base_url + '?' + $.param({
    'limit': 5,
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
      var artists = result.items;
      for(i = 0; i < RANGE_ARTIST_GRAPH; i++) {
        artists[i].depth = 1;
        artists_graph.push(artists[i]);
      }
      getRelatedArtists(artists, 2);
    }
  });
  //console.log(artists_graph);
  setTimeout(function() {
    console.log(artists_graph);
    addItems({'items' :artists_graph });
  }, 1000);
}



function getRelatedArtists(artists, depth) {
  console.log("getRelatedArtists()");
  if (depth < DEPTH_USER_GRAPH) {
    console.log("Getting an artists related artists.");
    for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
      artists[i].depth = depth;
      artists_graph.push(artists[i]);
      console.log(i + ": " + artists[i].name + " : " + artists[i].id);
      var call_url = "https://api.spotify.com/v1/artists/" + artists[i].id + "/related-artists";
      $.ajax({
        url: call_url,
        dataType: "json",
        type : "GET",
        success : function(result) {
          var artists = [];
          artists = result.artists;
          getRelatedArtists(artists,depth+1);
        }
      });
    }
  } else {
      for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
        artists[i].depth = depth;
        artists_graph.push(artists[i]);
      }
    }
};
