(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function setVisible(element, visible) {
        element.hidden = !visible;
        element.setAttribute("aria-hidden", visible ? "false" : "true");
    }

    function bindMobileMenu() {
        var button = document.querySelector("[data-menu-button]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function bindHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(target) {
            if (!slides.length) {
                return;
            }
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, position) {
                var active = position === index;
                slide.classList.toggle("is-active", active);
                slide.setAttribute("aria-hidden", active ? "false" : "true");
            });
            dots.forEach(function (dot, position) {
                dot.classList.toggle("is-active", position === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
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
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function bindFilters() {
        var scope = document.querySelector("[data-filter-scope]");
        var row = document.querySelector("[data-filter-row]");
        if (!scope || !row) {
            return;
        }
        var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
        var empty = scope.querySelector("[data-empty-state]");
        row.addEventListener("click", function (event) {
            var button = event.target.closest("[data-filter]");
            if (!button) {
                return;
            }
            var value = button.getAttribute("data-filter");
            row.querySelectorAll("[data-filter]").forEach(function (item) {
                item.classList.toggle("is-active", item === button);
            });
            var shown = 0;
            cards.forEach(function (card) {
                var year = Number(card.getAttribute("data-year")) || 0;
                var type = card.getAttribute("data-type") || "";
                var visible = value === "all" || type === value || (value === "recent" && year >= 2023);
                setVisible(card, visible);
                if (visible) {
                    shown += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("is-visible", shown === 0);
            }
        });
    }

    function bindSearchPage() {
        var page = document.querySelector("[data-search-page]");
        if (!page) {
            return;
        }
        var input = page.querySelector("[data-search-input]");
        var form = page.querySelector("[data-search-form]");
        var cards = Array.prototype.slice.call(page.querySelectorAll(".movie-card"));
        var empty = page.querySelector("[data-search-empty]");
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";
        if (input) {
            input.value = initial;
        }

        function run(query) {
            var term = normalize(query);
            var shown = 0;
            cards.forEach(function (card) {
                var content = normalize(card.getAttribute("data-search") || card.textContent);
                var visible = !term || content.indexOf(term) !== -1;
                setVisible(card, visible);
                if (visible) {
                    shown += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("is-visible", shown === 0);
            }
        }

        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var query = input ? input.value : "";
                var nextUrl = new URL(window.location.href);
                if (query.trim()) {
                    nextUrl.searchParams.set("q", query.trim());
                } else {
                    nextUrl.searchParams.delete("q");
                }
                window.history.replaceState({}, "", nextUrl.toString());
                run(query);
            });
        }
        if (input) {
            input.addEventListener("input", function () {
                run(input.value);
            });
        }
        run(initial);
    }

    window.initMoviePlayer = function (url) {
        var shell = document.querySelector("[data-player-shell]");
        var video = document.querySelector("[data-player-video]");
        var button = document.querySelector("[data-player-button]");
        var message = document.querySelector("[data-player-message]");
        var hls = null;
        if (!shell || !video || !button || !url) {
            return;
        }

        function showMessage(text) {
            if (!message) {
                return;
            }
            message.textContent = text || "";
            message.classList.toggle("is-visible", Boolean(text));
        }

        function prepare() {
            if (video.getAttribute("data-ready") === "1") {
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        showMessage("视频暂时无法加载，请稍后重试。");
                        hls.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        showMessage("视频播放中断，正在恢复。");
                        hls.recoverMediaError();
                    } else {
                        showMessage("视频暂时无法播放。");
                        hls.destroy();
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
            } else {
                showMessage("视频暂时无法播放。");
            }
            video.setAttribute("data-ready", "1");
        }

        function play() {
            prepare();
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    showMessage("点击播放器即可开始观看。");
                });
            }
        }

        button.addEventListener("click", function (event) {
            event.preventDefault();
            play();
        });
        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            } else {
                video.pause();
            }
        });
        video.addEventListener("play", function () {
            shell.classList.add("is-playing");
            showMessage("");
        });
        video.addEventListener("pause", function () {
            shell.classList.remove("is-playing");
        });
        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
            }
        });
        prepare();
    };

    ready(function () {
        bindMobileMenu();
        bindHero();
        bindFilters();
        bindSearchPage();
    });
})();
