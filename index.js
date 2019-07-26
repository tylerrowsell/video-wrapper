/* Index.js */

media = {};

document.addEventListener("DOMContentLoaded", function(event) {
  var potentialMediaElements = document.querySelectorAll('iframe,video');
  for(var i = 0; i < potentialMediaElements.length; i++){
    potentialMediaElement = potentialMediaElements[i];
    mediaElement = MediaPlayer.for(potentialMediaElement);
    if(mediaElement){
      media[mediaElement.id] = mediaElement;
      wrapMediaPlayer(mediaElement);
      addMediaPlayerControls(mediaElement);
      addMediaControlHandlers(mediaElement);
    }
  }
});

function wrapMediaPlayer(mediaPlayer) {
  var wrapper = document.createElement('div');
  wrapper.setAttribute('data-media-id', mediaPlayer.id);
  wrapper.classList.add('media_player');

  var element = mediaPlayer.element;
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  mediaPlayer.container = wrapper;
};

function addMediaPlayerControls(mediaPlayer) {
  var doc = new DOMParser().parseFromString(defaultControls.join(''), "text/html");
  mediaPlayer.container.appendChild(doc.body.firstChild);
};

var defaultControls = [
  '<div class="controls">',
  '<button type="button" class="play-pause" data-media-player="play" aria-label="Play, {title}">',
    '<span class="icon--pressed" focusable="false"><img src="icon-pause.svg"/></span>',
    '<span class="icon--not-pressed" focusable="false"><img src="icon-play.svg"/></span>',
  '</button>',
  '<div class="seek-wrapper">',
    '<input data-media-player="seek" type="range" min="0" max="100" step="0.01" value="0" autocomplete="off" role="slider" aria-label="Seek" style="--value:0%;">',
  '</div>',
  '<button type="button" class="mute" data-media-player="mute">',
    '<span class="icon--pressed" focusable="false"><img src="icon-mute.svg"/></span>',
    '<span class="icon--not-pressed" focusable="false"><img src="icon-unmute.svg"/></span>',
  '</button>',
  '<div class="volume-wrapper">',
    '<input data-media-player="volume" type="range" min="0" max="1" step="0.05" value="1" autocomplete="off" role="slider" aria-label="Volume" style="--value:100%;">',
  '</div>',
  '</div>']

  function addMediaControlHandlers(mediaPlayer){
    var controls = mediaPlayer.container.getElementsByClassName("controls")[0];

    mediaPlayer.container.addEventListener('mouseover', function(event){
      event.currentTarget.classList.add('controls-visible');
    });

    mediaPlayer.container.addEventListener('mouseout', function(event){
      event.currentTarget.classList.remove('controls-visible');
    });

    mediaPlayer.element.addEventListener('playbackChange', function(){
      if(mediaPlayer.paused){
        controls.getElementsByClassName("play-pause")[0].classList.remove('pressed');
      }else{
        controls.getElementsByClassName("play-pause")[0].classList.add('pressed');
      }
    });

    mediaPlayer.element.addEventListener('muteChange', function(){
      if(mediaPlayer.muted){
        controls.getElementsByClassName("mute")[0].classList.add('pressed');
      }else{
        controls.getElementsByClassName("mute")[0].classList.remove('pressed');
      }
    });

    controls.getElementsByClassName("volume-wrapper")[0].addEventListener('mouseover', function(event){
      handleVolumeHover(event, controls, mediaPlayer)
    });
    controls.getElementsByClassName("volume-wrapper")[0].addEventListener('mouseleave', function(event){
      handleVolumeHover(event, controls, mediaPlayer)
    });
    controls.getElementsByClassName("mute")[0].addEventListener('mouseover', function(event){
      handleVolumeHover(event, controls, mediaPlayer)
    });
    controls.getElementsByClassName("mute")[0].addEventListener('mouseleave', function(event){
      handleVolumeHover(event, controls, mediaPlayer)
    });
    
    controls.querySelectorAll('[data-media-player=play]')[0].addEventListener('click', function(event){
      mediaPlayer.togglePlayback();
    });

    controls.querySelectorAll('[data-media-player=mute]')[0].addEventListener('click', function(event){
      mediaPlayer.toggleMute();
    });

    var seekRange = controls.querySelectorAll('[data-media-player=seek]')[0];
    addSeekHandlers(mediaPlayer, seekRange);

    var volumeRange = controls.querySelectorAll('[data-media-player=volume]')[0];
    addVolumeHandlers(mediaPlayer, volumeRange);
  };

  function handleVolumeHover(event, controls, mediaPlayer){
    if(event.type === 'mouseover'){
      clearInterval(mediaPlayer.timers.volumeVisible);
      controls.getElementsByClassName("volume-wrapper")[0].classList.add('volume-visible');
    }else{
      mediaPlayer.timers.volumeVisible = setInterval(function(){
        controls.getElementsByClassName("volume-wrapper")[0].classList.remove('volume-visible');
      }, 100);
    }
  }

  function addSeekHandlers(mediaPlayer, seekRange){
    mediaPlayer.element.addEventListener('timeUpdate', function(){
      var value = (100.0 / mediaPlayer.duration) * mediaPlayer.currentTime;
      seekRange.value = value
      seekRange.style.setProperty('--value', value + '%');
    });

    seekRange.addEventListener('input', function(event){
      var seekedPercent = event.currentTarget.value / 100.0 
      var currentTime = seekedPercent * mediaPlayer.duration;
      mediaPlayer.currentTime = currentTime;
    });
  };

  function addVolumeHandlers(mediaPlayer, volumeRange){

    mediaPlayer.element.addEventListener('volumeChange', function(){
      var value = mediaPlayer.volume;
      volumeRange.value = value;
      volumeRange.style.setProperty('--value', (value * 100) + '%');
    });

    volumeRange.addEventListener('input', function(event){
      var volumePercent = event.currentTarget.value
      mediaPlayer.volume = volumePercent;
    });
  };

/* MediaPlayer.js */
class MediaPlayer {
  static for(mediaElement){
    var host = hostByMediaElement(mediaElement);
    switch(host){
      case hosts.html5:
        return new Html5Player(mediaElement);
      case hosts.youtube:
        return new YoutubePlayer(mediaElement);
      case hosts.vimeo:
        return new VimeoPlayer(mediaElement);
      default:
        return null;
    }
  }
  constructor(mediaElement) {
    mediaElement.mediaPlayer = this;
    if(mediaElement.id){
      this.id = mediaElement.id;
    }else{
      var generatedId = randomId();
      mediaElement.id = generatedId;
      this.id = generatedId;
    }
    this.element = mediaElement;
    this.host = hostByMediaElement(mediaElement);
    this.paused = true;
    this.currentTime = 0;
    this.duration = 0;
    this.muted = false;
    this.volume = 1;
    this.mutedVolume = 1;
    this.timers = {};
    this.setup();
  }

  get isHTML5() {
    return this.host === hosts.html5;
  }

  get isYouTube() {
    return this.host === hosts.youtube;
  }

  get isVimeo() {
    return this.host === hosts.vimeo;
  }

  setup(){
    this.status = 'loading';
  };

  ready(){
    this.status = 'ready';
  };

  togglePlayback(){
    if(this.paused){
      this.play();
    }else{
      this.pause();
    }
  };

  toggleMute(){
    if(this.muted){
      this.muted = false;
    }else{
      this.muted = true;
    }
  };
};
  
var hosts = {
  html5: 'html5',
  youtube: 'youtube',
  vimeo: 'vimeo'
};

var eventNames ={
  playbackChange: 'playbackChange',
  volumeChange: 'volumeChange',
  muteChange: 'muteChange',
  timeUpdate: 'timeUpdate'
};

var events = {
  playbackChange: new Event(eventNames.playbackChange),
  volumeChange: new Event(eventNames.volumeChange),
  muteChange: new Event(eventNames.muteChange),
  timeUpdate: new Event(eventNames.timeUpdate)
};

function randomId() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
};

function hostByMediaElement(mediaElement){
  if(mediaElement.tagName == 'VIDEO'){
    return hosts.html5;
  }
  if(mediaElement.tagName === 'IFRAME'){
    if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(mediaElement.src)) {
      return hosts.youtube;
    }
    if (/^https?:\/\/player.vimeo.com\/video\/\d{0,9}(?=\b|\/)/.test(mediaElement.src)) {
      return hosts.vimeo;
    }
  }
  return null;
};
  
window.youtubeApiLoaded = false;

/* YoutubePlayer.js */

class YoutubePlayer extends MediaPlayer {
  setup() {
    var mediaPlayer = this;
    window.onYouTubeIframeAPIReady = function () {
      mediaPlayer.ready();
    }
    
    if(!window.youtubeApiLoaded){
      var tag = document.createElement('script');
      tag.id = 'youtube-sdk';
      tag.src = 'https://www.youtube.com/iframe_api';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.youtubeApiLoaded = true;
    }
    super.setup();
  };

  ready(){
    var mediaPlayer = this;
    mediaPlayer.player = new window.YT.Player(mediaPlayer.id, {
      events: {
        onStateChange: function onStateChange(event){
          mediaPlayer.syncState(event.data);
        },
        onReady: function onReady(event) {
          var instance = event.target;
          mediaPlayer.play = function () {
            instance.playVideo();
          };

          mediaPlayer.pause = function () {
            instance.pauseVideo();
          };

          mediaPlayer.duration = instance.getDuration();

          Object.defineProperty(mediaPlayer, 'currentTime', {
            get() {
              return Number(instance.getCurrentTime());
            },
            set(time) {
              instance.seekTo(time);
            }
          });

          var volume = mediaPlayer.volume;
          Object.defineProperty(mediaPlayer, 'volume', {
            get() {
              return volume;
            },
            set(input) {
              volume = input;
              instance.setVolume(volume * 100);
              if(volume > 0){
                mediaPlayer.mutedVolume = volume;
                mediaPlayer.muted = false;
              }else{
                mediaPlayer.muted = true;
              }
              mediaPlayer.element.dispatchEvent(events.volumeChange);
            }
          });

          var muted = mediaPlayer.muted;
          Object.defineProperty(mediaPlayer, 'muted', {
            get() {
              return muted;
            },
            set(input) {
              var toggle = Utils.isBoolean(input) ? input : muted;
              if(muted === toggle){
                return;
              }
              muted = toggle;
              instance[muted ? 'mute' : 'unMute']();
              mediaPlayer.volume = muted ? 0 : mediaPlayer.mutedVolume;
              mediaPlayer.element.dispatchEvent(events.muteChange);
            }
          });
        }
      }
    });
    super.ready();
  }
  syncState(state){
    var mediaPlayer = this;
    if(!state){
      state = this.player.getPlayerState();
    }
    switch(state){
      case YT.PlayerState.PAUSED || YT.PlayerState.ENDED:
        this.paused = true;
        clearInterval(mediaPlayer.timers.progress);
        break;
      case YT.PlayerState.PLAYING:
        this.paused = false;
        mediaPlayer.timers.progress = setInterval(function(){ 
          mediaPlayer.element.dispatchEvent(events.timeUpdate);
        }, 500);
        break;
    }
    this.element.dispatchEvent(events.playbackChange);
  }
};

window.vimeoApiLoaded = false;

/* VimeoPlayer.js */
class VimeoPlayer extends MediaPlayer{

  setup() {
    var mediaPlayer = this;
    
    if(!window.vimeoApiLoaded){
      var tag = document.createElement('script');
      tag.id = 'vimeo-sdk';
      tag.src = 'https://player.vimeo.com/api/player.js';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.vimeoApiLoaded = true;
    }
    mediaPlayer.sdkLoaded()
    super.setup();
  }

  sdkLoaded() {
    var mediaPlayer = this;
    setTimeout(function(){
      if(!(window.Vimeo === undefined)){
        mediaPlayer.ready()
      }else{
        mediaPlayer.sdkLoaded();
      }
    }, 100);
  };

  ready() {
  
    var mediaPlayer = this;
    mediaPlayer.player = new window.Vimeo.Player(this.element)
    var vimeoPlayer = mediaPlayer.player;

    mediaPlayer.play = function () {
      mediaPlayer.player.play();
    };

    mediaPlayer.pause = function () {
      mediaPlayer.player.pause();
    };

    vimeoPlayer.getDuration().then(function(duration) {
      mediaPlayer.duration = duration;
    });

    var currentTime = mediaPlayer.currentTime;
    Object.defineProperty(mediaPlayer, 'currentTime', {
      get() {
        return currentTime;
      },
      set(time) {
        vimeoPlayer.setCurrentTime(time);
      }
    });

    var volume = mediaPlayer.volume;
    Object.defineProperty(mediaPlayer, 'volume', {
      get() {
        return volume;
      },
      set(input) {
        volume = input;
        vimeoPlayer.setVolume(volume);
        if(volume > 0){
          mediaPlayer.mutedVolume = volume;
          mediaPlayer.muted = false;
        }else{
          mediaPlayer.muted = true;
        }
        mediaPlayer.element.dispatchEvent(events.volumeChange);
      }
    });

    var muted = mediaPlayer.muted;
    Object.defineProperty(mediaPlayer, 'muted', {
      get() {
        return muted;
      },
      set(input) {
        var toggle = Utils.isBoolean(input) ? input : muted;
        if(muted === toggle){
          return;
        }
        muted = toggle;
        mediaPlayer.volume = muted ? 0 : mediaPlayer.mutedVolume;
        mediaPlayer.element.dispatchEvent(events.muteChange);
      }
    });

    vimeoPlayer.on('timeupdate', function (data) {
      currentTime = data.seconds;
      mediaPlayer.element.dispatchEvent(events.timeUpdate);
    });

    vimeoPlayer.on('play', function(){
      mediaPlayer.paused = false;
      mediaPlayer.element.dispatchEvent(events.playbackChange);
    });

    vimeoPlayer.on('pause', function(){
      mediaPlayer.paused = true;
      mediaPlayer.element.dispatchEvent(events.playbackChange);
    });
    super.ready();
  }
};

/* Html5Player.js */
class Html5Player extends MediaPlayer{
  setup() {
    var mediaPlayer = this;
    mediaPlayer.player = mediaPlayer.element;
    super.setup();
    mediaPlayer.player.addEventListener('canplay', function(){ mediaPlayer.ready() });
  }

  ready() {
    var mediaPlayer = this;
    mediaPlayer.play = function () {
      mediaPlayer.player.play();
    };

    mediaPlayer.pause = function () {
      mediaPlayer.player.pause();
    };

    mediaPlayer.duration = mediaPlayer.player.duration;

    Object.defineProperty(mediaPlayer, 'currentTime', {
      get() {
        return Number(mediaPlayer.player.currentTime);
      },
      set(time) {
        mediaPlayer.player.currentTime = time;
      }
    });

    var volume = mediaPlayer.volume;
    Object.defineProperty(mediaPlayer, 'volume', {
      get() {
        return volume;
      },
      set(input) {
        volume = input;
        mediaPlayer.player.volume = volume;
        if(volume > 0){
          mediaPlayer.mutedVolume = volume;
          mediaPlayer.muted = false;
        }else{
          mediaPlayer.muted = true;
        }
        mediaPlayer.element.dispatchEvent(events.volumeChange);
      }
    });

    var muted = mediaPlayer.muted;
    Object.defineProperty(mediaPlayer, 'muted', {
      get() {
        return muted;
      },
      set(input) {
        var toggle = Utils.isBoolean(input) ? input : muted;
        if(muted === toggle){
          return;
        }
        muted = toggle;
        mediaPlayer.player.muted = muted;
        mediaPlayer.volume = muted ? 0 : mediaPlayer.mutedVolume;
          
        mediaPlayer.element.dispatchEvent(events.muteChange);
      }
    });

    mediaPlayer.player.addEventListener('timeupdate', function(){
      mediaPlayer.element.dispatchEvent(events.timeUpdate);
    });

    mediaPlayer.player.addEventListener('play', function(){
      mediaPlayer.paused = false;
      mediaPlayer.element.dispatchEvent(events.playbackChange);
    });

    mediaPlayer.player.addEventListener('pause', function(){
      mediaPlayer.paused = true;
      mediaPlayer.element.dispatchEvent(events.playbackChange);
    });
    super.ready();
  };

};

/* Utils.js */

var Utils = {
  isBoolean: function isBoolean(input) {
    return getConstructor(input) === Boolean;
  }
};

function getConstructor(input) {
  return input !== null && typeof input !== 'undefined' ? input.constructor : null;
};
