(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

var audioPlaying = false,
  appRunning = false,
  stereoSound = false,
  mobileLoaded = false;

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
  filterHPKeys,
  analyserNode,
  freqBufferLength,
  frequencyData;


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

//-----------------
// Play Audio
//-----------------

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
      gainNodeDrums.connect(analyser);

      if (stereoSound) {
        gainNodeDrums.connect(panNodeDrums);
        panNodeDrums.connect(audio.context.destination);
        panNodeDrums.pan.value = parseInt(document.getElementById('drum-pan').value) / 100;
      } else {
        gainNodeDrums.connect(audio.context.destination);
      }

      gainNodeDrums.gain.value = document.getElementById('drum-volume').value / 100;
      filterLPDrums.frequency.value = parseInt(document.getElementById('drum-lo-pass').value);
      filterHPDrums.frequency.value = parseInt(document.getElementById('drum-hi-pass').value);
    }

    if (n === 4 || n === 5 || n === 6) {
      audio.source_loop[n].connect(filterLPHH);
      filterLPHH.connect(filterHPHH);
      filterHPHH.connect(gainNodeHH);
      gainNodeHH.connect(analyser);

      if (stereoSound) {
        gainNodeHH.connect(panNodeHH);
        panNodeHH.connect(audio.context.destination);
        panNodeHH.pan.value = parseInt(document.getElementById('hh-pan').value) / 100;
      } else {
        gainNodeHH.connect(audio.context.destination);
      }

      gainNodeHH.gain.value = document.getElementById('hh-volume').value / 100;
      filterLPHH.frequency.value = parseInt(document.getElementById('hh-lo-pass').value);
      filterHPHH.frequency.value = parseInt(document.getElementById('hh-hi-pass').value);
    }

    if (n === 7 || n === 8 || n === 9) {
      audio.source_loop[n].connect(filterLPBass);
      filterLPBass.connect(filterHPBass);
      filterHPBass.connect(gainNodeBass);
      gainNodeBass.connect(analyser);

      if (stereoSound) {
        gainNodeBass.connect(panNodeBass);
        panNodeBass.connect(audio.context.destination);
        panNodeBass.pan.value = parseInt(document.getElementById('bass-pan').value) / 100;
      } else {
        gainNodeBass.connect(audio.context.destination);
      }

      gainNodeBass.gain.value = document.getElementById('bass-volume').value / 100;
      filterLPBass.frequency.value = parseInt(document.getElementById('bass-lo-pass').value);
      filterHPBass.frequency.value = parseInt(document.getElementById('bass-hi-pass').value);
    }

    if (n === 10 || n === 11 || n === 12) {
      audio.source_loop[n].connect(filterLPKeys);
      filterLPKeys.connect(filterHPKeys);
      filterHPKeys.connect(gainNodeKeys);
      gainNodeKeys.connect(analyser);

      if (stereoSound) {
        gainNodeKeys.connect(panNodeKeys);
        panNodeKeys.connect(audio.context.destination);
        panNodeKeys.pan.value = parseInt(document.getElementById('keys-pan').value) / 100;
      } else {
        gainNodeKeys.connect(audio.context.destination);
      }
      gainNodeKeys.gain.value = document.getElementById('keys-volume').value / 100;
      filterLPKeys.frequency.value = parseInt(document.getElementById('keys-lo-pass').value);
      filterHPKeys.frequency.value = parseInt(document.getElementById('keys-hi-pass').value);
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

      if (n === 1 || n === 2 || n === 3) {
        audio.source_once[n].connect(filterLPDrums);
        filterLPDrums.connect(filterHPDrums);
        filterHPDrums.connect(gainNodeDrums);
        gainNodeDrums.connect(panNodeDrums);
        panNodeDrums.connect(analyser);
        panNodeDrums.connect(audio.context.destination);
        gainNodeDrums.gain.value = document.getElementById('drum-volume').value / 100;
        filterLPDrums.frequency.value = parseInt(document.getElementById('drum-lo-pass').value);
        filterHPDrums.frequency.value = parseInt(document.getElementById('drum-hi-pass').value);
        panNodeDrums.pan.value = parseInt(document.getElementById('drum-pan').value) / 100;
      }

      if (n === 4 || n === 5 || n === 6) {
        audio.source_once[n].connect(filterLPHH);
        filterLPHH.connect(filterHPHH);
        filterHPHH.connect(gainNodeHH);
        gainNodeHH.connect(panNodeHH);
        gainNodeHH.connect(analyser);
        panNodeHH.connect(audio.context.destination);
        gainNodeHH.gain.value = document.getElementById('hh-volume').value / 100;
        filterLPHH.frequency.value = parseInt(document.getElementById('hh-lo-pass').value);
        filterHPHH.frequency.value = parseInt(document.getElementById('hh-hi-pass').value);
        panNodeHH.pan.value = parseInt(document.getElementById('hh-pan').value) / 100;
      }

      if (n === 7 || n === 8 || n === 9) {
        audio.source_once[n].connect(filterLPBass);
        filterLPBass.connect(filterHPBass);
        filterHPBass.connect(gainNodeBass);
        gainNodeBass.connect(panNodeBass);
        gainNodeBass.connect(analyser);
        panNodeBass.connect(audio.context.destination);
        gainNodeBass.gain.value = document.getElementById('bass-volume').value / 100;
        filterLPBass.frequency.value = parseInt(document.getElementById('bass-lo-pass').value);
        filterHPBass.frequency.value = parseInt(document.getElementById('bass-hi-pass').value);
        panNodeBass.pan.value = parseInt(document.getElementById('bass-pan').value) / 100;
      }

      if (n === 10 || n === 11 || n === 12) {
        audio.source_once[n].connect(filterLPKeys);
        filterLPKeys.connect(filterHPKeys);
        filterHPKeys.connect(gainNodeKeys);
        gainNodeKeys.connect(panNodeKeys);
        gainNodeKeys.connect(analyser);
        panNodeKeys.connect(audio.context.destination);
        gainNodeKeys.gain.value = document.getElementById('keys-volume').value / 100;
        filterLPKeys.frequency.value = parseInt(document.getElementById('keys-lo-pass').value);
        filterHPKeys.frequency.value = parseInt(document.getElementById('keys-hi-pass').value);
        panNodeKeys.pan.value = parseInt(document.getElementById('keys-pan').value) / 100;
      }
      
      audio.source_once[n].noteGrainOn(0, offset, audio.buffer[n].duration - offset); // currentTime, offset, duration

      /*
      Note about the third parameter of noteGrainOn().
      If your sound is 10 seconds long, your offset 5 and duration 5 then you'll get what you expect.
      If your sound is 10 seconds long, your offset 5 and duration 10 then the sound will play from the start instead of the offset.
      */

      // Now queue up our looping sound to start immediatly after the source_once audio plays.
      audio.source_loop[n][audio.compatibility.start](audio.context.currentTime + (audio.buffer[n].duration - offset));
    } else {
      try{
         audio.source_loop[n][audio.compatibility.start](0, offset);
      } catch(e){
        var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
                 navigator.userAgent && !navigator.userAgent.match('CriOS');
        if(isSafari){
          window.location.reload(false);
        }
      }
    }
    
    audio.source_loop[n]._playing = true;
    
  }
};

//-----------------
// Stop Audio
//-----------------

audio.stop = function (n) {

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

function appStart() {
  try {
    // More info at http://caniuse.com/#feat=audio-api
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audio.context = new window.AudioContext();
  } catch (e) {
    audio.proceed = false;
    buildNoAudioScreen();
  }

  if (audio.proceed) {

    gainNodeDrums = audio.context.createGain();
    gainNodeHH = audio.context.createGain();
    gainNodeBass = audio.context.createGain();
    gainNodeKeys = audio.context.createGain();

    if (typeof audio.context.createStereoPanner === "function") {
      stereoSound = true;
      panNodeDrums = audio.context.createStereoPanner();
      panNodeHH = audio.context.createStereoPanner();
      panNodeBass = audio.context.createStereoPanner();
      panNodeKeys = audio.context.createStereoPanner();
    }

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

    analyser = audio.context.createAnalyser();
    freqBufferLength = analyser.frequencyBinCount;
    frequencyData = new Uint8Array(freqBufferLength);

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
        var loaderImg;
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
                    highlightLoops();
                  });
                  appRunning = true;
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
}

// Start app if not mobile

if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  appStart();
}

function buildNoAudioScreen() {
  
  var htmlContent = '<div id="card-container" class="audio-error"> <div id="dot-dot-dot">.</div><div id="cloud1"> </div><div id="cloud2"> </div><ul id="water"> <li></li><li></li><li></li><li></li><li></li><li></li><div id="boat"> <div id="sail-left"></div><div id="sail-right"></div></div><li></li><li></li><li></li></ul> <ul id="rain"> <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul></div>';
  
  document.getElementById('mixer').innerHTML = htmlContent;
}

//-----------------------------
// Highlights currently playing loop
//-----------------------------

function highlightLoops() {
  var loop1 = 0,
    loop2 = 0,
    loop3 = 0,
    playing = 0;

  for (var x = 1; x < audio.files.length + 1; x++) {

    var tester = false;

    if (typeof audio.source_loop[x] != 'undefined') {
      if (audio.source_loop[x]._playing) {
        tester = true;

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

    if (tester) {
      playing++;
      document.getElementById("button-loop-" + x).classList.remove("loop-btn-stopped");
      document.getElementById("button-loop-" + x).classList.add("loop-btn-playing");

    } else {
      document.getElementById("button-loop-" + x).classList.remove("loop-btn-playing");
      document.getElementById("button-loop-" + x).classList.add("loop-btn-stopped");
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

    document.getElementById('mixer').classList.remove("mixer-off");
    document.getElementById('mixer').className += " mixer-off";

    document.querySelector('canvas').style.opacity = "0";
  } else {
    document.getElementById('main-play-pause').classList.remove("pause-btn");
    document.getElementById('main-play-pause').classList.remove("play-btn");
    document.getElementById('main-play-pause').className += " pause-btn";

    document.getElementById('mixer').classList.remove("mixer-off");
    audioPlaying = true;

    document.querySelector('canvas').style.opacity = "1";
  }
}

//-----------------------------
// Main Buttons
//-----------------------------

document.getElementById('stop-all').addEventListener('click', function (e) {
  e.preventDefault();
  var loaderImg;
  var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
               navigator.userAgent && !navigator.userAgent.match('CriOS');
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  if (!appRunning) {
    appStart();
  }

  if (!mobileLoaded) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isSafari) {
      var loaderImg = document.createElement("div");
      loaderImg.innerHTML = '<div id="card-container" class="sail-loading"> <div id="dot-dot-dot">.</div><div id="cloud1"> </div><div id="cloud2"> </div><ul id="water"> <li></li><li></li><li></li><li></li><li></li><li></li><div id="boat"> <div id="sail-left"></div><div id="sail-right"></div></div><li></li><li></li><li></li></ul> <ul id="rain"> <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul></div>';
      loaderImg.className = "loader"
      document.querySelector(".landing-play-btn-container").appendChild(loaderImg);

      setTimeout(function () {
        document.querySelector(".landing-play-btn-container").removeChild(document.querySelector(".loader"));
        mobileLoaded = true;

        audio.play(3);
        audio.play(6);
        audio.play(9);
        audio.play(12);

        audioPlaying = true;
        highlightLoops();

      }, 14000);

    } else {
      var loaderImg = document.createElement("div");
      loaderImg.innerHTML = '<div id="card-container" class="sail-loading"> <div id="cloud1"> </div><div id="cloud2"> </div><ul id="water"> <li></li><li></li><li></li><li></li><li></li><li></li><div id="boat"> <div id="sail-left"></div><div id="sail-right"></div></div><li></li><li></li><li></li></ul> <ul id="rain"> <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul></div>';
      loaderImg.className = "loader"
      document.querySelector(".landing-play-btn-container").appendChild(loaderImg);

      setTimeout(function () {
        document.querySelector(".landing-play-btn-container").removeChild(document.querySelector(".loader"));
        mobileLoaded = true;

        audio.play(3);
        audio.play(6);
        audio.play(9);
        audio.play(12);

        audioPlaying = true;
        highlightLoops();
      }, 1000);
    }
    return false;
  }

  if (document.getElementById('stop-all').classList.contains("pause-btn")) {
    audioPlaying = true;
  }

  if (!audioPlaying) {

    for (var n = 0; n < audio.files.length; n++) {
      audio.stop(n + 1);
    }
    audio.play(3);
    audio.play(6);
    audio.play(9);
    audio.play(12);

    audioPlaying = true;

    if (!document.getElementById('main-play-pause').classList.contains("pause-btn")) {
      document.getElementById('main-play-pause').classList.add("pause-btn")
    }
    if (document.getElementById('main-play-pause').classList.contains("play-btn")) {
      document.getElementById('main-play-pause').classList.remove("play-btn");
    }

    document.querySelector('canvas').style.opacity = "1";

  } else {
    for (var n = 0; n < audio.files.length; n++) {
      audio.stop(n + 1);
    }

    if (document.getElementById('main-play-pause').classList.contains("pause-btn")) {
      document.getElementById('main-play-pause').classList.remove("pause-btn")
    }
    if (!document.getElementById('main-play-pause').classList.contains("play-btn")) {
      document.getElementById('main-play-pause').classList.add("play-btn");
    }

    audioPlaying = false;
    document.querySelector('canvas').style.opacity = "0";
  }

  highlightLoops();
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

  highlightLoops();
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

  highlightLoops();
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

  highlightLoops();
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

if (stereoSound) {

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
}

//-----------------  
//  Filters
//-----------------

document.getElementById('drum-lo-pass').addEventListener("input", function () {
  filterLPDrums.frequency.value = parseInt(this.value);
});

document.getElementById('drum-hi-pass').addEventListener("input", function () {
  filterHPDrums.frequency.value = parseInt(this.value);
});

document.getElementById('hh-lo-pass').addEventListener("input", function () {
  filterLPHH.frequency.value = parseInt(this.value);
});

document.getElementById('hh-hi-pass').addEventListener("input", function () {
  filterHPHH.frequency.value = parseInt(this.value);
});

document.getElementById('bass-lo-pass').addEventListener("input", function () {
  filterLPBass.frequency.value = parseInt(this.value);
});

document.getElementById('bass-hi-pass').addEventListener("input", function () {
  filterHPBass.frequency.value = parseInt(this.value);
});

document.getElementById('keys-lo-pass').addEventListener("input", function () {
  filterLPKeys.frequency.value = parseInt(this.value);
});

document.getElementById('keys-hi-pass').addEventListener("input", function () {
  filterHPKeys.frequency.value = parseInt(this.value);
});

//===================
//  show hints
//===================

function showHint(el, text) {
  el.addEventListener("mouseover", function (e) {

    var hint = document.createElement("p");
    hint.classList.add("help-hint");
    hint.style.left = e.pageX - (hint.offsetWidth / 2) + "px";
    hint.style.top = e.pageY + 25 + "px";
    hint.innerHTML += text;
    document.querySelector("body").appendChild(hint);

    this.addEventListener("mousemove", function (f) {
      document.querySelector(".help-hint").style.left = f.pageX - (document.querySelector(".help-hint").offsetWidth / 2) + "px";
      document.querySelector(".help-hint").style.top = f.pageY + 25 + "px";
    });

    this.parentNode.parentNode.addEventListener("mouseout", function handler() {
      document.querySelector("body").removeChild(hint);
      this.removeEventListener("mouseout", handler);
    });
  });
}

var lpfSections = document.querySelectorAll(".lpf");

for (i = 0; i < lpfSections.length; ++i) {
  showHint(lpfSections[i], "<b>Low Pass Filter</b><br>Move left to cut high frequencies.");
}

var hpfSections = document.querySelectorAll(".hpf");

for (i = 0; i < hpfSections.length; ++i) {
  showHint(hpfSections[i], "<b>High Pass Filter</b><br>Move right to cut low frequencies.");
}

var panSections = document.querySelectorAll(".pan");

for (i = 0; i < panSections.length; ++i) {
  showHint(panSections[i], "<b>Stereo Panner</b><br>Moves sound left and right within stereo field.");
}

var iconSections = document.querySelectorAll("img");

for (i = 0; i < iconSections.length; ++i) {
  showHint(iconSections[i], iconSections[i].alt);
}

var loopBtnLarges = document.querySelectorAll(".loop-btn-large");

//==================
// Visual
//==================

function Render() {

  var canvas = document.querySelector('canvas');
  var canvasContext = canvas.getContext('2d');

  var WIDTH = canvas.width;
  var HEIGHT = canvas.height;

  function draw() {
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(frequencyData);
    canvasContext.fillStyle = '#7E827A';
    canvasContext.fillRect(0, 0, WIDTH, HEIGHT);
    canvasContext.lineWidth = 1;
    canvasContext.strokeStyle = '#703030';
    canvasContext.beginPath();

    var sliceWidth = WIDTH * .8 / freqBufferLength;
    var x = 0;

    for (var i = 0; i < freqBufferLength; i++) {

      var v = frequencyData[i] / 16;
      var y = v * HEIGHT / 16;

      if (i === 0) {
        canvasContext.moveTo(x, 75);
        x = WIDTH / 9;
      } else {
        canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  }
  draw();
}

if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  Render();
}

/* part2.js      (update name changes in gulpfile)
==================================== */


},{}]},{},[1])