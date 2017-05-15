var access_token = sessionStorage.getItem('OAuth');
var user = JSON.parse(sessionStorage.getItem('user'));

// SVG ELEMENTS
var topPlaylists = d3.select('#top_playlists')
                      .on("click",function() {
                          console.log("get top playlists.");
                          listPlaylists();
                      });

function generateTopPlaylists() {
  topPlaylists.attr("class","active");
  console.log("generating user's top playlists.");
  var playlists = listPlaylists();
};
