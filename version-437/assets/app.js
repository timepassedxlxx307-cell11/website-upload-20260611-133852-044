const MovieApp = (function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initNavigation() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    const hero = document.querySelector("[data-hero-carousel]");
    if (!hero) {
      return;
    }
    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");
    if (!slides.length) {
      return;
    }
    let index = 0;
    let timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
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
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initFilters() {
    const lists = Array.from(document.querySelectorAll("[data-filter-list]"));
    lists.forEach(function (list) {
      const section = list.closest("section") || document;
      const input = section.querySelector("[data-filter-input]");
      const year = section.querySelector("[data-filter-year]");
      const type = section.querySelector("[data-filter-type]");
      const empty = section.querySelector("[data-empty-state]");
      const items = Array.from(list.querySelectorAll(".filter-card"));

      function apply() {
        const keyword = normalize(input ? input.value : "");
        const selectedYear = year ? year.value : "";
        const selectedType = type ? type.value : "";
        let visible = 0;
        items.forEach(function (item) {
          const haystack = normalize([
            item.getAttribute("data-title"),
            item.getAttribute("data-region"),
            item.getAttribute("data-type"),
            item.getAttribute("data-genre"),
            item.getAttribute("data-category")
          ].join(" "));
          const itemYear = item.getAttribute("data-year") || "";
          const itemType = item.getAttribute("data-type") || "";
          const matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          const matchYear = !selectedYear || itemYear === selectedYear;
          const matchType = !selectedType || itemType === selectedType;
          const isVisible = matchKeyword && matchYear && matchType;
          item.hidden = !isVisible;
          if (isVisible) {
            visible += 1;
          }
        });
        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      [input, year, type].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      apply();
    });
  }

  function cardTemplate(movie) {
    const tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return [
      "<article class=\"movie-card\">",
      "<a href=\"" + escapeHtml(movie.url) + "\" class=\"card-link\">",
      "<div class=\"poster-wrap\">",
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
      "<span class=\"year-badge\">" + escapeHtml(movie.year) + "</span>",
      "<div class=\"poster-gradient\"></div>",
      "</div>",
      "<div class=\"card-body\">",
      "<h2>" + escapeHtml(movie.title) + "</h2>",
      "<p>" + escapeHtml(movie.oneLine) + "</p>",
      "<div class=\"card-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
      "<div class=\"tag-row\">" + tags + "</div>",
      "</div>",
      "</a>",
      "</article>"
    ].join("");
  }

  function initSearch() {
    const input = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");
    const form = document.getElementById("searchForm");
    const empty = document.getElementById("searchEmpty");
    if (!input || !results || !Array.isArray(window.SEARCH_MOVIES)) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    input.value = query;

    function render() {
      const keyword = normalize(input.value);
      const source = window.SEARCH_MOVIES.filter(function (movie) {
        if (!keyword) {
          return true;
        }
        return normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.category,
          (movie.tags || []).join(" "),
          movie.oneLine
        ].join(" ")).indexOf(keyword) !== -1;
      }).slice(0, 120);
      results.innerHTML = source.map(cardTemplate).join("");
      if (empty) {
        empty.hidden = source.length !== 0;
      }
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        render();
      });
    }
    input.addEventListener("input", render);
    render();
  }

  function initPlayer(videoId, source) {
    const video = document.getElementById(videoId);
    if (!video || !source) {
      return;
    }
    const box = video.closest(".player-box");
    const button = box ? box.querySelector("[data-player-button]") : null;
    const errorBox = box ? box.querySelector("[data-player-error]") : null;
    let prepared = false;
    let hls = null;

    function showError() {
      if (errorBox) {
        errorBox.hidden = false;
      }
      if (button) {
        button.classList.remove("is-hidden");
      }
    }

    function prepare() {
      if (prepared) {
        return;
      }
      prepared = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showError();
          }
        });
        return;
      }
      showError();
    }

    function play() {
      prepare();
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          showError();
        });
      }
    }

    if (button) {
      button.addEventListener("click", function () {
        play();
      });
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", function () {
      if (button) {
        button.classList.add("is-hidden");
      }
    });
    video.addEventListener("pause", function () {
      if (button) {
        button.classList.remove("is-hidden");
      }
    });
    video.addEventListener("error", showError);
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    });
  }

  ready(function () {
    initNavigation();
    initHero();
    initFilters();
    initSearch();
  });

  return {
    initPlayer: initPlayer
  };
})();
