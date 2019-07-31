'use strict';

var mediaControls;

document.addEventListener("DOMContentLoaded", function (event) {
  for (var key in media) {
    wrapMediaPlayer(media[key]);
    addMediaPlayerControls(media[key]);
    addMediaControlHandlers(media[key]);
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
  if (!mediaControls) {
    var originalControls = document.getElementById('media-controls');
    mediaControls = originalControls.cloneNode(true);
    mediaControls.removeAttribute("id");
    mediaControls.removeAttribute("style");
    originalControls.parentNode.removeChild(originalControls);
  }

  mediaPlayer.container.appendChild(mediaControls.cloneNode(true));
};

function addMediaControlHandlers(mediaPlayer) {
  var controls = mediaPlayer.container.getElementsByClassName("controls")[0];

  mediaPlayer.container.addEventListener('mouseover', function (event) {
    event.currentTarget.classList.add('controls-visible');
  });

  mediaPlayer.container.addEventListener('mouseout', function (event) {
    event.currentTarget.classList.remove('controls-visible');
  });

  mediaPlayer.element.addEventListener('playbackChange', function () {
    if (mediaPlayer.paused) {
      controls.getElementsByClassName("play-pause")[0].classList.remove('pressed');
    } else {
      controls.getElementsByClassName("play-pause")[0].classList.add('pressed');
    }
  });

  mediaPlayer.element.addEventListener('muteChange', function () {
    if (mediaPlayer.muted) {
      controls.getElementsByClassName("mute")[0].classList.add('pressed');
    } else {
      controls.getElementsByClassName("mute")[0].classList.remove('pressed');
    }
  });

  controls.getElementsByClassName("volume-wrapper")[0].addEventListener('mouseover', function (event) {
    handleVolumeHover(event, controls, mediaPlayer);
  });
  controls.getElementsByClassName("volume-wrapper")[0].addEventListener('mouseleave', function (event) {
    handleVolumeHover(event, controls, mediaPlayer);
  });
  controls.getElementsByClassName("mute")[0].addEventListener('mouseover', function (event) {
    handleVolumeHover(event, controls, mediaPlayer);
  });
  controls.getElementsByClassName("mute")[0].addEventListener('mouseleave', function (event) {
    handleVolumeHover(event, controls, mediaPlayer);
  });

  controls.querySelectorAll('[data-media-player=play]')[0].addEventListener('click', function (event) {
    mediaPlayer.togglePlayback();
  });

  controls.querySelectorAll('[data-media-player=mute]')[0].addEventListener('click', function (event) {
    mediaPlayer.toggleMute();
  });

  var seekRange = controls.querySelectorAll('[data-media-player=seek]')[0];
  addSeekHandlers(mediaPlayer, seekRange);

  var volumeRange = controls.querySelectorAll('[data-media-player=volume]')[0];
  addVolumeHandlers(mediaPlayer, volumeRange);
};

function handleVolumeHover(event, controls, mediaPlayer) {
  if (event.type === 'mouseover') {
    clearInterval(mediaPlayer.timers.volumeVisible);
    controls.getElementsByClassName("volume-wrapper")[0].classList.add('volume-visible');
  } else {
    mediaPlayer.timers.volumeVisible = setInterval(function () {
      controls.getElementsByClassName("volume-wrapper")[0].classList.remove('volume-visible');
    }, 100);
  }
}

function addSeekHandlers(mediaPlayer, seekRange) {
  mediaPlayer.element.addEventListener('timeUpdate', function () {
    var value = 100.0 / mediaPlayer.duration * mediaPlayer.currentTime;
    seekRange.value = value;
    seekRange.style.setProperty('--value', value + '%');
  });

  seekRange.addEventListener('input', function (event) {
    var seekedPercent = event.currentTarget.value / 100.0;
    var currentTime = seekedPercent * mediaPlayer.duration;
    mediaPlayer.currentTime = currentTime;
  });
};

function addVolumeHandlers(mediaPlayer, volumeRange) {

  mediaPlayer.element.addEventListener('volumeChange', function () {
    var value = mediaPlayer.volume;
    volumeRange.value = value;
    volumeRange.style.setProperty('--value', value * 100 + '%');
  });

  volumeRange.addEventListener('input', function (event) {
    var volumePercent = event.currentTarget.value;
    mediaPlayer.volume = volumePercent;
  });
};