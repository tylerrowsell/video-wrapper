class ShopifyMedia {
  constructor(mediaElement) {
    this.id = mediaElement.id;
    this.container = mediaElement;
    this.host = getHostByMediaElement(mediaElement);
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
    if(this.isHTML5){
      console.log('placeholder for html5 setup');
    }
    if(this.isYouTube){
      youtube.setup(this);
    }
    if(this.isVimeo){
      console.log('placeholder for vimeo setup');
    }
    this.appendControls()
    this.connectControls()
    this.createPlayerEventHandlers();
  }

  appendControls(){
    if(this.controls.visible){
      return;
    }
    var doc = new DOMParser().parseFromString(defaultControls.join(''), "text/html");
    this.container.appendChild(doc.body.firstChild);
    this.controls.visible = true;
  }
  connectControls(){
    this.controls.play = this.container.querySelectorAll('[data-shopify-player=play]')[0];
    this.controls.mute = this.container.querySelectorAll('[data-shopify-player=mute]')[0];
    this.controls.seek = this.container.querySelectorAll('[data-shopify-player=seek]')[0];
    this.controls.volume = this.container.querySelectorAll('[data-shopify-player=volume]')[0];
  }
  createPlayerEventHandlers(){
    var player = this;
    this.controls.play.addEventListener('click', function(event){
      player.togglePlayback()
    })
  }

  togglePlayback(){
    if(this.paused){
      this.play();
      this.controls.play.classList.add('pressed');
      this.paused = false;
    }else{
      this.pause();
      this.controls.play.classList.remove('pressed');
      this.paused = true;
    }
  }
}

var defaultControls = [
'<div class="controls">',
'<button type="button" class="play-pause" data-shopify-player="play" aria-label="Play, {title}">',
  '<span class="icon--pressed" focusable="false">Pause</span>',
  '<span class="icon--not-pressed" focusable="false">Play</span>',
'</button>',
'<div class="seek-wrapper">',
  '<input data-shopify-player="seek" type="range" min="0" max="100" step="0.01" value="0" autocomplete="off" role="slider" aria-label="Seek" style="--value:0%;">',
'</div>',
'<button type="button" class="mute" data-shopify-player="mute">',
  '<span class="icon--pressed" focusable="false">Muted</span>',
  '<span class="icon--not-pressed" focusable="false">Unmuted</span>',
'</button>',
'<div class="volume-wrapper">',
  '<input data-shopify-player="volume" type="range" min="0" max="1" step="0.05" value="1" autocomplete="off" role="slider" aria-label="Volume" style="--value:85%;">',
'</div>',
'</div>']

hosts = {
  html5: 'html5',
  youtube: 'youtube',
  vimeo: 'vimeo'
};


var youtube = {
  setup: function(media){
    window.onYouTubeIframeAPIReady = function () {
      media.iframeId= randomId();
      iframe = media.container.getElementsByTagName("iframe")[0];
      iframe.id = media.iframeId;
      youtube.ready(media, media.iframeId);
    }
  
    if(!youtubeApiLoaded){
      var tag = document.createElement('script');
      tag.id = 'iframe-demo';
      tag.src = 'https://www.youtube.com/iframe_api';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      youtubeApiLoaded = true;
    }
  },
  ready: function(media, iframeId){
    media.player = new window.YT.Player(iframeId, {
      width: 800,
      height: 450,
      events: {
        onReady: function onReady(event) {
          var instance = event.target;

          media.play = function () {
            instance.playVideo();
          };

          media.pause = function () {
            instance.pauseVideo();
          };

          media.stop = function () {
            instance.stopVideo();
          };

          media.duration = instance.getDuration();

          media.currentTime = 0;
          Object.defineProperty(media, 'currentTime', {
            get() {
              return Number(instance.getCurrentTime());
            },
            set(time) {
              instance.seekTo(time);
            }
          });

          var volume = media.volume;
          Object.defineProperty(media, 'volume', {
            get() {
              return volume;
            },
            set(input) {
              volume = input;
              instance.setVolume(volume * 100);
            }
          });

          var muted = media.muted;
          Object.defineProperty(media, 'muted', {
            get() {
              return muted;
            },
            set(input) {
              var toggle = is$1.boolean(input) ? input : muted;
              muted = toggle;
              instance[toggle ? 'mute' : 'unMute']();
            }
          });

          instance.setSize(800, 450);
        }
      }
    });
  }
}

function randomId() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
}

function getHostByMediaElement(mediaElement){
  var iframe = mediaElement.querySelector('iframe');
  if(iframe){
    if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(iframe.src)) {
      return hosts.youtube;
    }
    if (/^https?:\/\/player.vimeo.com\/video\/\d{0,9}(?=\b|\/)/.test(iframe.src)) {
      return hosts.vimeo;
    }
  }else{
    return hosts.html5;
  }
}

var media = {}
var mediaElements = document.getElementsByClassName("shopify_player");
var youtubeApiLoaded = false;

document.addEventListener("DOMContentLoaded", function(event) {
  for(var i = 0; i < mediaElements.length; i++)
  {
    mediaElement = mediaElements[i];
    media[mediaElement.id] = new ShopifyMedia(mediaElement);
  }
});
  

// ==========================================================================
// Type checking utils
// ==========================================================================
var getConstructor$1 = function getConstructor(input) {
  return input !== null && typeof input !== 'undefined' ? input.constructor : null;
};

var instanceOf$1 = function instanceOf(input, constructor) {
  return Boolean(input && constructor && input instanceof constructor);
};

var isNullOrUndefined$1 = function isNullOrUndefined(input) {
  return input === null || typeof input === 'undefined';
};

var isObject$2 = function isObject(input) {
  return getConstructor$1(input) === Object;
};

var isNumber$1 = function isNumber(input) {
  return getConstructor$1(input) === Number && !Number.isNaN(input);
};

var isString$1 = function isString(input) {
  return getConstructor$1(input) === String;
};

var isBoolean$1 = function isBoolean(input) {
  return getConstructor$1(input) === Boolean;
};

var isFunction$1 = function isFunction(input) {
  return getConstructor$1(input) === Function;
};

var isArray$2 = function isArray(input) {
  return Array.isArray(input);
};

var isWeakMap = function isWeakMap(input) {
  return instanceOf$1(input, WeakMap);
};

var isNodeList$1 = function isNodeList(input) {
  return instanceOf$1(input, NodeList);
};

var isElement$1 = function isElement(input) {
  return instanceOf$1(input, Element);
};

var isTextNode = function isTextNode(input) {
  return getConstructor$1(input) === Text;
};

var isEvent$1 = function isEvent(input) {
  return instanceOf$1(input, Event);
};

var isKeyboardEvent = function isKeyboardEvent(input) {
  return instanceOf$1(input, KeyboardEvent);
};

var isCue = function isCue(input) {
  return instanceOf$1(input, window.TextTrackCue) || instanceOf$1(input, window.VTTCue);
};

var isTrack = function isTrack(input) {
  return instanceOf$1(input, TextTrack) || !isNullOrUndefined$1(input) && isString$1(input.kind);
};

var isPromise = function isPromise(input) {
  return instanceOf$1(input, Promise);
};

var isEmpty$1 = function isEmpty(input) {
  return isNullOrUndefined$1(input) || (isString$1(input) || isArray$2(input) || isNodeList$1(input)) && !input.length || isObject$2(input) && !Object.keys(input).length;
};

var isUrl = function isUrl(input) {
  // Accept a URL object
  if (instanceOf$1(input, window.URL)) {
    return true;
  } // Must be string from here


  if (!isString$1(input)) {
    return false;
  } // Add the protocol if required


  var string = input;

  if (!input.startsWith('http://') || !input.startsWith('https://')) {
    string = "http://".concat(input);
  }

  try {
    return !isEmpty$1(new URL(string).hostname);
  } catch (e) {
    return false;
  }
};

var is$1 = {
  nullOrUndefined: isNullOrUndefined$1,
  object: isObject$2,
  number: isNumber$1,
  string: isString$1,
  boolean: isBoolean$1,
  function: isFunction$1,
  array: isArray$2,
  weakMap: isWeakMap,
  nodeList: isNodeList$1,
  element: isElement$1,
  textNode: isTextNode,
  event: isEvent$1,
  keyboardEvent: isKeyboardEvent,
  cue: isCue,
  track: isTrack,
  promise: isPromise,
  url: isUrl,
  empty: isEmpty$1
};