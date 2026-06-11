let localHlsEngine = window.Hls || null;

async function getHlsEngine() {
  if (localHlsEngine) {
    return localHlsEngine;
  }

  try {
    const module = await import('./hls-dru42stk.js');
    localHlsEngine = module.H;
    return localHlsEngine;
  } catch (error) {
    return null;
  }
}

function setupMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');

  if (!toggle) {
    return;
  }

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
  });
}

function setupBackToTop() {
  const button = document.querySelector('[data-back-to-top]');

  if (!button) {
    return;
  }

  window.addEventListener('scroll', () => {
    button.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function setupImageFallbacks() {
  document.querySelectorAll('img[data-poster]').forEach((image) => {
    image.addEventListener('error', () => {
      image.style.opacity = '0';
      const poster = image.closest('.poster, .hero-poster-panel, .detail-poster, .rank-cover');
      if (poster) {
        poster.classList.add('poster-missing');
      }
    });
  });
}

function setupHeroCarousel() {
  const hero = document.querySelector('[data-hero]');

  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  let current = 0;
  let timer = null;

  const activate = (index) => {
    current = index;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
      dot.setAttribute('aria-pressed', dotIndex === index ? 'true' : 'false');
    });
    const activeImage = slides[index]?.dataset.heroImage;
    if (activeImage) {
      hero.style.setProperty('--hero-image', `url('${activeImage}')`);
    }
  };

  const start = () => {
    timer = window.setInterval(() => {
      activate((current + 1) % slides.length);
    }, 5200);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      stop();
      activate(index);
      start();
    });
  });

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);

  if (slides.length > 0) {
    activate(0);
    start();
  }
}

function matchYearFilter(year, value) {
  const numericYear = Number(year || 0);

  if (!value) {
    return true;
  }

  if (value === '2026') {
    return numericYear >= 2026;
  }

  if (value === '2025') {
    return numericYear === 2025;
  }

  if (value === '2024') {
    return numericYear === 2024;
  }

  if (value === '2023') {
    return numericYear === 2023;
  }

  if (value === '2020') {
    return numericYear >= 2020 && numericYear <= 2022;
  }

  if (value === 'older') {
    return numericYear < 2020;
  }

  return true;
}

function setupFilters() {
  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const search = scope.querySelector('[data-search]');
    const type = scope.querySelector('[data-filter-type]');
    const year = scope.querySelector('[data-filter-year]');
    const reset = scope.querySelector('[data-reset-filter]');
    const count = scope.querySelector('[data-visible-count]');
    const section = scope.closest('main') || document;
    const cards = Array.from(section.querySelectorAll('[data-card]'));

    const update = () => {
      const keyword = (search?.value || '').trim().toLowerCase();
      const typeValue = type?.value || '';
      const yearValue = year?.value || '';
      let visible = 0;

      cards.forEach((card) => {
        const haystack = (card.dataset.title || '').toLowerCase();
        const cardType = card.dataset.type || '';
        const cardYear = card.dataset.year || '';
        const keywordMatched = !keyword || haystack.includes(keyword);
        const typeMatched = !typeValue || cardType.includes(typeValue) || haystack.includes(typeValue.toLowerCase());
        const yearMatched = matchYearFilter(cardYear, yearValue);
        const show = keywordMatched && typeMatched && yearMatched;

        card.classList.toggle('hidden-by-filter', !show);
        if (show) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = String(visible);
      }
    };

    [search, type, year].forEach((control) => {
      if (control) {
        control.addEventListener('input', update);
        control.addEventListener('change', update);
      }
    });

    if (reset) {
      reset.addEventListener('click', () => {
        if (search) {
          search.value = '';
        }
        if (type) {
          type.value = '';
        }
        if (year) {
          year.value = '';
        }
        update();
      });
    }

    update();
  });
}

function setupPlayers() {
  document.querySelectorAll('[data-player]').forEach((player) => {
    const video = player.querySelector('video');
    const startButton = player.querySelector('[data-player-start]');
    const message = player.querySelector('[data-player-message]');
    let initialized = false;
    let hlsInstance = null;

    const showMessage = (text) => {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.classList.add('is-visible');
      window.setTimeout(() => {
        message.classList.remove('is-visible');
      }, 3600);
    };

    const initialize = async () => {
      if (initialized || !video) {
        return;
      }

      const source = player.dataset.src;
      if (!source) {
        showMessage('未配置播放地址');
        return;
      }

      const HlsEngine = await getHlsEngine();

      if (HlsEngine && HlsEngine.isSupported()) {
        hlsInstance = new HlsEngine({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(HlsEngine.Events.ERROR, (_event, data) => {
          if (data && data.fatal) {
            showMessage('视频加载失败，请刷新后重试');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        showMessage('当前浏览器不支持 HLS 播放');
        return;
      }

      initialized = true;
    };

    const play = async () => {
      await initialize();
      if (!initialized || !video) {
        return;
      }

      try {
        player.classList.add('is-playing');
        video.setAttribute('controls', 'controls');
        await video.play();
      } catch (error) {
        showMessage('请再次点击播放按钮开始播放');
      }
    };

    if (startButton) {
      startButton.addEventListener('click', play);
    }

    player.addEventListener('click', (event) => {
      if (event.target === video) {
        return;
      }
      if (!player.classList.contains('is-playing')) {
        play();
      }
    });

    window.addEventListener('pagehide', () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupMenu();
  setupBackToTop();
  setupImageFallbacks();
  setupHeroCarousel();
  setupFilters();
  setupPlayers();
});
