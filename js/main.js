/* ============================================================
   ADA — MANO BROWN · SOUL TRAIN
   main.js · Navegação, lightbox, slideshow
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Hambúrguer / Drawer
     ---------------------------------------------------------- */

  var btnMenu = document.getElementById('btn-menu');
  var drawer  = document.getElementById('nav-drawer');
  var overlay = document.getElementById('nav-overlay');

  function openMenu() {
    btnMenu.classList.add('open');
    drawer.classList.add('open');
    overlay.classList.add('open');
    btnMenu.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    btnMenu.classList.remove('open');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    btnMenu.setAttribute('aria-expanded', 'false');
  }

  btnMenu.addEventListener('click', function () {
    drawer.classList.contains('open') ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  drawer.querySelectorAll('.nav-item').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  /* ----------------------------------------------------------
     Active state no nav (IntersectionObserver)
     ---------------------------------------------------------- */

  var sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-section');
        drawer.querySelectorAll('.nav-item[data-target]').forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('data-target') === id);
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  document.querySelectorAll('[data-section]').forEach(function (s) {
    sectionObserver.observe(s);
  });

  /* ----------------------------------------------------------
     Lightbox
     ---------------------------------------------------------- */

  var lightbox     = document.getElementById('lightbox');
  var lbImg        = document.getElementById('lightbox-img');
  var lbCounter    = document.getElementById('lightbox-counter');
  var lbDownload   = document.getElementById('lightbox-download');
  var btnClose     = document.getElementById('lightbox-close');
  var btnPrev      = document.getElementById('lightbox-prev');
  var btnNext      = document.getElementById('lightbox-next');

  var lbItems         = [];
  var lbIndex         = 0;
  var lbSlideshowMode = false;   // ID do slideshow que abriu, ou false

  function lbShow(src, alt, counter) {
    lbImg.src             = src;
    lbImg.alt             = alt || '';
    lbCounter.textContent = counter || '';
    if (lbDownload) { lbDownload.href = src; }
  }

  function lbOpen(src, alt, counter) {
    lbShow(src, alt, counter);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function lbClose() {
    lbSlideshowMode = false;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function lbGoto(index) {
    if (!lbItems.length) return;
    lbIndex = (index + lbItems.length) % lbItems.length;
    lbShow(lbItems[lbIndex].src, lbItems[lbIndex].alt,
           (lbIndex + 1) + ' / ' + lbItems.length);
  }

  // Abre lightbox pelo grid — coleta só o grupo do item clicado
  function lbOpenGrid(group, index) {
    lbItems = [];
    var sel = group
      ? '.scene-item[data-group="' + group + '"]'
      : '.scene-item';
    document.querySelectorAll(sel).forEach(function (el) {
      var img = el.querySelector('img');
      if (img) lbItems.push({ src: img.src, alt: img.alt });
    });
    lbSlideshowMode = false;
    lbIndex = Math.min(index, lbItems.length - 1);
    lbOpen(lbItems[lbIndex].src, lbItems[lbIndex].alt,
           (lbIndex + 1) + ' / ' + lbItems.length);
  }

  // Clique nos thumbs
  document.addEventListener('click', function (e) {
    var item = e.target.closest('.scene-item');
    if (!item) return;
    var group = item.getAttribute('data-group') || '';
    var index = parseInt(item.getAttribute('data-index'), 10);
    lbOpenGrid(group, index);
  });

  btnClose.addEventListener('click', lbClose);
  btnPrev.addEventListener('click', function () {
    if (!lbSlideshowMode) lbGoto(lbIndex - 1);
  });
  btnNext.addEventListener('click', function () {
    if (!lbSlideshowMode) lbGoto(lbIndex + 1);
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-img-wrap')) {
      lbClose();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) {
      if (e.key === 'Escape') closeMenu();
      return;
    }
    if (e.key === 'Escape')    lbClose();
    if (!lbSlideshowMode) {
      if (e.key === 'ArrowLeft')  lbGoto(lbIndex - 1);
      if (e.key === 'ArrowRight') lbGoto(lbIndex + 1);
    }
  });

  /* ----------------------------------------------------------
     Vídeos — play só quando visível
     ---------------------------------------------------------- */

  var videoObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.isIntersecting ? entry.target.play() : entry.target.pause();
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('.video-item video').forEach(function (v) {
    videoObserver.observe(v);
  });

  /* ----------------------------------------------------------
     Slideshow — crossfade duplo buffer, sem onload stale
     ---------------------------------------------------------- */

  var DURATION = 2000;

  function initSlideshow(containerId, imgAId, imgBId, srcs) {
    var container  = document.getElementById(containerId);
    var imgA       = document.getElementById(imgAId);
    var imgB       = document.getElementById(imgBId);
    if (!container || !imgA || !imgB || !srcs.length) return;

    var idx        = 0;
    var activeEl   = imgA;
    var inactiveEl = imgB;
    var pending    = false;   // evita chamadas simultâneas de doFade

    imgA.classList.add('active');

    function doFade(capturedIdx) {
      // Ignora se o índice já mudou (onload stale)
      if (capturedIdx !== idx) return;
      inactiveEl.classList.add('active');
      activeEl.classList.remove('active');
      var tmp    = activeEl;
      activeEl   = inactiveEl;
      inactiveEl = tmp;
      pending    = false;

      // Sincroniza lightbox se aberto por este slideshow
      if (lbSlideshowMode === containerId && lightbox.classList.contains('open')) {
        lbShow(srcs[idx], '', (idx + 1) + ' / ' + srcs.length);
      }
    }

    function next() {
      if (pending) return;
      idx = (idx + 1) % srcs.length;
      pending = true;

      // Limpa handlers anteriores antes de setar novo src
      inactiveEl.onload  = null;
      inactiveEl.onerror = null;

      var capturedIdx = idx;

      if (inactiveEl.src.endsWith(srcs[idx]) && inactiveEl.complete && inactiveEl.naturalWidth > 0) {
        doFade(capturedIdx);
      } else {
        inactiveEl.onload  = function () { doFade(capturedIdx); };
        inactiveEl.onerror = function () { pending = false; };
        inactiveEl.src     = srcs[idx];
      }
    }

    // Clique no container → lightbox sincronizado
    container.addEventListener('click', function () {
      lbSlideshowMode = containerId;
      lbOpen(srcs[idx], '', (idx + 1) + ' / ' + srcs.length);
    });

    setInterval(next, DURATION);
  }

  /* Instâncias */

  initSlideshow('intro-slideshow', 'slide-a', 'slide-b', [
    'assets/intro/1.png',  'assets/intro/2.png',  'assets/intro/3.png',
    'assets/intro/4.png',  'assets/intro/5.png',  'assets/intro/6.png',
    'assets/intro/7.png',  'assets/intro/8.png',  'assets/intro/9.png',
    'assets/intro/10.png', 'assets/intro/11.png', 'assets/intro/12.png',
    'assets/intro/13.png', 'assets/intro/14.jpg', 'assets/intro/15.png',
    'assets/intro/16.png', 'assets/intro/17.png', 'assets/intro/18.png'
  ]);

  initSlideshow('cena3-slideshow', 'c3-slide-a', 'c3-slide-b', [
    'assets/cena3/freepik__deep-cosmic-tunnel-on-the-z-axis-layers-of-reality__45304.png',
    'assets/cena3/freepik__deep-cosmic-tunnel-on-the-z-axis-layers-of-reality__45305.png',
    'assets/cena3/freepik__deep-cosmic-tunnel-on-the-z-axis-layers-of-reality__45306.png',
    'assets/cena3/freepik__deep-cosmic-tunnel-on-the-z-axis-layers-of-reality__45307.png',
    'assets/cena3/freepik__deep-cosmic-tunnel-on-the-z-axis-layers-of-reality__45308.png',
    'assets/cena3/freepik__deep-cosmic-tunnel-on-the-z-axis-layers-of-reality__45309.png',
    'assets/cena3/freepik__deep-cosmic-tunnel-on-the-z-axis-layers-of-reality__45310.png',
    'assets/cena3/freepik__img1-transformed-into-a-threedimensional-metallic-__45311.png',
    'assets/cena3/freepik__img1-transformed-into-a-threedimensional-metallic-__45312.png',
    'assets/cena3/freepik__img1-transformed-into-a-threedimensional-metallic-__45313.png',
    'assets/cena3/freepik__img1-transformed-into-a-threedimensional-metallic-__45314.png',
    'assets/cena3/freepik__sun-ra-afrofuturist-cosmic-environment-fused-with-__45315.png',
    'assets/cena3/freepik__sun-ra-afrofuturist-cosmic-environment-fused-with-__45316.png',
    'assets/cena3/freepik__sun-ra-afrofuturist-cosmic-environment-fused-with-__45317.png',
    'assets/cena3/freepik__sun-ra-afrofuturist-cosmic-environment-fused-with-__45318.png',
    'assets/cena3/freepik__glitch-art-collision-of-afrofuturist-cosmos-and-ge__45319.png',
    'assets/cena3/freepik__glitch-art-collision-of-afrofuturist-cosmos-and-ge__45320.png',
    'assets/cena3/freepik__glitch-art-collision-of-afrofuturist-cosmos-and-ge__45321.png',
    'assets/cena3/freepik__glitch-art-collision-of-afrofuturist-cosmos-and-ge__45322.png',
    'assets/cena3/freepik__ancient-egyptian-ankh-and-pyramid-silhouettes-diss__45323.png',
    'assets/cena3/freepik__ancient-egyptian-ankh-and-pyramid-silhouettes-diss__45324.png',
    'assets/cena3/freepik__ancient-egyptian-ankh-and-pyramid-silhouettes-diss__45325.png',
    'assets/cena3/freepik__ancient-egyptian-ankh-and-pyramid-silhouettes-diss__45326.png'
  ]);

  initSlideshow('cena2-slideshow', 'c2-slide-a', 'c2-slide-b', [
    'assets/cena2/freepik__-bold-graphic-1970s-soul-train-psychedelic-poster-__45281.png',
    'assets/cena2/freepik__bold-graphic-1970s-soul-train-psychedelic-poster-b__45286.png',
    'assets/cena2/freepik__bold-graphic-1970s-soul-train-psychedelic-poster-b__45287.png',
    'assets/cena2/freepik__bold-graphic-1970s-soul-train-psychedelic-poster-b__45288.png',
    'assets/cena2/freepik__bold-graphic-1970s-soul-train-psychedelic-poster-b__45289.png',
    'assets/cena2/freepik__img1-fixed-and-centered-in-the-foreground-treated-__45298.png',
    'assets/cena2/freepik__img1-fixed-and-centered-in-the-foreground-treated-__45299.png',
    'assets/cena2/freepik__img1-fixed-and-centered-in-the-foreground-treated-__45300.png',
    'assets/cena2/freepik__img1-fixed-and-centered-in-the-foreground-treated-__45301.png',
    'assets/cena2/freepik__img1-fixed-and-centered-in-the-foreground-treated-__45302.png',
    'assets/cena2/freepik__img1-fixed-and-centered-in-the-foreground-treated-__45303.png'
  ]);

  initSlideshow('cena1-slideshow', 'c1-slide-a', 'c1-slide-b', [
    'assets/cena1/freepik__bold-1970s-psychedelic-funk-illustration-backgroun__45268.png',
    'assets/cena1/freepik__bold-1970s-psychedelic-funk-illustration-backgroun__45269.png',
    'assets/cena1/freepik__bold-1970s-psychedelic-funk-illustration-backgroun__45271.png',
    'assets/cena1/freepik__bold-1970s-psychedelic-funk-illustration-backgroun__45272.png',
    'assets/cena1/freepik__-img1-as-the-central-element-surrounded-by-bold-19__45273.png',
    'assets/cena1/freepik__-img1-as-the-central-element-surrounded-by-bold-19__45274.png',
    'assets/cena1/freepik__-img1-as-the-central-element-surrounded-by-bold-19__45275.png',
    'assets/cena1/freepik__-img1-as-the-central-element-surrounded-by-bold-19__45276.png',
    'assets/cena1/freepik__img1-as-the-central-figure-treated-as-a-bold-1970s__45277.png'
  ]);

  /* ----------------------------------------------------------
     Fullscreen genérico — carrosséis e vídeos
     ---------------------------------------------------------- */

  function goFullscreen(el) {
    if (el.requestFullscreen)            el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
  }

  function exitFullscreen() {
    if (document.exitFullscreen)            document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
  }

  document.querySelectorAll('.cover-carousel, .block-carousel').forEach(function (el) {
    el.addEventListener('click', function () {
      if (document.fullscreenElement === el || document.webkitFullscreenElement === el) {
        exitFullscreen();
      } else {
        goFullscreen(el);
      }
    });
  });

  document.querySelectorAll('.block-video video').forEach(function (vid) {
    vid.addEventListener('click', function () {
      if (document.fullscreenElement === vid || document.webkitFullscreenElement === vid) {
        exitFullscreen();
      } else {
        goFullscreen(vid);
      }
    });
  });

  /* ----------------------------------------------------------
     Carrossel dissolve — genérico
     Funciona para .cover-carousel e .block-carousel
     ---------------------------------------------------------- */

  function initCarousel(el, interval) {
    var slides = el.querySelectorAll('.carousel-slide');
    if (slides.length < 2) return;
    var idx = 0;
    setInterval(function () {
      slides[idx].classList.remove('active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('active');
    }, interval || 4000);
  }

  /* Cover carousel */
  var coverEl = document.getElementById('cover-carousel');
  if (coverEl) initCarousel(coverEl, 4000);

  /* Block carousels */
  document.querySelectorAll('.block-carousel').forEach(function (el) {
    initCarousel(el, 2500);
  });

  /* ----------------------------------------------------------
     Imagens soltas (.block-img) — ampliar no lightbox
     ---------------------------------------------------------- */

  document.querySelectorAll('.block-img').forEach(function (img) {
    img.addEventListener('click', function () {
      lbItems = [{ src: img.src, alt: img.alt || '' }];
      lbSlideshowMode = false;
      lbIndex = 0;
      lbOpen(img.src, img.alt || '', '');
    });
  });

  /* ----------------------------------------------------------
     Grid de download — gerado automaticamente após cada carrossel
     ---------------------------------------------------------- */

  document.querySelectorAll('.block-carousel').forEach(function (carousel) {
    var slides = carousel.querySelectorAll('img.carousel-slide');
    if (!slides.length) return;

    var grid = document.createElement('div');
    grid.className = 'img-grid';

    var srcs = Array.prototype.map.call(slides, function(s) { return s.getAttribute('src'); });

    slides.forEach(function (slide, i) {
      var a = document.createElement('a');
      a.className = 'img-grid-item';
      a.href = '#';

      var img = document.createElement('img');
      img.src = slide.getAttribute('src');
      img.alt = slide.alt || '';
      img.loading = 'lazy';

      var dl = document.createElement('div');
      dl.className = 'img-grid-dl';
      dl.innerHTML = '&#8599;<span>ampliar</span>';

      a.appendChild(img);
      a.appendChild(dl);
      grid.appendChild(a);

      a.addEventListener('click', function(e) {
        e.preventDefault();
        lbItems = srcs.map(function(s) { return { src: s, alt: '' }; });
        lbSlideshowMode = false;
        lbIndex = i;
        lbOpen(lbItems[lbIndex].src, '', (lbIndex + 1) + ' / ' + lbItems.length);
      });
    });

    carousel.parentNode.insertBefore(grid, carousel.nextSibling);
  });

  /* ----------------------------------------------------------
     Carrossel manual de vídeos
     ---------------------------------------------------------- */

  document.querySelectorAll('.block-video-carousel').forEach(function (container) {
    var slides  = container.querySelectorAll('.bvc-slide');
    var btnPrev = container.querySelector('.bvc-prev');
    var btnNext = container.querySelector('.bvc-next');
    var counter = container.querySelector('.bvc-counter');
    var idx = 0;

    function goTo(n) {
      slides[idx].classList.remove('active');
      slides[idx].pause();
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('active');
      slides[idx].play();
      if (counter) counter.textContent = (idx + 1) + ' / ' + slides.length;
    }

    btnPrev.addEventListener('click', function () { goTo(idx - 1); });
    btnNext.addEventListener('click', function () { goTo(idx + 1); });
  });

})();
