(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/* part1.js      (update name changes in gulpfile)
==================================== */

// var $ = require('jquery');

//--------------
    // Audio Object
    //--------------
    var audio = {
        buffer: {},
        compatibility: {},
        files: [
          'audio/kick-snare-loop-1.mp3',
          'audio/hihat-loop-1.mp3',
          'audio/bass-loop-1.mp3',
          'audio/keys-loop-1.mp3',
          'audio/kick-snare-loop-2.mp3',
          'audio/hihat-loop-2.mp3',
          'audio/bass-loop-2.mp3',
          'audio/keys-loop-2.mp3',
          'audio/kick-snare-loop-3.mp3',
          'audio/hihat-loop-3.mp3',
          'audio/bass-loop-3.mp3',
          'audio/keys-loop-3.mp3'
        ],
        proceed: true,
        source_loop: {},
        source_once: {}
    };

    var playingAllLoop1 = false,
      playingAllLoop2 = false,
      playingAllLoop3 = false;

    var gainNodeDrums,
        gainNodeHH,
        gainNodeBass,
        gainNodeKeys;

 
    //-----------------
    // Audio Functions
    //-----------------
    audio.findSync = function(n) {
        var first = 10,
            current = 30,
            offset = 10;
 
        // Find the audio source with the earliest startTime to sync all others to
        for (var i in audio.source_loop) {
            current = audio.source_loop[i]._startTime;
            if (current > 0) {
                if (current < first || first === 0) {
                    first = current;
                }
            }
        }
 
        if (audio.context.currentTime > first) {
            offset = (audio.context.currentTime - first) % audio.buffer[n].duration;
        }
 
        return offset;
    };
 
    audio.play = function(n) {
       
        if (audio.source_loop[n]._playing) {
            audio.stop(n);
        } else {
            audio.source_loop[n] = audio.context.createBufferSource();
            audio.source_loop[n].buffer = audio.buffer[n];
            audio.source_loop[n].loop = true;
          
            if(n === 1 || n === 5 || n === 9) {
              audio.source_loop[n].connect(gainNodeDrums);
              gainNodeDrums.connect(audio.context.destination);
            }
          
            if(n === 2 || n === 6 || n === 10) {
              audio.source_loop[n].connect(gainNodeHH);
              gainNodeHH.connect(audio.context.destination);
            }
          
            if(n === 3 || n === 7 || n === 11) {
              audio.source_loop[n].connect(gainNodeBass);
              gainNodeBass.connect(audio.context.destination);
            }
          
            if(n === 4 || n === 8 || n === 12) {
              audio.source_loop[n].connect(gainNodeBass);
              gainNodeBass.connect(audio.context.destination);
            }
          
            
 
            var offset = audio.findSync(n);
            audio.source_loop[n]._startTime = audio.context.currentTime;
 
            if (audio.compatibility.start === 'noteOn') {
                /*
                The depreciated noteOn() function does not support offsets.
                Compensate by using noteGrainOn() with an offset to play once and then schedule a noteOn() call to loop after that.
                */
                audio.source_once[n] = audio.context.createBufferSource();
                audio.source_once[n].buffer = audio.buffer[n];
              
              
                audio.source_once[n].connect(gainNodeDrums);
                gainNodeDrums.connect(audio.context.destination);
              
                audio.source_once[n].noteGrainOn(0, offset, audio.buffer[n].duration - offset ); // currentTime, offset, duration
                
                /*
                Note about the third parameter of noteGrainOn().
                If your sound is 10 seconds long, your offset 5 and duration 5 then you'll get what you expect.
                If your sound is 10 seconds long, your offset 5 and duration 10 then the sound will play from the start instead of the offset.
                */
 
                // Now queue up our looping sound to start immediatly after the source_once audio plays.
                audio.source_loop[n][audio.compatibility.start](audio.context.currentTime + (audio.buffer[n].duration - offset));
            } else {
                audio.source_loop[n][audio.compatibility.start](0, offset);
            }
 
            audio.source_loop[n]._playing = true;
        }
    };
 
    audio.stop = function(n) {
        if (audio.source_loop[n]._playing) {
            audio.source_loop[n][audio.compatibility.stop](0);
            audio.source_loop[n]._playing = false;
            audio.source_loop[n]._startTime = 0;
            if (audio.compatibility.start === 'noteOn') {
                audio.source_once[n][audio.compatibility.stop](0);
            }
        }
    };
 
    //-----------------------------
    // Check Web Audio API Support
    //-----------------------------
    try {
        // More info at http://caniuse.com/#feat=audio-api
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audio.context = new window.AudioContext();
      
        
      
    } catch(e) {
        audio.proceed = false;
        alert('Web Audio API not supported in this browser.');
    }
 
    if (audio.proceed) {
      
      gainNodeDrums = audio.context.createGain();
        gainNodeHH = audio.context.createGain();
        gainNodeBass = audio.context.createGain();
        gainNodeKeys = audio.context.createGain();
        //---------------
        // Compatibility
        //---------------
        (function() {
            var start = 'start',
                stop = 'stop',
                buffer = audio.context.createBufferSource();
 
            if (typeof buffer.start !== 'function') {
                start = 'noteOn';
            }
            audio.compatibility.start = start;
 
            if (typeof buffer.stop !== 'function') {
                stop = 'noteOff';
            }
            audio.compatibility.stop = stop;
        })();
 
        //-------------------------------
        // Setup Audio Files and Buttons
        //-------------------------------
        for (var a in audio.files) {
            (function() {
                var i = parseInt(a) + 1;
                
                var req = new XMLHttpRequest();
                req.open('GET', audio.files[i - 1], true); // array starts with 0 hence the -1
                req.responseType = 'arraybuffer';
                req.onload = function() {
                    audio.context.decodeAudioData(
                        req.response,
                        function(buffer) {
                            audio.buffer[i] = buffer;
                            audio.source_loop[i] = {};
                            var button = document.getElementById('button-loop-' + i);
                          
                            var op1 = i + 4;
                            if (op1 > 12) {
                              op1 -= 12;
                            }
                            var op2 = i + 8;
                            if (op2 > 12) {
                              op2 -= 12;
                            }
                          
                            button.addEventListener('click', function(e) {
                                e.preventDefault();
                                audio.play(this.value);  
                                audio.stop(op1);
                                audio.stop(op2);
                                playingAllLoop1 = false;
                                playingAllLoop2 = false;
                                playingAllLoop3 = false;
                            });
                        },
                        function() {
                            console.log('Error decoding audio "' + audio.files[i - 1] + '".');
                        }
                    );
                };
                req.send();
            })();
        }
    }




document.getElementById('stop-all').addEventListener('click', function(e) {
  e.preventDefault();
  for(var n = 0; n < audio.files.length; n++) {
    audio.stop(n + 1);
  }
});

document.getElementById('play-loop-1').addEventListener('click', function(e) {
  e.preventDefault();
  for(var n = 0; n < audio.files.length; n++) {
    if (n < 4) {
      if (playingAllLoop1 === true){
        audio.stop(n + 1);
      } else {
        audio.stop(n + 1);
        audio.play(n + 1);
      }
    } else {
      audio.stop(n + 1); 
    }
  }
  playingAllLoop1 = !playingAllLoop1;
  playingAllLoop2 = false;
  playingAllLoop3 = false;
});

document.getElementById('play-loop-2').addEventListener('click', function(e) {
  e.preventDefault();
  for(var n = 0; n < audio.files.length; n++) {
    if (n < 4) {
      audio.stop(n + 1);
    } 
    if (n >= 4 && n <= 7) {
      if (playingAllLoop2 === true){
        audio.stop(n + 1);
      } else {
        audio.stop(n + 1);
        audio.play(n + 1);
      }
    } 
    if (n > 7){
      audio.stop(n + 1);
    }
  }
  
  playingAllLoop2 = !playingAllLoop2;
  playingAllLoop1 = false;
  playingAllLoop3 = false;
});

document.getElementById('play-loop-3').addEventListener('click', function(e) {
  e.preventDefault();
  gainNodeDrums.gain.value = 0;
  
  for(var n = 0; n < audio.files.length; n++) {
    if (n < 8) {
      audio.stop(n + 1);
    } 
    if (n > 7) {
      if (playingAllLoop3 === true){
        audio.stop(n + 1);
      } else {
        audio.stop(n + 1);
        audio.play(n + 1);
      }
    }
  }
 
  playingAllLoop3 = !playingAllLoop3;
  playingAllLoop1 = false;
  playingAllLoop2 = false;
});


/* part2.js      (update name changes in gulpfile)
==================================== */


},{}]},{},[1])