(function() {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function() {
    var toggle = document.querySelector(".menu-toggle");
    var mobileNav = document.querySelector(".mobile-nav");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function() {
        mobileNav.classList.toggle("open");
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function startCarousel() {
      if (slides.length < 2) {
        return;
      }
      timer = setInterval(function() {
        showSlide(current + 1);
      }, 5000);
    }

    function resetCarousel() {
      if (timer) {
        clearInterval(timer);
      }
      startCarousel();
    }

    var next = document.querySelector(".hero-next");
    var prev = document.querySelector(".hero-prev");

    if (next) {
      next.addEventListener("click", function() {
        showSlide(current + 1);
        resetCarousel();
      });
    }

    if (prev) {
      prev.addEventListener("click", function() {
        showSlide(current - 1);
        resetCarousel();
      });
    }

    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        showSlide(Number(dot.getAttribute("data-slide") || 0));
        resetCarousel();
      });
    });

    startCarousel();

    var scope = document.querySelector(".filter-scope");
    var search = document.querySelector(".movie-search");
    var chips = Array.prototype.slice.call(document.querySelectorAll(".filter-chip"));
    var activeFilter = "all";

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function filterCards() {
      if (!scope) {
        return;
      }
      var query = normalize(search ? search.value : "");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));

      cards.forEach(function(card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-type"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" "));
        var type = card.getAttribute("data-type") || "";
        var matchesText = !query || haystack.indexOf(query) !== -1;
        var matchesType = activeFilter === "all" || type === activeFilter;
        card.classList.toggle("filter-hidden", !(matchesText && matchesType));
      });
    }

    if (search) {
      search.addEventListener("input", filterCards);
    }

    chips.forEach(function(chip) {
      chip.addEventListener("click", function() {
        chips.forEach(function(item) {
          item.classList.remove("active");
        });
        chip.classList.add("active");
        activeFilter = chip.getAttribute("data-filter") || "all";
        filterCards();
      });
    });

    function startVideo(stage) {
      var video = stage.querySelector("video");
      var button = stage.querySelector(".play-overlay");

      if (!video) {
        return;
      }

      var stream = video.getAttribute("data-stream");

      if (!stream) {
        return;
      }

      if (button) {
        button.classList.add("hidden");
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        if (!video.getAttribute("src")) {
          video.setAttribute("src", stream);
        }
        video.play().catch(function() {});
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        if (!video._hlsPlayer) {
          var hls = new window.Hls();
          video._hlsPlayer = hls;
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch(function() {});
          });
          hls.on(window.Hls.Events.ERROR, function(event, data) {
            if (data && data.fatal) {
              if (button) {
                button.classList.remove("hidden");
              }
            }
          });
        } else {
          video.play().catch(function() {});
        }
        return;
      }

      if (!video.getAttribute("src")) {
        video.setAttribute("src", stream);
      }
      video.play().catch(function() {});
    }

    Array.prototype.slice.call(document.querySelectorAll(".video-stage")).forEach(function(stage) {
      var button = stage.querySelector(".play-overlay");
      var video = stage.querySelector("video");

      if (button) {
        button.addEventListener("click", function() {
          startVideo(stage);
        });
      }

      if (video) {
        video.addEventListener("click", function() {
          startVideo(stage);
        });
      }
    });
  });
})();
