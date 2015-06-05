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


			projection.scale(scale*0.7);

			var path = vis.selectAll('path').data([json.features[identifier]]).enter().append('path')
			.attr('d', fylke)
			.style('fill', 'none')
			.style('stroke-width', '2')
			.style('stroke', 'white');

			action(path, projection, fylke);
		});
	}

	function drawLine(path, projection, fylke){
		var totalLength = path.node().getTotalLength();

		path
		.attr('stroke-dasharray', totalLength + ' ' + totalLength)
		.attr('stroke-dashoffset', totalLength)
		.transition()
		.duration(20000)
		.ease('linear')
		.attr('stroke-dashoffset', 0).each("end", function(){
			OnQuestionDone(10);
		});
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
		.attr('d', fylke).each("end", function(){
			OnQuestionDone(10);
		});
}
	

	function isCorrect(guess, recognition){
		if(guess === correctAnswer){
			console.log('HELT RETT!');
			recognition.stop();
			OnQuestionDone(100);
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


function randInt(min, max)
{
	return Math.floor(Math.random()*(max-min)+min);
}

function generateQuestions(numQuestions)
{
	var questions = []
	var question = {
		func: null,
		identifier: null,
		action: null,
		answer: null
	}
	
	var categories = [{
		name:"fylke",
		useFunc: getFylke,
		choices: 19,
		twists: [drawLine, zoomIn]
		
	}, {
		name:"kommune",
		useFunc: getKommune,
		choices: 419,
		twists: [drawLine, zoomIn]
	}]
	
	for(var i = 0; i < numQuestions; i++){
		
		//Fylke eller kommune
		//Find category
		var category = categories[randInt(0,categories.length)];
		console.log(category);
		
		var identifier = randInt(0,category.choices);
		
		var question = {
			ask: "Hvilken "+category.name +" er dette?",
			func: category.useFunc,
			identifier: identifier,
			action: category.twists[randInt(0, category.twists.length)],
			answer: "Buskerud"
		}
		console.log(question);
			questions.push(question);
	}
	return questions;
}



var questions = generateQuestions(3);

var totalScore = 0;
var questionID = 0;


function showNextQuestion(){
	
	if(questionID == questions.length){
		console.log("FERDIG: "+ totalScore +" poeng");
		
	}else{
	
var q = questions[questionID];
	
	
	correctAnswer = q.answer;
	
	q.func(q.identifier, q.action); 
	console.log("Spørsmål.."+q.ask);
	questionID++;
	}
}

function OnQuestionDone(points) {
    var evt = $.Event('questionDone');
    evt.points = points;

    vis.selectAll('path').remove();
    $(window).trigger(evt);
}


$(window).on("questionDone", function(points){
	console.log(points);
	totalScore+= points;
	showNextQuestion();
});

	//getFylke(5, zoomIn);

	
	var correctAnswer = 'buskerud';
	// startVoiceMonitoring();
//	getFylke(5, zoomIn);

	// getKommune(425, drawLine);
showNextQuestion(); //Start the game
	
})();