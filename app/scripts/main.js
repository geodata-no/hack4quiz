/* jshint undef: true, unused: false */
/* global d3, webkitSpeechRecognition, ProgressBar, pleaseWait */
'use strict';
var useKommune = false;
var numQuestions = 3;
var fylkeAnswers = $.getJSON('geo/simplifiedFylker.geojson');
var kommuneAnswers = $.getJSON('geo/kommuner.geojson');

var fylkeFeatures = [];
fylkeAnswers.done(function(data){
	fylkeFeatures = data.features;
});


var kommuneFeatures = [];
kommuneAnswers.done(function(data){
	kommuneFeatures = data.features;
});

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
		.attr('stroke-dashoffset', 0).each('end', function(){
			// OnQuestionDone(0);
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
		.attr('d', fylke).each('end', function(){
			// OnQuestionDone(0);
		});
	}

	function zoomOut(path, projection, fylke){

		
		var targetScale = projection.scale();
		projection
		.scale(targetScale*3);

		vis.selectAll('path')
		.attr('d', fylke);

		projection.scale(targetScale);
		
		vis.selectAll('path')
		.transition()
		.duration(15000)
		.attr('d', fylke).each('end', function(){
			// OnQuestionDone(0);
		});
	}
	

	function isCorrect(guess, recognition){
		if(guess.indexOf(correctAnswer.toLowerCase()) > -1){
			console.log('HELT RETT!');
			rightAnswers++;
			$('#riktig').show();
			setTimeout(function(){
				$('#riktig').hide();
			},1000);
			new OnQuestionDone(parseInt((1000 - progressbar.value() * -999).toFixed(0)));
		}
		console.log('Gjettet: '+ guess + '('+guess.indexOf(correctAnswer.toLowerCase()) +')');

	}

	function startVoiceMonitoring(){
		recognition = new webkitSpeechRecognition();
		recognition.continuous = true; 
		recognition.interimResults = true;
		recognition.lang = 'no-NB';
		recognition.start();

		recognition.onstart = function(event){ 
			console.log('onstart', event);
		};   
		recognition.onresult = function(event){
			var interimTranscript = '';
			var finalTranscript = '';

			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					finalTranscript += event.results[i][0].transcript;
				} else {
					interimTranscript += event.results[i][0].transcript;
				}
			}
			isCorrect(interimTranscript, recognition);
		};

		$(document).keydown(function(e) {
			switch(e.which) {
        case 37: // left
        break;

        case 38: // up
        if(questionID <= questions.length){
        	isCorrect(correctAnswer.toLowerCase(), recognition);
        }
        break;

        case 39: // right
        break;

        case 40: // down
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});
		
		recognition.onerror = function(event){
			console.log('onerror', event);
		};

		recognition.onend = function(){ 
			console.log('onend');
		};
	}

	function randInt(min, max)
	{
		return Math.floor(Math.random()*(max-min)+min);
	}


	function generateQuestions(numQuestions)
	{
		var questions = [];
		var question = {
			func: null,
			identifier: null,
			action: null,
			answer: null
		};





		var categories = [{
			name:'fylke',
			useFunc: getFylke,
			choices: 19,
			// twists: [zoomOut]
			twists: [drawLine, zoomIn, zoomOut]

		}];
		
		if(useKommune){
			categories.push({
				name:'kommune',
				useFunc: getKommune,
				choices: 419,
				// twists: [zoomOut]
				twists: [drawLine, zoomIn, zoomOut]
			});
		}



		for(var i = 0; i < numQuestions; i++){

		//Fylke eller kommune
		//Find category
		var category = categories[randInt(0,categories.length)];
		
		
		var identifier = randInt(0,category.choices);
		
		question = {
			ask: 'Hvilken '+category.name +' er dette?',
			func: category.useFunc,
			identifier: identifier,
			action: category.twists[randInt(0, category.twists.length)],
			answer: null
		};
		if(category.name ==='kommune'){
			console.log(identifier,kommuneFeatures[identifier]);
			question.answer = kommuneFeatures[identifier].properties.NAVN;
			question.ask = 'Hvilken kommune er dette?';
		}else if(category.name ==='fylke'){ 
			question.answer = fylkeFeatures[identifier].properties.NAVN;
			question.ask = 'Hvilket fylke er dette?';
		}

		console.log(question);
		questions.push(question);

	}
	return questions;
}



var questions = null;

var totalScore = 0;
var questionID = 0;
var rightAnswers = 0;

function showNextQuestion(){
	
	$('#tscore').html(totalScore);
	$('#score-board').html((questions.length - questionID)   +' spørsmål igjen');
	if(questionID >= questions.length){

		//progressbar.destroy();
		$('#progressbar').hide();
		$('#scoreboard').html(totalScore +' poeng');
		
		var rightText ='<h2>Riktige svar:</h2>';
		questions.forEach(function(q){
			rightText +=q.answer+'<br/>';
		});
		
		console.log(rightText);
		$('#correctanswer').html(rightText);
		

		$('#question-text').hide();
		$('.jumbotron').show();
		
	}else{
		$('#progressbar').show();
		var q = questions[questionID];
		correctAnswer = q.answer.split('-').join(' ');

		progressbar = progressbar || initProgressBar();
		progressbar.set(0);

		progressbar.animate(-1, function() {
			console.log('tiden er ute!');
			new OnQuestionDone(0);
		});

		q.func(q.identifier, q.action); 
		console.log('Spørsmål..'+q.ask);
		console.log(correctAnswer);
		$('#question-text').html(q.ask);
		
	}
	questionID++;


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
		duration: 18000,
		text: {
			value: '0'
		},
		step: function(state, bar) {
			bar.setText((1000 - bar.value() * -999).toFixed(0));
		}
	});

	return circle;
}



$(window).on('questionDone', function(points){

	totalScore+= points.points;
	$('#tscore').html(totalScore);
	showNextQuestion();
});
var progressbar, correctAnswer;
function init(){
	progressbar = progressbar || initProgressBar();
	correctAnswer = '';
	totalScore = 0;
	questionID = 0;
	rightAnswers = 0;
	startVoiceMonitoring();
	setTimeout(function(){
		questions = generateQuestions(numQuestions);
showNextQuestion(); //Start the game
}, 2000);
}

var loadingScreen = pleaseWait({
	logo: 'images/hipsterlogo.png',
	backgroundColor: '#EFC94C',
	loadingHtml: '<h2>Test dine geografikunnskaper med denne quizen!</h2><h4>Snakk tydelig inn i mikrofonen når du vet hvilket fylke eller hvilken kommune geometrien representerer. Jo raskere du er jo mer poeng får du!</h4><button type="button" class="startbutton btn btn-lg btn-default">Start quiz!</button>'
});

$('.startbutton').click(function(){
	loadingScreen.finish();
	init();
});

// init();
$('.tryagain').click(function(){
	$('.jumbotron').hide();
	$('#question-text').show().html('');
	init();
});

})();