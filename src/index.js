/* Index.js */

var media = {};

document.addEventListener("DOMContentLoaded", function(event) {
  var potentialMediaElements = document.querySelectorAll('iframe,video');
  for(var i = 0; i < potentialMediaElements.length; i++){
    var potentialMediaElement = potentialMediaElements[i];
    var mediaElement = MediaPlayer.for(potentialMediaElement);
    if(mediaElement){
      media[mediaElement.id] = mediaElement;
    }
  }
});

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
          var instance = event.target;
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
