  var width  = window.innerWidth;
  var height = window.innerHeight;

  var vis = d3.select("#vis").append("svg")
  .attr("width", width).attr("height", height)

  d3.json("geo/fylker.geojson", function(json) {
      // create a first guess for the projection
      var center = d3.geo.centroid(json.features[2]);
      var scale  = 2000*2;
      var offset = [width/2, height/2];
      var projection = d3.geo.mercator().scale(scale).center(center)
      .translate(offset);

      // create the path
      var path = d3.geo.path().projection(projection);

      var path2 = vis.selectAll("path").data([json.features[2]]).enter().append("path")
      .attr("d", path)
      .style("fill", "none")
      .style("stroke-width", "5")
      .style("stroke", "white");

      var totalLength = path2.node().getTotalLength();

       path2
      .attr("d", path)
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
            .transition()
        .duration(2000)
        .ease("linear")
        .attr("stroke-dashoffset", 0);

      // add a rectangle to see the bound of the svg

      // var path2 = vis.selectAll("path").data([json.features[2]]).enter().append("path")
      // .attr("d", path)
      // .style("fill", "none")
      // .style("stroke-width", "5")
      // .style("stroke", "white")

      // var totalLength = path2.node().getTotalLength();


      // var zoom = d3.behavior.zoom()
      // .translate([width / 2, height / 2])
      // .scale(scale)
      // .scaleExtent([scale, 800 * scale])
      // .on("zoom", zoomed);

      vis.on("click", zoomed);

      // vis.call(zoom);

      function zoomed() {
      	projection
      	.scale(20);

      	path2
      	.attr("stroke-dashoffset", totalLength)
      	.transition()
      	.duration(13000)


      	vis.selectAll("path")
      	.transition()
      	.duration(13000)
      	.attr("d", path);

      // // 	      path2
      // // .attr("stroke-dasharray", totalLength + " " + totalLength)
      // // .attr("stroke-dashoffset", totalLength)
      // // .transition()
      // //   .duration(20000)
      // //   .ease("linear")
      // //   .attr("stroke-dashoffset", 0);

      ;
  }

      // function zoomed(){
      // // 	      var path2 = vis.selectAll("path").data([json.features[2]]).enter().append("path")
      // // .attr("d", path)
      // // .style("fill", "none")
      // // .style("stroke-width", "5")
      // // .style("stroke", "white");

      // //   console.log(path2);


      // // var totalLength = path2.node().getTotalLength();
      // // 	      path2
      // // .attr("stroke-dasharray", totalLength + " " + totalLength)
      // // .attr("stroke-dashoffset", totalLength)
      // // .transition()
      // //   .duration(20000)
      // //   .ease("linear")
      // //   .attr("stroke-dashoffset", 0);

      // }
  });
