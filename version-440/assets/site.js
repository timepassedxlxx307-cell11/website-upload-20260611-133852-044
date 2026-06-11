(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var thumbs = Array.prototype.slice.call(root.querySelectorAll("[data-hero-thumb]"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      thumbs.forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle("is-active", thumbIndex === current);
      });
    }
    function start() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        show(Number(thumb.getAttribute("data-hero-thumb") || 0));
        start();
      });
    });
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function applyListing(listing) {
    var input = listing.querySelector("[data-list-search]");
    var sort = listing.querySelector("[data-list-sort]");
    var list = listing.querySelector("[data-card-list]");
    var empty = listing.querySelector("[data-empty-state]");
    if (!list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll("[data-card]"));
    function update() {
      var keyword = input ? normalize(input.value) : "";
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-search"));
        var matched = keyword === "" || haystack.indexOf(keyword) !== -1;
        card.classList.toggle("is-hidden", !matched);
        if (matched) {
          visible += 1;
        }
      });
      var mode = sort ? sort.value : "year";
      var sorted = cards.slice().sort(function (a, b) {
        if (mode === "title") {
          return String(a.getAttribute("data-title") || "").localeCompare(String(b.getAttribute("data-title") || ""), "zh-Hans-CN");
        }
        var key = mode === "hot" ? "data-hot" : "data-year";
        return Number(b.getAttribute(key) || 0) - Number(a.getAttribute(key) || 0);
      });
      sorted.forEach(function (card) {
        list.appendChild(card);
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }
    if (input) {
      input.addEventListener("input", update);
    }
    if (sort) {
      sort.addEventListener("change", update);
    }
    update();
  }

  function initListings() {
    Array.prototype.slice.call(document.querySelectorAll("[data-listing]")).forEach(applyListing);
  }

  function initSearchQuery() {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    if (!query) {
      return;
    }
    var pageInput = document.querySelector("[data-search-page-input]");
    if (pageInput) {
      pageInput.value = query;
    }
    var listInput = document.querySelector("[data-list-search]");
    if (listInput) {
      listInput.value = query;
      listInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function bootPlayer(config) {
    var video = document.getElementById(config.videoId);
    var cover = document.getElementById(config.coverId);
    var button = document.getElementById(config.buttonId);
    var source = config.source;
    if (!video || !source) {
      return;
    }
    var started = false;
    var hls = null;
    function hideCover() {
      if (cover) {
        cover.classList.add("is-hidden");
      }
    }
    function playVideo() {
      hideCover();
      var action = video.play();
      if (action && typeof action.catch === "function") {
        action.catch(function () {});
      }
    }
    function start() {
      if (started) {
        playVideo();
        return;
      }
      started = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        playVideo();
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          playVideo();
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && hls) {
            hls.destroy();
            hls = null;
            video.src = source;
            playVideo();
          }
        });
        return;
      }
      video.src = source;
      playVideo();
    }
    if (cover) {
      cover.addEventListener("click", start);
    }
    if (button) {
      button.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
      if (!started) {
        start();
      }
    });
    video.addEventListener("play", hideCover);
  }

  window.FilmSite = {
    bootPlayer: bootPlayer
  };

  ready(function () {
    initMenu();
    initHero();
    initListings();
    initSearchQuery();
  });
}());
