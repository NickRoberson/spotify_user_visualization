var listPlaylists = function() {
  var base_url = "https://api.spotify.com/v1/users/" + user.id + "/playlists";
  var playlists;
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
      if(result.items.length > 0) {
        var svg = d3.select('#svg');
        svg.append('div')
            .attr('id','list')
            .style('overflow','scroll')
            .style('height','450px');\
            .style('width','30%');
        var list = svg.select('#list');
        for(playist of result.items) {
            list.append('div')
                .attr('class','card')
                .style('opacity','0')
                .style('background','white')
                .html("<p> Song! </p>")
                .transition(500)
                  .style('opacity','1');
        }
      }
    }
  });

  return playlists;
}
