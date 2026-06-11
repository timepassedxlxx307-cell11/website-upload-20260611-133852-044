(function() {
  var root = document.body ? document.body.getAttribute('data-root') || './' : './';

  function selectAll(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"']/g, function(mark) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '\"': '&quot;',
        "'": '&#39;'
      }[mark];
    });
  }

  var toggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function() {
      mobileNav.classList.toggle('is-open');
    });
  }

  var slides = selectAll('[data-hero-slide]');
  var dots = selectAll('[data-hero-dot]');
  var activeSlide = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach(function(slide, i) {
      slide.classList.toggle('is-active', i === activeSlide);
    });
    dots.forEach(function(dot, i) {
      dot.classList.toggle('is-active', i === activeSlide);
    });
  }

  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
    });
  });

  if (slides.length > 1) {
    setInterval(function() {
      showSlide(activeSlide + 1);
    }, 5600);
  }

  var globalSearchInput = document.querySelector('[data-site-search]');
  var globalSearchButton = document.querySelector('[data-search-button]');
  var globalSearchResults = document.querySelector('[data-search-results]');

  function renderGlobalSearch() {
    if (!globalSearchInput || !globalSearchResults || !window.MOVIE_INDEX) {
      return;
    }
    var term = globalSearchInput.value.trim().toLowerCase();
    if (!term) {
      globalSearchResults.classList.remove('is-open');
      globalSearchResults.innerHTML = '';
      return;
    }
    var results = window.MOVIE_INDEX.filter(function(item) {
      return item.text.toLowerCase().indexOf(term) !== -1;
    }).slice(0, 18);
    globalSearchResults.innerHTML = results.map(function(item) {
      return '<a class="search-result-item" href="' + root + item.url + '">' +
        '<strong>' + escapeHtml(item.title) + '</strong>' +
        '<small>' + escapeHtml(item.meta) + '</small>' +
        '</a>';
    }).join('');
    globalSearchResults.classList.add('is-open');
  }

  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', renderGlobalSearch);
  }
  if (globalSearchButton) {
    globalSearchButton.addEventListener('click', renderGlobalSearch);
  }

  var filterInput = document.querySelector('[data-filter-search]');
  var filterYear = document.querySelector('[data-filter-year]');
  var cards = selectAll('[data-movie-card]');
  var emptyState = document.querySelector('[data-empty-state]');

  function applyCardFilter() {
    if (!cards.length || (!filterInput && !filterYear)) {
      return;
    }
    var term = filterInput ? filterInput.value.trim().toLowerCase() : '';
    var year = filterYear ? filterYear.value : '';
    var visible = 0;
    cards.forEach(function(card) {
      var text = (card.getAttribute('data-search-text') || '').toLowerCase();
      var cardYear = card.getAttribute('data-year') || '';
      var matched = (!term || text.indexOf(term) !== -1) && (!year || cardYear === year);
      card.classList.toggle('is-filter-hidden', !matched);
      if (matched) {
        visible += 1;
      }
    });
    if (emptyState) {
      emptyState.classList.toggle('is-visible', visible === 0);
    }
  }

  if (filterInput) {
    filterInput.addEventListener('input', applyCardFilter);
  }
  if (filterYear) {
    filterYear.addEventListener('change', applyCardFilter);
  }
}());
