var user, access_token;
var run = function() {
  var u = JSON.parse(sessionStorage.getItem('user'));
  access_token = sessionStorage.getItem('OAuth');
  user = u;
  console.log(user);
  listPlaylists();
};

var listPlaylists = function() {

  var base_url = "https://api.spotify.com/v1/users/" + user.id + "/playlists";

  var call_url = base_url + '?' + $.param({
    'user_id' : user.id,
    'access_token' : access_token,
    'limit' : 15,
  });
  $.ajax({
    url: call_url,
    dataType: "json",
    type : "GET",
    success : function(result) {
      console.log(result);
    }
  });
}

run();
