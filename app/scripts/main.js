
 var width = 500,
      height = 500;



var svg = d3.select("svg")      
	  .attr("width", width)
      .attr("height", height);;

  var projection = d3.geo.mercator()
      // where to center the map in degrees
      .center([10, 60 ])
      // zoomlevel
      .scale(1000)
      // map-rotation
      .rotate([0,0]);

 var path = d3.geo.path()
    .projection(projection);

d3.json("geo/fylker.geojson", function(error, fylker) {
  if (error) return console.error(error);
  svg.append("path")
      .datum(fylker)
      .attr("d", path);
});