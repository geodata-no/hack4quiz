/* jshint undef: true, unused: false */
/* global d3 */
'use strict';

var fylkeAnswers = $.getJSON("geo/fylker.geojson");
var kommuneAnswers = $.getJSON('geo/kommuner.geojson');

(function () {

	var width  = window.innerWidth;
	var height = window.innerHeight;
	var recognition;


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
		.duration(15000)
		.ease('linear')
		.attr('stroke-dashoffset', 0).each("end", function(){
			OnQuestionDone(0);
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
		.duration(15000)
		.attr('d', fylke).each("end", function(){
			OnQuestionDone(0);
		});
	}
	

	function isCorrect(guess, recognition){
		if(guess.indexOf(correctAnswer.toLowerCase()) !== -1){
			console.log('HELT RETT!');
			$('#riktig').show();
			setTimeout(function(){
				$('#riktig').hide();
			},1000)
			OnQuestionDone(Math.round(progressbar.value()*-1000));
		}
		console.log('Gjettet: '+ guess);

	}

	function startVoiceMonitoring(){
		recognition = new webkitSpeechRecognition();
		recognition.continuous = true; 
		recognition.interimResults = true;
		recognition.lang = 'no-NB' 
		recognition.start();

		recognition.onstart = function(event){ 
			console.log("onstart", event);
		}   
		recognition.onresult = function(event){
			var interim_transcript = '';
			var final_transcript = '';

			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					final_transcript += event.results[i][0].transcript;
				} else {
					interim_transcript += event.results[i][0].transcript;
				}
			}
			isCorrect(interim_transcript, recognition);
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



		var fylkeFeatures = []
		fylkeAnswers.done(function(data){
			console.log(data);
			fylkeFeatures = data.features;
		});


		var kommuneFeatures = [];
		kommuneAnswers.done(function(data){
			console.log(data);
			kommuneFeatures = data.features;
		});

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
		
		
		var identifier = randInt(0,category.choices);
		
		var question = {
			ask: "Hvilken "+category.name +" er dette?",
			func: category.useFunc,
			identifier: identifier,
			action: category.twists[randInt(0, category.twists.length)],
			answer: null
		}
		if(category.name=="kommune"){
			question.answer = kommuneFeatures[identifier].properties.NAVN
			question.ask = "Hvilken kommune er dette?";
		}else if(category.name=="fylke"){ 
			question.answer = fylkeFeatures[identifier].properties.NAVN
			question.ask = "Hvilket fylke er dette?";
		}

		console.log(question)
		questions.push(question);

	}
	return questions;
}



var questions = null;

var totalScore = 0;
var questionID = 0;


function showNextQuestion(){
	
	if(questionID == questions.length){
		console.log("FERDIG: "+ totalScore +" poeng");

		progressbar.stop();
		$('#question-text').hide();
		$('.jumbotron').show();
		$('#scoreboard').html(totalScore + " poeng");
		
	}else{

		var q = questions[questionID];


		correctAnswer = q.answer.split("-").join(" ");

		progressbar = progressbar || initProgressBar();
		progressbar.set(0);

		progressbar.animate(-1, function() {
			console.log('tiden er ute!');
		});

		q.func(q.identifier, q.action); 
		console.log("Spørsmål.."+q.ask);
		console.log(correctAnswer);
		$('#question-text').html(q.ask);
		questionID++;
	}

}

function OnQuestionDone(points) {
	var evt = $.Event('questionDone');
	evt.points = points;

	vis.selectAll('path').remove();
	correctAnswer = 'pasjdakosjasd';
	progressbar.stop();
	$(window).trigger(evt);
}

function initProgressBar(){
	var circle = new ProgressBar.Circle('#progressbar', {
		color: 'white',
		strokeWidth: 3,
		trailWidth: 2,
		trailColor: 'black',
		duration: 15000,
		text: {
			value: '0'
		},
		step: function(state, bar) {
			bar.setText((1000 - bar.value() * -999).toFixed(0));
		}
	});

	return circle;
}



$(window).on("questionDone", function(points){

	totalScore+= points.points;
	$("#score-board").text(totalScore+" poeng");
	showNextQuestion();
});
var progressbar, correctAnswer;
function init(){
	progressbar = progressbar || initProgressBar();
	correctAnswer = '';
	startVoiceMonitoring();

	setTimeout(function(){
		questions= generateQuestions(3);
showNextQuestion(); //Start the game
}, 1000);
}

init();
$('.tryagain').click(function(){
	$('.jumbotron').hide();
	$('#question-text').show().html('');
	init();
});

})();