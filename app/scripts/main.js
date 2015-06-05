/* jshint undef: true, unused: false */
/* global d3 */
'use strict';

(function () {

	var width  = window.innerWidth;
	var height = window.innerHeight;

	var vis = d3.select('#vis').append('svg')
	.attr('width', width).attr('height', height);


	function getFylke(fylkenr, action){
		getOutline('geo/fylker.geojson', fylkenr, action);
	}

	function getKommune(kommunenr, action){
		getOutline('geo/kommuner.geojson', kommunenr, action);
	}

	function getOutline(input, identifier, action){
		d3.json(input, function(json) {

			var center = d3.geo.centroid(json.features[identifier]);
			var scale  = 2000;
			var offset = [width/2, height/2];
			var projection = d3.geo.mercator().scale(scale).center(center)
			.translate(offset);

			var fylke = d3.geo.path().projection(projection);

			var bounds  = fylke.bounds(json.features[identifier]);
			var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
			var vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
			scale   = (hscale < vscale) ? hscale : vscale;
			offset  = [width - (bounds[0][0] + bounds[1][0])/2,
			height - (bounds[0][1] + bounds[1][1])/2];


			projection.scale(scale*0.8);

			var path = vis.selectAll('path').data([json.features[identifier]]).enter().append('path')
			.attr('d', fylke)
			.style('fill', 'none')
			.style('stroke-width', '2')
			.style('stroke', 'white');

			action(path, projection, fylke);
			// drawLine(path);
			// zoomIn(path, projection, fylke);
			// drawLine(path);
		});
	}

	function drawLine(path){
		var totalLength = path.node().getTotalLength();

		path
		.attr('stroke-dasharray', totalLength + ' ' + totalLength)
		.attr('stroke-dashoffset', totalLength)
		.transition()
		.duration(20000)
		.ease('linear')
		.attr('stroke-dashoffset', 0);
	}

	function zoomIn(path, projection, fylke){
		var targetScale = projection.scale();
		projection
		.scale(20);

		vis.selectAll('path')
		.attr('d', fylke);

		projection.scale(targetScale);

		vis.selectAll('path')
		.transition()
		.duration(13000)
		.attr('d', fylke);
	}

	function isCorrect(guess, recognition){
		if(guess === correctAnswer){
			console.log('HELT RETT!');
			recognition.stop();
		}
		console.log(guess);
	}

	function startVoiceMonitoring(){
		var recognition = new webkitSpeechRecognition();
		recognition.continuous = true; 
		recognition.interimResults = true;
		recognition.lang = 'no-NB' 
		recognition.start();

		recognition.onstart = function(event){ 
			console.log("onstart", event);
		}   

		recognition.onresult = function(event){ 
			isCorrect(event.results[0][0].transcript, recognition);
		}

		recognition.onerror = function(event){
			console.log("onerror", event);
		}

		recognition.onend = function(){ 
			console.log("onend");
		}
	}

	var correctAnswer = 'buskerud';
	// startVoiceMonitoring();
	getFylke(5, zoomIn);
	// getKommune(425, drawLine);


})();