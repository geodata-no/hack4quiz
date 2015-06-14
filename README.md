#hack4quiz

![hack4quiz](https://raw.githubusercontent.com/spohner/hack4quiz/master/app/images/promo.jpg)

This is [@spohner](https://twitter.com/spohner) and [@kfoerde](https://twitter.com/kfoerde) entry for [#hack4no 2015](http://www.hack4.no/hack4/). 

[@spohner](https://twitter.com/spohner) and [@kfoerde](https://twitter.com/kfoerde) works as developers for [@GeodataAS](http://www.geodata.no).

\#hack4quiz is an entertaining quiz which goal is to identify the correct norwegian county (fylke). There is also possible to guess municipalities (kommuner), but this was found to be very hard. You are warned! 

The quiz has some twists. Each county is drawn with one of three effets:
* ZoomIn
* ZoomOut
* DrawLine

The longer it takes the to guess the county the less points are awarded for the answer. The correct answer has to be delivered by speech. The quiz leverages the Web Speech API. Check your browser for compability(http://caniuse.com/#feat=web-speech). Our test show that Google Chrome works best.

Three questions are asked per round and after each round will the total amount of point be displayed.

