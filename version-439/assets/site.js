(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    var menu = document.querySelector(".mobile-nav");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var carousel = document.querySelector(".js-hero-carousel");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
    var prev = carousel.querySelector(".hero-control.prev");
    var next = carousel.querySelector(".hero-control.next");
    var index = 0;
    var timer = null;

    function show(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot, itemIndex) {
      dot.addEventListener("click", function () {
        show(itemIndex);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }

  function setupFilters() {
    var forms = Array.prototype.slice.call(document.querySelectorAll(".js-filter-form"));
    forms.forEach(function (form) {
      var section = form.closest(".section") || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll(".movie-card"));
      var keyword = form.querySelector(".js-filter-keyword");
      var type = form.querySelector(".js-filter-type");
      var year = form.querySelector(".js-filter-year");
      var empty = section.querySelector(".js-empty-state");
      var params = new URLSearchParams(window.location.search);

      if (keyword && params.get("q")) {
        keyword.value = params.get("q");
      }

      function apply() {
        var query = keyword ? keyword.value.trim().toLowerCase() : "";
        var targetType = type ? type.value : "";
        var targetYear = year ? year.value : "";
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-tags")
          ].join(" ").toLowerCase();
          var matchesQuery = !query || haystack.indexOf(query) !== -1;
          var matchesType = !targetType || (card.getAttribute("data-type") || "").indexOf(targetType) !== -1;
          var matchesYear = !targetYear || card.getAttribute("data-year") === targetYear;
          var matches = matchesQuery && matchesType && matchesYear;
          card.hidden = !matches;
          if (matches) {
            visible += 1;
          }
        });

        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      [keyword, type, year].forEach(function (field) {
        if (field) {
          field.addEventListener("input", apply);
          field.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  window.initMoviePlayer = function (videoId, coverId, buttonId, sourceUrl) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    var button = document.getElementById(buttonId);
    var hls = null;
    var prepared = false;

    if (!video || !cover || !button || !sourceUrl) {
      return;
    }

    function playVideo() {
      cover.hidden = true;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    function prepare() {
      if (prepared) {
        playVideo();
        return;
      }
      prepared = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
        video.addEventListener("loadedmetadata", playVideo, { once: true });
        video.load();
        playVideo();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
          hls.loadSource(sourceUrl);
        });
        hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
        return;
      }

      video.src = sourceUrl;
      video.addEventListener("loadedmetadata", playVideo, { once: true });
      video.load();
      playVideo();
    }

    cover.addEventListener("click", prepare);
    button.addEventListener("click", prepare);
    video.addEventListener("play", function () {
      cover.hidden = true;
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();