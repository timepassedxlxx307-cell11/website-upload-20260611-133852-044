
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');

  if (header && toggle) {
    toggle.addEventListener('click', function () {
      header.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function setSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        setSlide(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        setSlide(Number(dot.getAttribute('data-slide')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        setSlide(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setSlide(current + 1);
        restart();
      });
    }

    restart();
  }

  var filterForm = document.querySelector('[data-filter-form]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
  var empty = document.querySelector('.empty-state');

  if (filterForm && cards.length) {
    var queryInput = filterForm.querySelector('[name="q"]');
    var yearSelect = filterForm.querySelector('[name="year"]');
    var regionSelect = filterForm.querySelector('[name="region"]');
    var typeSelect = filterForm.querySelector('[name="type"]');

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function runFilter() {
      var query = normalize(queryInput && queryInput.value);
      var year = normalize(yearSelect && yearSelect.value);
      var region = normalize(regionSelect && regionSelect.value);
      var type = normalize(typeSelect && typeSelect.value);
      var shown = 0;

      cards.forEach(function (card) {
        var text = normalize(card.getAttribute('data-search'));
        var cardYear = normalize(card.getAttribute('data-year'));
        var cardRegion = normalize(card.getAttribute('data-region'));
        var cardType = normalize(card.getAttribute('data-type'));
        var ok = true;

        if (query && text.indexOf(query) === -1) {
          ok = false;
        }

        if (year && cardYear !== year) {
          ok = false;
        }

        if (region && cardRegion !== region) {
          ok = false;
        }

        if (type && cardType !== type) {
          ok = false;
        }

        card.style.display = ok ? '' : 'none';

        if (ok) {
          shown += 1;
        }
      });

      if (empty) {
        document.body.classList.toggle('has-empty', shown === 0);
      }
    }

    filterForm.addEventListener('submit', function (event) {
      event.preventDefault();
      runFilter();
    });

    [queryInput, yearSelect, regionSelect, typeSelect].forEach(function (field) {
      if (field) {
        field.addEventListener('input', runFilter);
        field.addEventListener('change', runFilter);
      }
    });

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');

    if (initialQuery && queryInput) {
      queryInput.value = initialQuery;
    }

    runFilter();
  }
})();
