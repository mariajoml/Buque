/* =========================================================
   BUQUE — interacciones
   Motion del sistema: suave, continuo, sin flash ni giro brusco.
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav: fondo al hacer scroll ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- menú móvil ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');

  var setMenu = function (open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', function () {
    setMenu(menu.hidden);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) setMenu(false);
  });

  /* ---------- reveal al entrar en viewport ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = Number(entry.target.dataset.delay || 0) * 90;
        entry.target.style.transitionDelay = delay + 'ms';
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el) { io.observe(el); });

    /* red de seguridad: lo que ya está en pantalla al terminar de cargar
       (fuentes incluidas) se muestra aunque el observer no haya disparado */
    var revelarVisibles = function () {
      reveals.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    };
    window.addEventListener('load', revelarVisibles);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(revelarVisibles);
    }
  }

  /* ---------- link activo en la píldora ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__pill a'));
  var targets = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && targets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    targets.forEach(function (t) { spy.observe(t); });
  }

  /* ---------- contadores ---------- */
  var counters = document.querySelectorAll('[data-count]');

  var runCounter = function (el) {
    var end = Number(el.dataset.count);
    if (reduce) { el.textContent = end + '+'; return; }
    var start = performance.now();
    var dur = 1400;
    var tick = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + (p === 1 ? '+' : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- barra de progreso de lectura ---------- */
  var progreso = document.getElementById('progreso');

  /* ---------- parallax y ticker cinético ----------
     Las capas de textura animan con translate/scale (CSS);
     el parallax viaja en transform para no pisar la animación. */
  var capas = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var track = document.querySelector('.ticker__track');

  var ultimoScroll = window.scrollY;
  var desvio = 0;      /* empuje del ticker acumulado por el scroll */
  var pendiente = false;

  var pintar = function () {
    pendiente = false;
    var y = window.scrollY;
    var alto = window.innerHeight;

    if (progreso) {
      var total = document.documentElement.scrollHeight - alto;
      progreso.style.width = (total > 0 ? (y / total) * 100 : 0) + '%';
    }

    if (!reduce) {
      capas.forEach(function (capa) {
        var caja = capa.parentElement.getBoundingClientRect();
        if (caja.bottom < -200 || caja.top > alto + 200) return;
        var centro = caja.top + caja.height / 2 - alto / 2;
        capa.style.transform = 'translate3d(0,' + (-centro * Number(capa.dataset.parallax)).toFixed(1) + 'px,0)';
      });
    }
  };

  var pedirPintado = function () {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  };

  window.addEventListener('scroll', function () {
    if (!reduce && track) {
      desvio += (window.scrollY - ultimoScroll) * 1.6;
      desvio = Math.max(-260, Math.min(260, desvio));
    }
    ultimoScroll = window.scrollY;
    pedirPintado();
  }, { passive: true });

  window.addEventListener('resize', pedirPintado, { passive: true });
  pintar();

  if (!reduce && track) {
    var relajar = function () {
      desvio *= 0.92;
      if (Math.abs(desvio) < 0.4) desvio = 0;
      track.style.transform = 'translate3d(' + desvio.toFixed(1) + 'px,0,0)';
      requestAnimationFrame(relajar);
    };
    requestAnimationFrame(relajar);
  }

  /* ---------- textura-mar: olas en flujo ----------
     Recorrido contenido y ritmo lento, según las reglas
     de textura en movimiento del sistema visual.        */
  var waves = Array.prototype.slice.call(document.querySelectorAll('.sea__waves .wave'));
  var W = 1440;
  var H = 420;

  var buildPath = function (amp, phase, baseY) {
    var d = 'M0 ' + baseY;
    for (var x = 24; x <= W; x += 24) {
      var y = baseY
        + Math.sin(x / 260 + phase) * amp
        + Math.sin(x / 90 + phase * 1.7) * (amp * 0.32);
      d += ' L' + x + ' ' + y.toFixed(1);
    }
    return d;
  };

  var paintWaves = function (t) {
    waves.forEach(function (w) {
      var amp = Number(w.dataset.amp);
      var speed = Number(w.dataset.speed);
      var baseY = Number(w.dataset.y);
      w.setAttribute('d', buildPath(amp, t * speed, baseY));
    });
  };

  if (waves.length) {
    if (reduce) {
      paintWaves(0);
    } else {
      var loop = function (now) {
        paintWaves(now / 1000);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }
})();
