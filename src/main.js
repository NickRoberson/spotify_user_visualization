var access_token = sessionStorage.getItem('OAuth');
var user = JSON.parse(sessionStorage.getItem('user'));

// SVG ELEMENTS

var topPlaylists = d3.select('top_playlists');

var generateTopPlaylists = function() {
  topPlaylists.attr("class","active");
  console.log("generating user's top playlists.");
  var playlists = listPlaylists();
};
