
(function () {
  var players = Array.prototype.slice.call(document.querySelectorAll('.player-wrap'));

  players.forEach(function (wrap) {
    var video = wrap.querySelector('video');
    var button = wrap.querySelector('.play-trigger');
    var streamUrl = video ? video.getAttribute('data-stream') : '';
    var hls = null;
    var ready = false;

    function attach() {
      if (!video || !streamUrl || ready) {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        ready = true;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        ready = true;
      }
    }

    function play() {
      attach();

      if (!video) {
        return;
      }

      video.controls = true;
      wrap.classList.add('is-playing');

      var action = video.play();

      if (action && typeof action.catch === 'function') {
        action.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', play);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
    }
  });
})();
