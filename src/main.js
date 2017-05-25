var access_token = sessionStorage.getItem('OAuth');
var user = JSON.parse(sessionStorage.getItem('user'));


// CONSTANTS
var MAX_ARTISTS = 50;
var MAX_TRACKS = 50;
var MAX_PLAYLISTS = 50;
var RANGE_ARTIST_GRAPH = 4;
var DEPTH_USER_GRAPH = 4;
var userGraph;
var topPlaylists;
var topTracks;
var topArtists;
var list_area;

var artists_graph = [];
var graph = {};
graph.nodes = [];
graph.links = [];
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
                          //makeUserGraph();
                        });
  //makeUserGraph();
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
  var width = screen.width;
  var height = screen.height;

  var svg = d3.select('body').append('svg')
      .attr('width', width)
      .attr('height', height);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr('stroke','#444444')
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", function(d) {
        if (d.id == user.display_name) { return 50; }
        else { return 10; }
       })
       .attr("fill", function(d) {
         if (d.id == user.display_name) { return "#84bd00"; }
         else { return "#686868"; }
       })
       .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  node.append("title")
      .text(function(d) { return d.id; });

  simulation.nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
}

// depth set to 3
function populateArtistGraph() {
  console.log("populateArtistGraph()");
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
      console.log(artists);
      graph.nodes.push({'id' : user.display_name });
      for(i = 0; i < RANGE_ARTIST_GRAPH; i++) {
        // PUSH NODE TO GRAPH
        graph.nodes.push({'id' : artists[i].name});
        graph.links.push({source : user.display_name,
                          target : artists[i].name,
                          depth : 1});
       }
       getRelatedArtists(artists, 2);
    }
  });
  //console.log(artists_graph);
  setTimeout(function() {
    console.log(graph);
    makeUserGraph();
    //addItems({'items' :artists_graph });
  }, 1000);
}



function getRelatedArtists(artists, depth) {
  console.log("getRelatedArtists()");
  if (depth < DEPTH_USER_GRAPH) {
    console.log("Getting related artists.");
    for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
      var name = artists[i].name;
      // PUSH NODES TO GRAPH
      graph.nodes.push({'id' : artists[i].name});
      artists_graph.push(artists[i]);
      //console.log(i + ": " + artists[i].name + " : " + artists[i].id);
      var call_url = "https://api.spotify.com/v1/artists/" + artists[i].id + "/related-artists";
      $.ajax({
        url: call_url,
        dataType: "json",
        type : "GET",
        success : function(result) {
          var artists = result.artists;
          for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
            graph.links.push({source : name,
                              target : artists[i].name,
                              depth : depth});
          }
          var artists = result.artists;
          getRelatedArtists(artists,depth+1);
        }
      });
    }
  } else {
      var name;
      for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
        //artists[i].depth = depth;
        name = artists[i].name;
        graph.nodes.push({'id' : artists[i].name});
        graph.links.push({source : name,
                          target : artists[i].name,
                          depth : depth});
        artists_graph.push(artists[i]);
      }
    }
};


function bucket(items) {

}
