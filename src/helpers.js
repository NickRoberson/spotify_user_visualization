function addItems(items) {

  d3.selectAll('svg').remove();
  list_area.selectAll('#list_item').remove();

  list_area.selectAll('list_item')
        .data(items)
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
}

function makeUserGraph() {

  list_area.selectAll('#list_item').remove();
  d3.selectAll('svg').remove();
  d3.selectAll('#graph').remove();

  var width = screen.width;
  var height = screen.height;

  var svg = d3.select('body').append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('id','graph');

  var simulation = d3.forceSimulation()
                     .force("link", d3.forceLink().id(function(d) {
                       return d.id;
                     }).distance(40).strength(.2))
                     .force("charge", d3.forceManyBody().strength(-200))
                     .force("center", d3.forceCenter(width / 2, height / 2 - 50));

  var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
          .attr('stroke','#444444')
          .attr("stroke-width", function(d) { return Math.sqrt(d.depth*10); });

  var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
          .attr("r", function(d) {
            return 40 - d.depth*8;
          })
          .attr("fill", function(d) {
            if (d.id == user.display_name) { return "#84bd00"; }
            else { return "#686868"; }
          });

  node.on('click', function(d) {
          d3.select(this).transition().duration(300)
            .attr("r", 100);
          })
          .on('dblclick', function(d) {
            d3.select(this).transition().duration(300)
              .attr("r", 40 - d.depth*8);
          })
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

  node.append("title")
      .text(function(d) { return d.id; });

  // Append images
  /*  var images = node.append("g")
            .attr("xlink:href",  function(d) { return d.data.images[0].url;})
            .attr("x", function(d) { return d.cx;})
            .attr("y", function(d) { return d.cy;})
            .attr("height", 20)
            .attr("width", 20);
  */
  simulation.nodes(graph.nodes)
            .on("tick", ticked);

  simulation.force("link")
            .links(graph.links);

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
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fixed = true;
  }
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
