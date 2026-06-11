(function () {
  var MovieSite = {};

  MovieSite.initNavigation = function () {
    var toggle = document.querySelector('.nav-toggle');
    var mobile = document.getElementById('mobileNav');
    if (!toggle || !mobile) {
      return;
    }
    toggle.addEventListener('click', function () {
      var isOpen = mobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  };

  MovieSite.initHero = function () {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;
    function setSlide(index) {
      current = index % slides.length;
      slides.forEach(function (slide, position) {
        slide.classList.toggle('is-active', position === current);
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === current);
      });
    }
    function start() {
      stop();
      timer = window.setInterval(function () {
        setSlide(current + 1);
      }, 5000);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var index = parseInt(dot.getAttribute('data-hero-dot'), 10) || 0;
        setSlide(index);
        start();
      });
    });
    setSlide(0);
    start();
  };

  MovieSite.initFilters = function () {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.filter-panel'));
    panels.forEach(function (panel) {
      var input = panel.querySelector('[data-search]');
      var chips = Array.prototype.slice.call(panel.querySelectorAll('[data-filter]'));
      var list = panel.parentElement ? panel.parentElement.querySelector('.searchable-list') : document.querySelector('.searchable-list');
      if (!list) {
        return;
      }
      var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
      var activeFilter = 'all';
      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var text = (card.getAttribute('data-searchtext') || '').toLowerCase();
          var category = card.getAttribute('data-category') || '';
          var matchedQuery = !query || text.indexOf(query) !== -1;
          var matchedFilter = activeFilter === 'all' || category === activeFilter;
          card.classList.toggle('is-filtered-out', !(matchedQuery && matchedFilter));
        });
      }
      if (input) {
        input.addEventListener('input', apply);
      }
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          activeFilter = chip.getAttribute('data-filter') || 'all';
          chips.forEach(function (item) {
            item.classList.toggle('active', item === chip);
          });
          apply();
        });
      });
      apply();
    });
  };

  MovieSite.initPlayer = function (options) {
    var video = document.getElementById(options.videoId);
    var overlay = document.getElementById(options.overlayId);
    var src = options.src;
    var loaded = false;
    var hls = null;
    if (!video || !overlay || !src) {
      return;
    }
    function attach() {
      if (loaded) {
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }
      loaded = true;
    }
    function play() {
      attach();
      overlay.classList.add('is-hidden');
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          overlay.classList.remove('is-hidden');
        });
      }
    }
    overlay.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener('play', function () {
      overlay.classList.add('is-hidden');
    });
    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  window.MovieSite = MovieSite;
  document.addEventListener('DOMContentLoaded', function () {
    MovieSite.initNavigation();
    MovieSite.initFilters();
  });
})();
