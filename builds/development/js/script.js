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
          'audio/kick-snare-loop-2.mp3',
          'audio/kick-snare-loop-3.mp3',
          'audio/hihat-loop-1.mp3',
          'audio/hihat-loop-2.mp3',
          'audio/hihat-loop-3.mp3',
          'audio/bass-loop-1.mp3',
          'audio/bass-loop-2.mp3',
          'audio/bass-loop-3.mp3',
          'audio/keys-loop-1.mp3',
          'audio/keys-loop-2.mp3',
          'audio/keys-loop-3.mp3'
        ],
  proceed: true,
  source_loop: {},
  source_once: {}
};

var audioPlaying = false;

var playingAllLoop1 = false,
  playingAllLoop2 = false,
  playingAllLoop3 = false;

var gainNodeDrums,
  gainNodeHH,
  gainNodeBass,
  gainNodeKeys,
  panNodeDrums,
  panNodeHH,
  panNodeBass,
  panNodeKeys,
  filterLPDrums,
  filterHPDrums,
  filterLPHH,
  filterHPHH,
  filterLPBass,
  filterHPBass,
  filterLPKeys,
  filterHPKeys;


//-----------------
// Audio Functions
//-----------------
audio.findSync = function (n) {
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

audio.play = function (n) {

  if (audio.source_loop[n]._playing) {
    audio.stop(n);
  } else {
    audio.source_loop[n] = audio.context.createBufferSource();
    audio.source_loop[n].buffer = audio.buffer[n];
    audio.source_loop[n].loop = true;

    if (n === 1 || n === 2 || n === 3) {
      audio.source_loop[n].connect(filterLPDrums);
      filterLPDrums.connect(filterHPDrums);
      filterHPDrums.connect(gainNodeDrums);
      gainNodeDrums.connect(panNodeDrums);
      panNodeDrums.connect(audio.context.destination);
      gainNodeDrums.gain.value = document.getElementById('drum-volume').value / 100;
      filterLPDrums.frequency.value = logslider(parseInt(document.getElementById('drum-lo-pass').value));
      filterHPDrums.frequency.value = logslider(parseInt(document.getElementById('drum-hi-pass').value));
      panNodeDrums.pan.value = parseInt(document.getElementById('drum-pan').value) / 100;
    }

    if (n === 4 || n === 5 || n === 6) {
      audio.source_loop[n].connect(filterLPHH);
      filterLPHH.connect(filterHPHH);
      filterHPHH.connect(gainNodeHH);
      gainNodeHH.connect(panNodeHH);
      panNodeHH.connect(audio.context.destination);
      gainNodeHH.gain.value = document.getElementById('hh-volume').value / 100;
      filterLPHH.frequency.value = logslider(parseInt(document.getElementById('hh-lo-pass').value));
      filterHPHH.frequency.value = logslider(parseInt(document.getElementById('hh-hi-pass').value));
      panNodeHH.pan.value = parseInt(document.getElementById('hh-pan').value) / 100;
    }

    if (n === 7 || n === 8 || n === 9) {
      audio.source_loop[n].connect(filterLPBass);
      filterLPBass.connect(filterHPBass);
      filterHPBass.connect(gainNodeBass);
      gainNodeBass.connect(panNodeBass);
      panNodeBass.connect(audio.context.destination);
      gainNodeBass.gain.value = document.getElementById('bass-volume').value / 100;
      filterLPBass.frequency.value = logslider(parseInt(document.getElementById('bass-lo-pass').value));
      filterHPBass.frequency.value = logslider(parseInt(document.getElementById('bass-hi-pass').value));
      panNodeBass.pan.value = parseInt(document.getElementById('bass-pan').value) / 100;
    }

    if (n === 10 || n === 11 || n === 12) {
      audio.source_loop[n].connect(filterLPKeys);
      filterLPKeys.connect(filterHPKeys);
      filterHPKeys.connect(gainNodeKeys);
      gainNodeKeys.connect(panNodeKeys);
      panNodeKeys.connect(audio.context.destination);
      gainNodeKeys.gain.value = document.getElementById('keys-volume').value / 100;
      filterLPKeys.frequency.value = logslider(parseInt(document.getElementById('keys-lo-pass').value));
      filterHPKeys.frequency.value = logslider(parseInt(document.getElementById('keys-hi-pass').value));
      panNodeKeys.pan.value = parseInt(document.getElementById('keys-pan').value) / 100;
    }

    //     audio.source_loop[n].connect(audio.context.destination);

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

      audio.source_once[n].noteGrainOn(0, offset, audio.buffer[n].duration - offset); // currentTime, offset, duration

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
  highlightLoops();
};

audio.stop = function (n) {
  if (audio.source_loop[n]._playing) {
    audio.source_loop[n][audio.compatibility.stop](0);
    audio.source_loop[n]._playing = false;
    audio.source_loop[n]._startTime = 0;
    if (audio.compatibility.start === 'noteOn') {
      audio.source_once[n][audio.compatibility.stop](0);
    }
  }
  highlightLoops();
};

//-----------------------------
// Check Web Audio API Support
//-----------------------------
try {
  // More info at http://caniuse.com/#feat=audio-api
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  audio.context = new window.AudioContext();



} catch (e) {
  audio.proceed = false;
  alert('Web Audio API not supported in this browser.');
}

if (audio.proceed) {

  gainNodeDrums = audio.context.createGain();
  gainNodeHH = audio.context.createGain();
  gainNodeBass = audio.context.createGain();
  gainNodeKeys = audio.context.createGain();

  panNodeDrums = audio.context.createStereoPanner();
  panNodeHH = audio.context.createStereoPanner();
  panNodeBass = audio.context.createStereoPanner();
  panNodeKeys = audio.context.createStereoPanner();


  filterLPDrums = audio.context.createBiquadFilter();
  filterLPDrums.type = 'lowpass';
  filterHPDrums = audio.context.createBiquadFilter();
  filterHPDrums.type = 'highpass';

  filterLPHH = audio.context.createBiquadFilter();
  filterLPHH.type = 'lowpass';
  filterHPHH = audio.context.createBiquadFilter();
  filterHPHH.type = 'highpass';

  filterLPBass = audio.context.createBiquadFilter();
  filterLPBass.type = 'lowpass';
  filterHPBass = audio.context.createBiquadFilter();
  filterHPBass.type = 'highpass';

  filterLPKeys = audio.context.createBiquadFilter();
  filterLPKeys.type = 'lowpass';
  filterHPKeys = audio.context.createBiquadFilter();
  filterHPKeys.type = 'highpass';

  //---------------
  // Compatibility
  //---------------
  (function () {
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
    (function () {
      var i = parseInt(a) + 1;

      var req = new XMLHttpRequest();
      req.open('GET', audio.files[i - 1], true); // array starts with 0 hence the -1
      req.responseType = 'arraybuffer';
      req.onload = function () {
        audio.context.decodeAudioData(
          req.response,
          function (buffer) {
            audio.buffer[i] = buffer;
            audio.source_loop[i] = {};
            var button = document.getElementById('button-loop-' + i);

            if (i == 1 || i == 4 || i == 7 || i == 10) {
              var op1 = i + 1;
              var op2 = i + 2;
            } else if (i == 2 || i == 5 || i == 8 || i == 11) {
              var op1 = i - 1;
              var op2 = i + 1;
            } else if (i == 3 || i == 6 || i == 9 || i == 12) {
              var op1 = i - 1;
              var op2 = i - 2;
            }


            button.addEventListener('click', function (e) {
              e.preventDefault();
              audio.play(parseInt(this.value));
              audio.stop(op1);
              audio.stop(op2);
              playingAllLoop1 = false;
              playingAllLoop2 = false;
              playingAllLoop3 = false;
            });
          },
          function () {
            console.log('Error decoding audio "' + audio.files[i - 1] + '".');
          }
        );
      };
      req.send();
    })();
  }
}


function highlightLoops() {
  var loop1 = 0,
      loop2 = 0,
      loop3 = 0,
      playing = 0;
    

  for (var x = 1; x < audio.files.length + 1; x++) {

    var tester = false;
    
    if (typeof audio.source_loop[x] != 'undefined') {
      if (audio.source_loop[x]._playing){
        tester = true;
        playing++;
        
        if (x == 1 || x == 4 || x == 7 || x == 10) {
          loop1++;
        }
        if (x == 2 || x == 5 || x == 8 || x == 11) {
          loop2++;
        }
        if (x == 3 || x == 6 || x == 9 || x == 12) {
          loop3++;
        }
      } 
    } 
    
    if (tester ) {
      document.getElementById("button-loop-" + x).classList.remove("loop-btn-stopped");
      document.getElementById("button-loop-" + x).classList.remove("loop-btn-playing");
      document.getElementById("button-loop-" + x).className += " loop-btn-playing";
      
    } else {
      
      document.getElementById("button-loop-" + x).classList.remove("loop-btn-playing");
      document.getElementById("button-loop-" + x).classList.remove("loop-btn-stopped");
      document.getElementById("button-loop-" + x).className += " loop-btn-stopped";
    }
    
  }
  
  if (loop1 == 4) {
    document.getElementById('play-loop-1').classList.remove("loop-btn-playing");
    document.getElementById('play-loop-1').classList.remove("loop-btn-stopped");
    document.getElementById('play-loop-1').className += " loop-btn-playing";
    playingAllLoop1 = true;
    playingAllLoop2 = false;
    playingAllLoop3 = false;
  } else {
    document.getElementById('play-loop-1').classList.remove("loop-btn-playing");
    document.getElementById('play-loop-1').classList.remove("loop-btn-stopped");
    document.getElementById('play-loop-1').className += " loop-btn-stopped";
  }
  
  if (loop2 == 4) {
    document.getElementById('play-loop-2').classList.remove("loop-btn-playing");
    document.getElementById('play-loop-2').classList.remove("loop-btn-stopped");
    document.getElementById('play-loop-2').className += " loop-btn-playing";
    playingAllLoop1 = false;
    playingAllLoop2 = true;
    playingAllLoop3 = false;
  } else {
    document.getElementById('play-loop-2').classList.remove("loop-btn-playing");
    document.getElementById('play-loop-2').classList.remove("loop-btn-stopped");
    document.getElementById('play-loop-2').className += " loop-btn-stopped";
  }
  
  if (loop3 == 4) {
    document.getElementById('play-loop-3').classList.remove("loop-btn-playing");
    document.getElementById('play-loop-3').classList.remove("loop-btn-stopped");
    document.getElementById('play-loop-3').className += " loop-btn-playing";
    playingAllLoop1 = false;
    playingAllLoop2 = false;
    playingAllLoop3 = true;
  } else {
    document.getElementById('play-loop-3').classList.remove("loop-btn-playing");
    document.getElementById('play-loop-3').classList.remove("loop-btn-stopped");
    document.getElementById('play-loop-3').className += " loop-btn-stopped";
  }
  
  if (playing == 0) {
    audioPlaying = false;
    
    document.getElementById('main-play-pause').classList.remove("pause-btn");
    document.getElementById('main-play-pause').classList.remove("play-btn");
    document.getElementById('main-play-pause').className += " play-btn";
    
  } else {
    document.getElementById('main-play-pause').classList.remove("pause-btn");
    document.getElementById('main-play-pause').classList.remove("play-btn");
    document.getElementById('main-play-pause').className += " pause-btn";
    
  }



}


document.getElementById('stop-all').addEventListener('click', function (e) {
  e.preventDefault();
  
  if (!audioPlaying) {
    audio.play(3);
    audio.play(6);
    audio.play(9);
    audio.play(12);
    
    audioPlaying = true;
    document.getElementById('main-play-pause').classList.remove("pause-btn");
    document.getElementById('main-play-pause').classList.remove("play-btn");
    document.getElementById('main-play-pause').className += " pause-btn";
  } else {
    for (var n = 0; n < audio.files.length; n++) {
      audio.stop(n + 1);
    }
    document.getElementById('main-play-pause').classList.remove("pause-btn");
    document.getElementById('main-play-pause').classList.remove("play-btn");
    document.getElementById('main-play-pause').className += " play-btn";
  }
});

document.getElementById('play-loop-1').addEventListener('click', function (e) {
  e.preventDefault();
  for (var n = 0; n < audio.files.length; n++) {
    if (n == 0 || n == 3 || n == 6 || n == 9) {
      if (playingAllLoop1 === true) {
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

document.getElementById('play-loop-2').addEventListener('click', function (e) {
  e.preventDefault();


  for (var n = 0; n < audio.files.length; n++) {

    if (n == 1 || n == 4 || n == 7 || n == 10) {
      if (playingAllLoop2 === true) {
        audio.stop(n + 1);
      } else {
        audio.stop(n + 1);
        audio.play(n + 1);
      }
    } else {
      audio.stop(n + 1);
    }
  }

  playingAllLoop2 = !playingAllLoop2;
  playingAllLoop1 = false;
  playingAllLoop3 = false;
});

document.getElementById('play-loop-3').addEventListener('click', function (e) {
  e.preventDefault();


  for (var n = 0; n < audio.files.length; n++) {
   
    if (n == 2 || n == 5 || n == 8 || n == 11) {
      if (playingAllLoop3 === true) {
        audio.stop(n + 1);

      } else {
        audio.stop(n + 1);
        audio.play(n + 1);
      }
    } else {
      audio.stop(n + 1);
    }
  }

  playingAllLoop3 = !playingAllLoop3;
  playingAllLoop1 = false;
  playingAllLoop2 = false;
});

//-----------------  
//  Volumes
//-----------------

document.getElementById('drum-volume').addEventListener("input", function () {
  var curve = (parseInt(this.value) / 100) / (parseInt(this.max) / 100);
  gainNodeDrums.gain.value = curve * curve;
});

document.getElementById('hh-volume').addEventListener("input", function () {
  var curve = (parseInt(this.value) / 100) / (parseInt(this.max) / 100);
  gainNodeHH.gain.value = curve * curve;
});

document.getElementById('bass-volume').addEventListener("input", function () {
  var curve = (parseInt(this.value) / 100) / (parseInt(this.max) / 100);
  gainNodeBass.gain.value = curve * curve;
});

document.getElementById('keys-volume').addEventListener("input", function () {
  var curve = (parseInt(this.value) / 100) / (parseInt(this.max) / 100);
  gainNodeKeys.gain.value = curve * curve;
});

//-----------------  
//  Pans
//-----------------

document.getElementById('drum-pan').addEventListener("input", function () {
  panNodeDrums.pan.value = parseInt(this.value) / 100;
});

document.getElementById('hh-pan').addEventListener("input", function () {
  panNodeHH.pan.value = parseInt(this.value) / 100;
});

document.getElementById('bass-pan').addEventListener("input", function () {
  panNodeBass.pan.value = parseInt(this.value) / 100;
});

document.getElementById('keys-pan').addEventListener("input", function () {
  panNodeKeys.pan.value = parseInt(this.value) / 100;
});

//-----------------  
//  Filters
//-----------------

function logslider(position) {
  // position will be between 0 and 100
  var minp = 20;
  var maxp = 20000;

  // The result should be between 100 an 10000000
  var minv = Math.log(20);
  var maxv = Math.log(20000);

  // calculate adjustment factor
  var scale = (maxv - minv) / (maxp - minp);

  return Math.exp(minv + scale * (position - minp));
}

document.getElementById('drum-lo-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterLPDrums.frequency.value = curve;
});

document.getElementById('drum-hi-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterHPDrums.frequency.value = curve;
});

document.getElementById('hh-lo-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterLPHH.frequency.value = curve;
});

document.getElementById('hh-hi-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterHPHH.frequency.value = curve;
});

document.getElementById('bass-lo-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterLPBass.frequency.value = curve;
});

document.getElementById('bass-hi-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterHPBass.frequency.value = curve;
});

document.getElementById('keys-lo-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterLPKeys.frequency.value = curve;
});

document.getElementById('keys-hi-pass').addEventListener("input", function () {
  var curve = logslider(parseInt(this.value));
  filterHPKeys.frequency.value = curve;
});

/* part2.js      (update name changes in gulpfile)
==================================== */


},{}]},{},[1])