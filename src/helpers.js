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
};

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
  var images = node.append("g")
            .attr("xlink:href",  function(d) { return d.data.images[0].url;})
            .attr("x", function(d) { return d.cx;})
            .attr("y", function(d) { return d.cy;})
            .attr("height", 20)
            .attr("width", 20);

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
