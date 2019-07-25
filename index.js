/* Index.js */

media = {};

document.addEventListener("DOMContentLoaded", function(event) {
  var potentialMediaElements = document.querySelectorAll('iframe,video');
  for(var i = 0; i < potentialMediaElements.length; i++){
    potentialMediaElement = potentialMediaElements[i];
    mediaElement = MediaPlayer.for(potentialMediaElement);
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
    this.player = mediaElement;
    this.host = hostByMediaElement(mediaElement);
    this.paused = true;
    this.currentTime = 0;
    this.duration = 0;
    this.muted = false;
    this.volume = 1;
    this.controls = {
      visible: false
    }
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
    this.setupTimeUpdateEvent();
  };

  ready(){
    this.status = 'ready';
  };

  setupTimeUpdateEvent(){
    var mediaPlayer = this;
    mediaPlayer.player.addEventListener(eventNames.playbackChange, function(){
      if(mediaPlayer.paused){
        clearInterval(mediaPlayer.progressTimeout);
      }else{
        mediaPlayer.progressTimeout = setInterval(function(){ 
          mediaPlayer.player.dispatchEvent(events.timeUpdate);
        }, 500);
      }
    });
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
  seeked: 'seeked',
  timeUpdate: 'timeUpdate'
};

var events = {
  playbackChange: new Event(eventNames.playbackChange),
  volumeChange: new Event(eventNames.volumeChange),
  muteChange: new Event(eventNames.muteChange),
  seeked: new Event(eventNames.seeked),
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
    mediaPlayer.embed = new window.YT.Player(mediaPlayer.id, {
      events: {
        onStateChange: function onStateChange(event){
          mediaPlayer.syncState(event.data);
        },
        onReady: function onReady(event) {
          var instance = event.target;
          mediaPlayer.play = function () {
            instance.playVideo();
            mediaPlayer.player.dispatchEvent(events.playbackChange);
          };

          mediaPlayer.pause = function () {
            instance.pauseVideo();
            mediaPlayer.player.dispatchEvent(events.playbackChange);
          };

          mediaPlayer.duration = instance.getDuration();

          mediaPlayer.currentTime = 0;
          Object.defineProperty(mediaPlayer, 'currentTime', {
            get() {
              return Number(instance.getCurrentTime());
            },
            set(time) {
              instance.seekTo(time);
              mediaPlayer.player.dispatchEvent(events.seeked);
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
              mediaPlayer.player.dispatchEvent(events.volumeChange);
            }
          });

          var muted = mediaPlayer.muted;
          Object.defineProperty(mediaPlayer, 'muted', {
            get() {
              return muted;
            },
            set(input) {
              var toggle = Utils.isBoolean(input) ? input : muted;
              muted = toggle;
              instance[muted ? 'mute' : 'unMute']();
              mediaPlayer.player.dispatchEvent(events.muteChange);
            }
          });

          instance.setSize(800, 450);
        }
      }
    });
    super.ready();
  }
  syncState(state){
    if(!state){
      state = this.embed.getPlayerState();
    }
    switch(state){
      case YT.PlayerState.ENDED:
        this.paused = true;
        break;
      case YT.PlayerState.PLAYING:
        this.paused = false;
        break;
      case YT.PlayerState.PAUSED:
        this.paused = true;
        break;
    }
    this.player.dispatchEvent(events.playbackChange);
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
    mediaPlayer.embed = new window.Vimeo.Player(this.player)
    var vimeoPlayer = mediaPlayer.embed;

    mediaPlayer.play = function () {
      mediaPlayer.embed.play();
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    };

    mediaPlayer.pause = function () {
      mediaPlayer.embed.pause();
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    };

    mediaPlayer.duration = vimeoPlayer.getDuration();

    mediaPlayer.currentTime = 0;
    Object.defineProperty(mediaPlayer, 'currentTime', {
      get() {
        return Number(vimeoPlayer.getCurrentTime());
      },
      set(time) {
        vimeoPlayer.setCurrentTime(time);
        mediaPlayer.player.dispatchEvent(events.seeked);
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
        mediaPlayer.player.dispatchEvent(events.volumeChange);
      }
    });

    var muted = mediaPlayer.muted;
    Object.defineProperty(mediaPlayer, 'muted', {
      get() {
        return muted;
      },
      set(input) {
        var toggle = Utils.isBoolean(input) ? input : muted;
        muted = toggle;
        if(muted && mediaPlayer.volume > 0){
          mediaPlayer.mutedVolume = mediaPlayer.volume;
          mediaPlayer.volume = 0;
        }else{
          mediaPlayer.volume = mediaPlayer.mutedVolume;
        }
        mediaPlayer.player.dispatchEvent(events.muteChange);
      }
    });

    vimeoPlayer.on('play', function(){
      mediaPlayer.paused = false;
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    });

    vimeoPlayer.on('pause', function(){
      mediaPlayer.paused = true;
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    });
    super.ready();
  }
};

/* Html5Player.js */
class Html5Player extends MediaPlayer{
  setup() {
    var mediaPlayer = this;
    mediaPlayer.play = function () {
      mediaPlayer.player.play();
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    };

    mediaPlayer.pause = function () {
      mediaPlayer.player.pause();
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    };

    mediaPlayer.duration = mediaPlayer.player.duration;

    mediaPlayer.currentTime = 0;
    Object.defineProperty(mediaPlayer, 'currentTime', {
      get() {
        return Number(mediaPlayer.player.currentTime);
      },
      set(time) {
        mediaPlayer.player.currentTime = time;
        mediaPlayer.player.dispatchEvent(events.seeked);
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
        mediaPlayer.player.dispatchEvent(events.volumeChange);
      }
    });

    var muted = mediaPlayer.muted;
    Object.defineProperty(mediaPlayer, 'muted', {
      get() {
        return muted;
      },
      set(input) {
        var toggle = Utils.isBoolean(input) ? input : muted;
        muted = toggle;
        mediaPlayer.player.muted = muted;
        mediaPlayer.player.dispatchEvent(events.muteChange);
      }
    });

    mediaPlayer.player.addEventListener('play', function(){
      mediaPlayer.paused = false;
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    });

    mediaPlayer.player.addEventListener('pause', function(){
      mediaPlayer.paused = true;
      mediaPlayer.player.dispatchEvent(events.playbackChange);
    });

    super.setup();
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
