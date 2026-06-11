(function() {
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupNavigation() {
    var toggle = qs(".nav-toggle");
    var nav = qs(".main-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function() {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var slides = qsa("[data-hero-slide]");
    var dots = qsa("[data-hero-dot]");
    if (!slides.length || !dots.length) {
      return;
    }
    var active = 0;
    function show(index) {
      active = index;
      slides.forEach(function(slide, i) {
        slide.classList.toggle("is-active", i === active);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle("is-active", i === active);
      });
    }
    dots.forEach(function(dot, i) {
      dot.addEventListener("click", function() {
        show(i);
      });
    });
    window.setInterval(function() {
      show((active + 1) % slides.length);
    }, 5200);
  }

  function readParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      q: normalize(params.get("q")),
      type: normalize(params.get("type")),
      year: normalize(params.get("year")),
      category: normalize(params.get("category"))
    };
  }

  function setupSearchPage() {
    var form = qs(".filter-form");
    var grid = qs(".searchable-grid");
    if (!form || !grid) {
      return;
    }
    var input = qs("input[name='q']", form);
    var type = qs("select[name='type']", form);
    var year = qs("select[name='year']", form);
    var category = qs("select[name='category']", form);
    var cards = qsa(".search-item", grid);
    var empty = qs(".empty-state");
    var params = readParams();

    if (input) {
      input.value = params.q || "";
    }
    if (type) {
      type.value = params.type || "";
    }
    if (year) {
      year.value = params.year || "";
    }
    if (category) {
      category.value = params.category || "";
    }

    function apply() {
      var q = normalize(input && input.value);
      var selectedType = normalize(type && type.value);
      var selectedYear = normalize(year && year.value);
      var selectedCategory = normalize(category && category.value);
      var hasVisible = false;
      cards.forEach(function(card) {
        var text = normalize(card.getAttribute("data-search") + " " + card.textContent);
        var typeValue = normalize(card.getAttribute("data-type"));
        var yearValue = normalize(card.getAttribute("data-year"));
        var categoryValue = normalize(card.getAttribute("data-category"));
        var visible = true;
        if (q && text.indexOf(q) === -1) {
          visible = false;
        }
        if (selectedType && typeValue !== selectedType) {
          visible = false;
        }
        if (selectedYear && yearValue !== selectedYear) {
          visible = false;
        }
        if (selectedCategory && categoryValue !== selectedCategory) {
          visible = false;
        }
        card.classList.toggle("is-hidden", !visible);
        if (visible) {
          hasVisible = true;
        }
      });
      if (empty) {
        empty.hidden = hasVisible;
      }
    }

    [input, type, year, category].forEach(function(control) {
      if (!control) {
        return;
      }
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    });
    apply();
  }

  window.setupMoviePlayer = function(videoId, stream) {
    var video = document.getElementById(videoId);
    if (!video || !stream) {
      return;
    }
    var button = qs(".player-start", video.parentNode);
    var loaded = false;
    function load() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }
      video.load();
    }
    function play() {
      load();
      if (button) {
        button.classList.add("is-hidden");
      }
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function() {});
      }
    }
    if (button) {
      button.addEventListener("click", play);
    }
    video.addEventListener("click", function() {
      if (video.paused) {
        play();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function() {
    setupNavigation();
    setupHero();
    setupSearchPage();
  });
})();
