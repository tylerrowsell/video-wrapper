'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* Index.js */

var media = {};

document.addEventListener("DOMContentLoaded", function (event) {
  var potentialMediaElements = document.querySelectorAll('iframe,video');
  for (var i = 0; i < potentialMediaElements.length; i++) {
    var potentialMediaElement = potentialMediaElements[i];
    var mediaElement = MediaPlayer.for(potentialMediaElement);
    if (mediaElement) {
      media[mediaElement.id] = mediaElement;
    }
  }
});

/* MediaPlayer.js */

var MediaPlayer = function () {
  _createClass(MediaPlayer, null, [{
    key: 'for',
    value: function _for(mediaElement) {
      var host = hostByMediaElement(mediaElement);
      switch (host) {
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
  }]);

  function MediaPlayer(mediaElement) {
    _classCallCheck(this, MediaPlayer);

    mediaElement.mediaPlayer = this;
    if (mediaElement.id) {
      this.id = mediaElement.id;
    } else {
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

  _createClass(MediaPlayer, [{
    key: 'setup',
    value: function setup() {
      this.status = 'loading';
    }
  }, {
    key: 'ready',
    value: function ready() {
      this.status = 'ready';
    }
  }, {
    key: 'togglePlayback',
    value: function togglePlayback() {
      if (this.paused) {
        this.play();
      } else {
        this.pause();
      }
    }
  }, {
    key: 'toggleMute',
    value: function toggleMute() {
      if (this.muted) {
        this.muted = false;
      } else {
        this.muted = true;
      }
    }
  }, {
    key: 'isHTML5',
    get: function get() {
      return this.host === hosts.html5;
    }
  }, {
    key: 'isYouTube',
    get: function get() {
      return this.host === hosts.youtube;
    }
  }, {
    key: 'isVimeo',
    get: function get() {
      return this.host === hosts.vimeo;
    }
  }]);

  return MediaPlayer;
}();

;

var hosts = {
  html5: 'html5',
  youtube: 'youtube',
  vimeo: 'vimeo'
};

var eventNames = {
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

function hostByMediaElement(mediaElement) {
  if (mediaElement.tagName == 'VIDEO') {
    return hosts.html5;
  }
  if (mediaElement.tagName === 'IFRAME') {
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

var YoutubePlayer = function (_MediaPlayer) {
  _inherits(YoutubePlayer, _MediaPlayer);

  function YoutubePlayer() {
    _classCallCheck(this, YoutubePlayer);

    return _possibleConstructorReturn(this, (YoutubePlayer.__proto__ || Object.getPrototypeOf(YoutubePlayer)).apply(this, arguments));
  }

  _createClass(YoutubePlayer, [{
    key: 'setup',
    value: function setup() {
      var mediaPlayer = this;
      window.onYouTubeIframeAPIReady = function () {
        mediaPlayer.ready();
      };

      if (!window.youtubeApiLoaded) {
        var tag = document.createElement('script');
        tag.id = 'youtube-sdk';
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.youtubeApiLoaded = true;
      }
      _get(YoutubePlayer.prototype.__proto__ || Object.getPrototypeOf(YoutubePlayer.prototype), 'setup', this).call(this);
    }
  }, {
    key: 'ready',
    value: function ready() {
      var mediaPlayer = this;
      mediaPlayer.player = new window.YT.Player(mediaPlayer.id, {
        events: {
          onStateChange: function onStateChange(event) {
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
              get: function get() {
                return Number(instance.getCurrentTime());
              },
              set: function set(time) {
                instance.seekTo(time);
              }
            });

            var volume = mediaPlayer.volume;
            Object.defineProperty(mediaPlayer, 'volume', {
              get: function get() {
                return volume;
              },
              set: function set(input) {
                volume = input;
                instance.setVolume(volume * 100);
                if (volume > 0) {
                  mediaPlayer.mutedVolume = volume;
                  mediaPlayer.muted = false;
                } else {
                  mediaPlayer.muted = true;
                }
                mediaPlayer.element.dispatchEvent(events.volumeChange);
              }
            });

            var muted = mediaPlayer.muted;
            Object.defineProperty(mediaPlayer, 'muted', {
              get: function get() {
                return muted;
              },
              set: function set(input) {
                var toggle = Utils.isBoolean(input) ? input : muted;
                if (muted === toggle) {
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
      _get(YoutubePlayer.prototype.__proto__ || Object.getPrototypeOf(YoutubePlayer.prototype), 'ready', this).call(this);
    }
  }, {
    key: 'syncState',
    value: function syncState(state) {
      var mediaPlayer = this;
      if (!state) {
        state = this.player.getPlayerState();
      }
      switch (state) {
        case YT.PlayerState.PAUSED || YT.PlayerState.ENDED:
          this.paused = true;
          clearInterval(mediaPlayer.timers.progress);
          break;
        case YT.PlayerState.PLAYING:
          this.paused = false;
          mediaPlayer.timers.progress = setInterval(function () {
            mediaPlayer.element.dispatchEvent(events.timeUpdate);
          }, 500);
          break;
      }
      this.element.dispatchEvent(events.playbackChange);
    }
  }]);

  return YoutubePlayer;
}(MediaPlayer);

;

window.vimeoApiLoaded = false;

/* VimeoPlayer.js */

var VimeoPlayer = function (_MediaPlayer2) {
  _inherits(VimeoPlayer, _MediaPlayer2);

  function VimeoPlayer() {
    _classCallCheck(this, VimeoPlayer);

    return _possibleConstructorReturn(this, (VimeoPlayer.__proto__ || Object.getPrototypeOf(VimeoPlayer)).apply(this, arguments));
  }

  _createClass(VimeoPlayer, [{
    key: 'setup',
    value: function setup() {
      var mediaPlayer = this;

      if (!window.vimeoApiLoaded) {
        var tag = document.createElement('script');
        tag.id = 'vimeo-sdk';
        tag.src = 'https://player.vimeo.com/api/player.js';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.vimeoApiLoaded = true;
      }
      mediaPlayer.sdkLoaded();
      _get(VimeoPlayer.prototype.__proto__ || Object.getPrototypeOf(VimeoPlayer.prototype), 'setup', this).call(this);
    }
  }, {
    key: 'sdkLoaded',
    value: function sdkLoaded() {
      var mediaPlayer = this;
      setTimeout(function () {
        if (!(window.Vimeo === undefined)) {
          mediaPlayer.ready();
        } else {
          mediaPlayer.sdkLoaded();
        }
      }, 100);
    }
  }, {
    key: 'ready',
    value: function ready() {

      var mediaPlayer = this;
      mediaPlayer.player = new window.Vimeo.Player(this.element);
      var vimeoPlayer = mediaPlayer.player;

      mediaPlayer.play = function () {
        mediaPlayer.player.play();
      };

      mediaPlayer.pause = function () {
        mediaPlayer.player.pause();
      };

      vimeoPlayer.getDuration().then(function (duration) {
        mediaPlayer.duration = duration;
      });

      var currentTime = mediaPlayer.currentTime;
      Object.defineProperty(mediaPlayer, 'currentTime', {
        get: function get() {
          return currentTime;
        },
        set: function set(time) {
          vimeoPlayer.setCurrentTime(time);
        }
      });

      var volume = mediaPlayer.volume;
      Object.defineProperty(mediaPlayer, 'volume', {
        get: function get() {
          return volume;
        },
        set: function set(input) {
          volume = input;
          vimeoPlayer.setVolume(volume);
          if (volume > 0) {
            mediaPlayer.mutedVolume = volume;
            mediaPlayer.muted = false;
          } else {
            mediaPlayer.muted = true;
          }
          mediaPlayer.element.dispatchEvent(events.volumeChange);
        }
      });

      var muted = mediaPlayer.muted;
      Object.defineProperty(mediaPlayer, 'muted', {
        get: function get() {
          return muted;
        },
        set: function set(input) {
          var toggle = Utils.isBoolean(input) ? input : muted;
          if (muted === toggle) {
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

      vimeoPlayer.on('play', function () {
        mediaPlayer.paused = false;
        mediaPlayer.element.dispatchEvent(events.playbackChange);
      });

      vimeoPlayer.on('pause', function () {
        mediaPlayer.paused = true;
        mediaPlayer.element.dispatchEvent(events.playbackChange);
      });
      _get(VimeoPlayer.prototype.__proto__ || Object.getPrototypeOf(VimeoPlayer.prototype), 'ready', this).call(this);
    }
  }]);

  return VimeoPlayer;
}(MediaPlayer);

;

/* Html5Player.js */

var Html5Player = function (_MediaPlayer3) {
  _inherits(Html5Player, _MediaPlayer3);

  function Html5Player() {
    _classCallCheck(this, Html5Player);

    return _possibleConstructorReturn(this, (Html5Player.__proto__ || Object.getPrototypeOf(Html5Player)).apply(this, arguments));
  }

  _createClass(Html5Player, [{
    key: 'setup',
    value: function setup() {
      var mediaPlayer = this;
      mediaPlayer.player = mediaPlayer.element;
      _get(Html5Player.prototype.__proto__ || Object.getPrototypeOf(Html5Player.prototype), 'setup', this).call(this);
      mediaPlayer.player.addEventListener('canplay', function () {
        mediaPlayer.ready();
      });
    }
  }, {
    key: 'ready',
    value: function ready() {
      var mediaPlayer = this;
      mediaPlayer.play = function () {
        mediaPlayer.player.play();
      };

      mediaPlayer.pause = function () {
        mediaPlayer.player.pause();
      };

      mediaPlayer.duration = mediaPlayer.player.duration;

      Object.defineProperty(mediaPlayer, 'currentTime', {
        get: function get() {
          return Number(mediaPlayer.player.currentTime);
        },
        set: function set(time) {
          mediaPlayer.player.currentTime = time;
        }
      });

      var volume = mediaPlayer.volume;
      Object.defineProperty(mediaPlayer, 'volume', {
        get: function get() {
          return volume;
        },
        set: function set(input) {
          volume = input;
          mediaPlayer.player.volume = volume;
          if (volume > 0) {
            mediaPlayer.mutedVolume = volume;
            mediaPlayer.muted = false;
          } else {
            mediaPlayer.muted = true;
          }
          mediaPlayer.element.dispatchEvent(events.volumeChange);
        }
      });

      var muted = mediaPlayer.muted;
      Object.defineProperty(mediaPlayer, 'muted', {
        get: function get() {
          return muted;
        },
        set: function set(input) {
          var toggle = Utils.isBoolean(input) ? input : muted;
          if (muted === toggle) {
            return;
          }
          muted = toggle;
          mediaPlayer.player.muted = muted;
          mediaPlayer.volume = muted ? 0 : mediaPlayer.mutedVolume;

          mediaPlayer.element.dispatchEvent(events.muteChange);
        }
      });

      mediaPlayer.player.addEventListener('timeupdate', function () {
        mediaPlayer.element.dispatchEvent(events.timeUpdate);
      });

      mediaPlayer.player.addEventListener('play', function () {
        mediaPlayer.paused = false;
        mediaPlayer.element.dispatchEvent(events.playbackChange);
      });

      mediaPlayer.player.addEventListener('pause', function () {
        mediaPlayer.paused = true;
        mediaPlayer.element.dispatchEvent(events.playbackChange);
      });
      _get(Html5Player.prototype.__proto__ || Object.getPrototypeOf(Html5Player.prototype), 'ready', this).call(this);
    }
  }]);

  return Html5Player;
}(MediaPlayer);

;

/* Utils.js */

var Utils = {
  isBoolean: function isBoolean(input) {
    return getConstructor(input) === Boolean;
  }
};

function getConstructor(input) {
  return input !== null && typeof input !== 'undefined' ? input.constructor : null;
};