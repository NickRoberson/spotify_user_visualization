/*********************************/ 
/* FUNCTIONS FOR USER GRAPH PANE */
/*********************************/ 
var simulation, node, link;
function initGraph() {
	console.log("Displaying graph . . .\n" + "# of Nodes: " + graph.nodes.length + "\n# of Links: " + graph.links.length);
	console.log(graph);
	console.log(graph.nodes);
	console.log(graph.links);

	d3.selectAll('svg').remove();

	var margin = 30;
    var width = screen.width * .75 - margin;
    var height = screen.height * .75;

	// append an svg to the svg area in user_graph.html 
    var graph_area = d3.select('#user_graph_area');
	var nodes = graph.nodes;
	var links = graph.links;

	var svg = graph_area.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id','graph');

    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) {
            return d.id;
        })
		.distance(30).strength(.3))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2));
    simulation
		.nodes(nodes)
    	.on("tick", ticked);

    simulation
		.force("link")
    	.links(links);

    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
          	.enter().append("line")
           		.attr('stroke','#444444')
            	.attr("stroke-width", function(d) { 
					return Math.sqrt(d.depth*10); 
				});

    node = svg.append("g")
        .attr("class", "nodes")
    	.selectAll("circle")
    	.data(nodes)
         	.enter().append("circle")
            	.attr("r", function(d) {
              		return 40 - d.depth*8;
           		})
            	.attr("fill", function(d) {
             		console.log(d.id);
					if (d.id == user.display_name) { return "#84bd00"; }
             	 	else { return "#686868"; }
				});


    node.on('click', function(d) {
			console.log("node single click: " + d.data.id)
			appendArtistsTopTracks("right_hand_list", d.data.id, d.id);
        	})
		.on('dblclick', function(d) {
			console.log("node double click: " + d.data.id)
			//expandGraph(d.data.id, d.id, d.depth + 1);
		})
        .call(d3.drag()
        	.on("start", dragstarted)
        	.on("drag", dragged)
        	.on("end", dragended)
		);

	//node.append("text").attr("fill","#474747").text(d => d.id);

    node.append("title")
    	.text(function(d) { return d.id; });

	node.append("image")
  		.attr("xlink:href", function(d) { return d.data.images[0].url; })
  		.attr("x", "-12px")
  		.attr("y", "-12px")
  		.attr("width", "24px")
  		.attr("height", "24px");

	node.append("text")
  		.attr("dy", ".35em")
  		.attr("x", "13")
		.style("fill","#474747")
  		.style("text-anchor",  "start" )
  		.text(function(d) { return d.data.id; });

    function ticked() {
    	link.attr("x1", function(d) { return d.source.x; })
          	.attr("y1", function(d) { return d.source.y; })
          	.attr("x2", function(d) { return d.target.x; })
          	.attr("y2", function(d) { return d.target.y; });

      	node.attr("cx", function(d) { return d.x; })
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
     	if (!d3.event.active) {
			 simulation.alphaTarget(0);
		}
      	d.fixed = false;
    }
}

function restartGraph() {
  // Apply the general update pattern to the nodes.
  node = node.data(graph.nodes, function(d) { return d.id;});
  node.exit().remove();
  node = node.enter().append("circle")
          	.attr("class", "nodes")
        	.attr("r", function(d) {
    	  		return 40 - d.depth*8;
      		})
        	.attr("fill", function(d) {
         		console.log(d.id);
				if (d.id == user.display_name) { return "#84bd00"; }
             	else { return "#686868"; }
       		})
			.on('click', function(d) {
				console.log("node single click: " + d.data.id)
				appendArtistsTopTracks("right_hand_list", d.data.id, d.id);
        	})
			.on('dblclick', function(d) {
				console.log("node double click: " + d.data.id)
				expandGraph(d.data.id, d.id, d.depth + 1);
			})
			.append("title")
    			.text(function(d) { return d.id; })
			.merge(node);

  // Apply the general update pattern to the links.
  link = link.data(graph.links, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().remove();
  link = link.enter().append("line")
           		.attr('stroke','#444444')
            	.attr("stroke-width", function(d) { 
					return Math.sqrt(d.depth*10); 
				})
				.merge(link);

  // Update and restart the simulation.
  simulation.nodes(graph.nodes);
  simulation.force("link").links(graph.links);
  simulation.alpha(1).restart();
}

function expandGraph(artist_id, artist_name, new_depth) {
	console.log("expandGraph() " + artist_id + " : " + artist_name + " : " + new_depth);
	var call_url = "https://api.spotify.com/v1/artists/" + artist_id + "/related-artists";
    var new_links = [];//graph.links;
	var new_nodes = [];//graph.nodes;
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
          		for (i = 0; i < RANGE_ARTIST_GRAPH; i++) {
            		var new_artist = data[i];
            		// make node for new artist
					// make node for new artist
					console.log("new_artist.id = " + new_artist.name);
					console.log("new_depth = " + new_depth);
					console.log(new_artist);

            		new_nodes.push({	'id' : new_artist.name,
                                		'data' : new_artist,
                                		'depth' : new_depth});

           			// make link from clicked node to new artist
            		new_links.push({	'source' : artist_name,
                              			'target' : new_artist.name });

          		}
        	}
     	 }
    });
	console.log(new_nodes);
	console.log(new_links);
	// wait and remake graph
	setTimeout(function() {
		// push new nodes and links
		for(var link in new_links) {
			graph.links.push(link);
		}
		for(var node in new_nodes) {
			graph.nodes.push(node);
		}
		restartGraph();
	}, 200);
}

/********************************************************************/ 
/* FUNCTIONS FOR ADDING ITEMS (TRACKS, ARTISTS, PLAYLISTS) TO LISTS */
/********************************************************************/ 

function appendToList(list_id, items, title) {
	// add header
	appendHeader(list_id, items, title);
	// add items 
	appendItems(list_id,items);
}
function clearAndAppendItems(list_id, items) {
	d3.select("#" + list_id).selectAll('li').remove();
	appendItems(list_id,items);
}

function appendItems(list_id, items) {
	var id = "#" + list_id;
	var list_area = d3.select(id);
	// make it so if this is a song when you double click on it 
	// the option to add it to the list of selectedSongs for the user.
    
	var items = list_area.selectAll('list_item')
			.data(items)
			.enter()
				.append('li')
				.attr("class","list-item")
				.attr('id',d => {
					return 'item_' + d.id;
				})
				.on("mouseover", d => {
					d3.select('item_' + d.id).style("color", "#84bd00");
					d3.select('#play_' + d.id).style('color','#696969');
					//d3.select('#plus_' + d.id).style('color','#696969');
				})
				.on("mouseout", d => {
					d3.select('item_' + d.id).style("color", "#FFFFFF");
					d3.select('#play_' + d.id).style('color','#000000');
					//d3.select('#plus_' + d.id).style('color','#000000');
				});	

	items.append('i')
			.attr('class','fa fa-play fa-2x li-child')
			.attr('aria-hidden', true)
			.style('color','#000000')
			.attr('id', d => {
				return 'play_' + d.id;
			})
			.style('float','left')
			.on('click', d => {
				play(d);
				d3.select('#play_' + d.id).style("color", "#84bd00");
			});

	items.append('i')
			.attr('class','fa fa-plus fa-4x li-child')
			.attr('aria-hidden', true)
			.style('color','#696969')
			.style('float','left')
			.attr('id', d => {
				return 'plus_' + d.id;
			})			
			.on('click', d => {
				addToSelectedList(d);
				showNotification("Item added.", "You have added " + d.name + " to your list of selected materials!", 1000);
				d3.select('#plus_' + d.id).style("color", "#84bd00");
			});

	items.append('html')
			.attr('class','li-child')
			.style('float','left')
			.text(d => {
				return getItemTitle(d);
			});

	items.append('html')
			.attr('class','li-child')
			.style('float','right')
			.style('margin-right','15px')
			.text(d => {
				return getItemFeature(d);
			});

	items.on('dblclick', d => {
		handleDblClick(d);
		d3.select('#' + list_id).selectAll('li').style("border","0px");
		d3.select('#item_' + d.id).style("border", "2px solid #84bd00");
	})
}

function appendHeader(list_id,items,title) {
		// remove everything first before appending
	d3.select("#" + list_id).selectAll("*").remove();

	// set title
	var header = d3.select('#list_title');
	header.style("display","inline");
	header.selectAll('*').remove();
	
	// if there is artwork, add it to the title
	if(items[0].album) {
		var img_url = items[0].album.images[0].url;
		header.append('img')
			.attr("src", img_url)
			.attr("height", "90px")
			.attr("width", "90px");
	} else {
		throw "Error";
	}

	// append title
	header.append('h3').text(title)
		.style("color","#ffffff");
}

function getItemFeature(item) {
	switch(item.type) {
		case "track":
			return getTimeString(item.duration_ms);
		case "artist":
			return item.popularity;
		case "playlist":
			return item.tracks.total;
		default:
			return "";			
	}
}

function getTimeString(milliseconds) {

	var seconds = parseInt((milliseconds/1000)%60);
	var minutes = parseInt((milliseconds/60000)%60);
	
	if(seconds < 10) {
		seconds = '0' + seconds;
	}
	return minutes + ":" + seconds;
}

function getItemTitle(d) {
	var limit = 25;
	if(d.name.length > limit) {
		return d.name.substring(0,limit-2) + "...";
	} else {
		return d.name;
	}
}
/********************************************************/
/* FUNCTIONS FOR ADDING VISUALIZATIONS TO MIDDLE COLUMN */
/********************************************************/

function addGenreBarChart(genres) {

    // Parameters for our plot
	var svg_width = 400;
	var svg_height = 800;
    var text_height = 12;
    var margin = 15;
    var plot_width = svg_width - margin*2;
    var plot_height = svg_height - 2 * margin;


    // Create the SVG
    var svg = 
		d3.select('#svg_area').append('svg')
        	.attr('width', svg_width)
			.attr('height', svg_height);

    // Make an x scale and axis for our term bars
    var xscale = 
		d3.scaleBand()
        	.paddingInner(0.3)
        	.paddingOuter(0.3)
        	.domain(Object.keys(genres))
        	.range([margin, margin + plot_width]);

    var xaxis = d3.axisBottom(xscale);

    // Make a y scale and axis for our percentages
    var yscale = 
		d3.scaleLinear()
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
      	.attr('transform', 'translate(' + margin + ', 0)')
      	.call(yaxis);

    // Add the x axis label
    svg.append('text')
      	.attr('class', 'xaxis-label')
      	.attr('transform', 'translate(' + (margin + plot_width/2) + ', ' + (svg_height) + ')')
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
function update_plot(genres) {
	var genre_total = 0;
	for (var val in Object.values(genres)) {
		genre_total += val;
	}
    // Update our yscale
    yscale.domain([0, Math.max(0.01, d3.max(Object.values(genres)) / genre_total)])
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
          	.attr('y', d => yscale(d.value / genre_total) + 0.5)
          	.attr('height', d => yscale(0) - yscale(d.value / genre_total))
			.on('click', d => listGenreTopSongs(d.key));
}


/********************************/
/* FUNCTIONS FOR CLICK HANDLERS */
/********************************/

function play(d) {	
	try {
		console.log(d);
		d3.selectAll('#iframe_footer').remove();
		d3.select('#footer_wrap').append('iframe')
			.attr("id","iframe_footer")
			.attr("src","https://open.spotify.com/embed?uri=" + d.uri)
			.attr("height", "80px")
			.attr("width", "100%")
			.attr("frameborder","0")
			.attr("allowtransparency","true")
			.style("margin","0px 0px 0px 0px");
	} catch (err) {
	}
}

/***********************************************************/
/* FUNCTIONS FOR ADDING DIFF. TYPES TO SELECTED SONGS LIST */
/***********************************************************/

function addToSelectedList(d) {
	switch(d.type) {
		case "artist":
			// adds top 10 songs from artist
			addArtist(d);
			break;
		case "playlist":
			// adds all songs from playlist
			addPlaylist(d);
			break;	
		case "track":
			// adds single track
			addTrack(d);
			break;
		default: 
			console.log("Added item type is undefined.")
			console.log(d);
			break;
	}
}

function handleDblClick(d) {
	switch(d.type) {
		case "artist":
			// adds top 10 songs from artist
			break;
		case "playlist":
			getPlaylistSongs(d);
			setTimeout(function() {
				console.log(userPlaylists);
				clearAndAppendItems('right_hand_list', userPlaylists.currentPlaylist.items);
			}, 200);
			break;	
		case "track":
			// adds single track
			break;
		default: 
			console.log("Added item type is undefined.")
			console.log(d);
			break;
	};
}


function addTrack(track) {
	console.log("Adding " + track.name + " to selected tracks list.");
	// add to list 
	userSelectedSongs.items.push(track);
}

function addPlaylist(playlist) {
	console.log(playlist);
	console.log("Adding " + playlist.name + " to selected tracks list.");
  	var call_url = "https://api.spotify.com/v1/users/" + user.id + "/playlists/" + playlist.id + "/tracks";
  	// get tracks and add them to list 
	$.ajax({
  		url: call_url,
    	headers: {
      		'Authorization': 'Bearer ' + access_token
    	},
    	dataType: "json",
    	type : "GET",
    	success : function(result) {
			console.log(result);
			// add to list 
			result.items.forEach(function(item) {
				addTrack(item.track);
			});
    	}
  	});
}

function addArtist(artist) {
	var call_url = "https://api.spotify.com/v1/artists/" + artist.id + "/top-tracks?country=US";
	// get tracks and add them to list
	$.ajax({
      	url: call_url,
      	headers: {
        	'Authorization': 'Bearer ' + access_token
      	},
     	dataType: "json",
      	type : "GET",
      	success : function(result) {
			//console.log(result);
			// add to list
			result.tracks.forEach(function(item) {
				addTrack(item);
			})
		}
    });
}