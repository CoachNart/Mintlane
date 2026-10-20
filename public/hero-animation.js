(() => {
  "use strict";

  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const hero = canvas.closest(".hero");
  const DURATION = 15;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => {
    x = clamp((x - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, x) => a + (b - a) * x;
  const seededRandom = seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let layers = [];
  let raf = 0;
  let visible = true;
  let lastFrame = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timeParam = new URLSearchParams(window.location.search).get("t");
  const fixedTime = timeParam === null ? null : Number(timeParam);
  const startTime = performance.now();

  function blob(context, x, y, radius, color, alpha) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${alpha})`);
    gradient.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function buildLayers() {
    layers = [];
    const configs = [
      { count: 70, size: [0.06, 0.13], y: [0.1, 0.7], colors: [[46,70,44],[60,86,52]], alpha: 0.75, seed: 3, fronds: 0 },
      { count: 60, size: [0.08, 0.16], y: [0.2, 0.9], colors: [[30,50,31],[78,104,58],[110,134,76]], alpha: 0.8, seed: 7, fronds: 0 },
      { count: 34, size: [0.1, 0.22], y: [0.55, 1.05], colors: [[14,26,16],[26,44,26]], alpha: 0.95, seed: 11, fronds: 12 }
    ];
    const layerWidth = width * 1.12;
    const layerHeight = height * 1.12;

    configs.forEach(config => {
      const layer = document.createElement("canvas");
      layer.width = Math.ceil(layerWidth * dpr);
      layer.height = Math.ceil(layerHeight * dpr);
      const context = layer.getContext("2d");
      if (!context) return;
      context.scale(dpr, dpr);

      const random = seededRandom(config.seed);
      for (let i = 0; i < config.count; i++) {
        const color = config.colors[Math.floor(random() * config.colors.length)];
        const radius = lerp(config.size[0], config.size[1], random()) * Math.max(height, width * 0.6);
        blob(context, random() * layerWidth, lerp(config.y[0], config.y[1], random()) * layerHeight, radius, color, config.alpha);
      }

      for (let i = 0; i < config.fronds; i++) {
        const baseX = random() * layerWidth;
        const baseY = layerHeight * (0.9 + random() * 0.1);
        const length = layerHeight * (0.18 + random() * 0.2);
        const direction = random() < 0.5 ? -1 : 1;
        context.strokeStyle = "rgba(10,20,12,.95)";
        context.lineWidth = 2 + random() * 4;
        context.lineCap = "round";

        for (let k = 0; k < 7; k++) {
          const angle = -Math.PI / 2 + (k - 3) * 0.32;
          context.beginPath();
          context.moveTo(baseX, baseY);
          context.quadraticCurveTo(
            baseX + Math.cos(angle) * length * 0.6,
            baseY + Math.sin(angle) * length * 0.9,
            baseX + Math.cos(angle) * length + direction * length * 0.25,
            baseY + Math.sin(angle) * length * 0.7 + length * 0.35
          );
          context.stroke();
        }
      }
      layers.push(layer);
    });
  }

  function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#7c8d96");
    gradient.addColorStop(0.55, "#a9b4b4");
    gradient.addColorStop(1, "#8c978f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  const crown = [0.2,0.9,0.4,1,0.3,0.7,1.2,0.5,0.8,0.3,0.6];
  const debris = (() => {
    const random = seededRandom(21);
    return Array.from({ length: 28 }, () => ({
      offsetX: random(),
      velocityX: (random() - 0.5) * 0.25,
      velocityY: -(0.1 + random() * 0.35),
      rotation: (random() - 0.5) * 3,
      size: 0.008 + random() * 0.014,
      ratio: 0.5 + random() * 2,
      filled: random() < 0.4
    }));
  })();

  function drawTower(time) {
    const alpha = smooth(1, 2.2, time) * (1 - smooth(9, 10.8, time));
    if (alpha <= 0) return;

    const zoom = 1 + 2.7 * ease(clamp((time - 3.8) / 5.8));
    const centerX = width * 0.52;
    const centerY = height * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX, -centerY);

    const towerWidth = width > height ? width * 0.36 : width * 0.66;
    const towerX = width * 0.52 - towerWidth / 2;
    const baseY = height * 0.82;
    const towerHeight = height * 0.64 * ease(clamp((time - 1.4) / 2.8));
    const towerY = baseY - towerHeight;

    const ground = ctx.createLinearGradient(0, baseY - 30, 0, height * 1.4);
    ground.addColorStop(0, "rgba(150,160,150,0)");
    ground.addColorStop(0.15, "#7a8576");
    ground.addColorStop(1, "#3b4538");
    ctx.fillStyle = ground;
    ctx.fillRect(-width, baseY - 30, width * 3, height * 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(towerX, towerY, towerWidth, towerHeight);
    ctx.clip();
    ctx.fillStyle = "#dfe3e2";
    ctx.fillRect(towerX, towerY, towerWidth, towerHeight);

    const stripeCount = 14;
    const stripeWidth = towerWidth / stripeCount;
    ctx.fillStyle = "#1b2227";
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillRect(towerX + i * stripeWidth, towerY, stripeWidth * 0.55, towerHeight);
    }
    ctx.fillStyle = "rgba(0,0,0,.16)";
    for (let y = towerY; y < baseY; y += 26) ctx.fillRect(towerX, y, towerWidth, 1.5);

    const shade = ctx.createLinearGradient(towerX, 0, towerX + towerWidth, 0);
    shade.addColorStop(0, "rgba(0,0,0,.28)");
    shade.addColorStop(0.5, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,.14)");
    ctx.fillStyle = shade;
    ctx.fillRect(towerX, towerY, towerWidth, towerHeight);

    const haze = ctx.createLinearGradient(0, towerY, 0, baseY);
    haze.addColorStop(0, "rgba(170,182,182,0)");
    haze.addColorStop(0.7, "rgba(150,162,158,.1)");
    haze.addColorStop(1, "rgba(140,150,140,.65)");
    ctx.fillStyle = haze;
    ctx.fillRect(towerX, towerY, towerWidth, towerHeight);
    ctx.restore();

    const crownAlpha = smooth(3, 4, time);
    if (crownAlpha > 0) {
      ctx.globalAlpha = alpha * crownAlpha;
      ctx.fillStyle = "#2a3237";
      ctx.beginPath();
      ctx.moveTo(towerX, towerY + 8);
      crown.forEach((value, index) => ctx.lineTo(towerX + towerWidth * index / 10, towerY - value * height * 0.03));
      ctx.lineTo(towerX + towerWidth, towerY + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0f1315";
      ctx.fillRect(towerX + towerWidth * 0.18, towerY + towerHeight * 0.02, towerWidth * 0.5, towerHeight * 0.07);
      ctx.strokeStyle = "rgba(210,220,220,.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(towerX + towerWidth * 0.18, towerY + towerHeight * 0.02, towerWidth * 0.5, towerHeight * 0.07);
    }

    const debrisTime = time - 3.2;
    if (debrisTime > 0) {
      const debrisAlpha = alpha * (1 - smooth(5, 8, time));
      debris.forEach(piece => {
        const x = towerX + piece.offsetX * towerWidth + piece.velocityX * width * debrisTime * 0.4;
        const y = towerY - 4 + piece.velocityY * height * debrisTime * 0.35 + 30 * debrisTime * debrisTime;
        const pieceWidth = piece.size * height * piece.ratio;
        const pieceHeight = piece.size * height;
        ctx.save();
        ctx.globalAlpha = debrisAlpha;
        ctx.translate(x, y);
        ctx.rotate(piece.rotation * debrisTime);
        if (piece.filled) {
          ctx.fillStyle = "rgba(30,38,42,.85)";
          ctx.fillRect(-pieceWidth / 2, -pieceHeight / 2, pieceWidth, pieceHeight);
        } else {
          ctx.strokeStyle = "rgba(30,38,42,.9)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-pieceWidth / 2, -pieceHeight / 2, pieceWidth, pieceHeight);
        }
        ctx.restore();
      });
    }

    blob(ctx, towerX - towerWidth * 0.5, baseY - 10, towerWidth * 0.55, [34,58,34], 0.9);
    blob(ctx, towerX + towerWidth * 1.5, baseY - 20, towerWidth * 0.6, [40,66,38], 0.9);
    blob(ctx, towerX + towerWidth * 1.15, baseY + 6, towerWidth * 0.4, [24,44,26], 0.9);
    ctx.restore();
  }

  const shards = [
    { points: [[0,0.55],[0.3,0.38],[0.62,0.5],[0.5,1],[0,1]], direction: -1, scale: 0.9 },
    { points: [[0.35,0],[1,0],[1,0.3],[0.7,0.2]], direction: 1, scale: 0.7 },
    { points: [[0.4,0.6],[0.8,0.45],[1,0.55],[1,1],[0.45,1]], direction: 1, scale: 1.1 },
    { points: [[0,0],[0.3,0],[0.2,0.35],[0,0.3]], direction: -1, scale: 0.6 },
    { points: [[0.2,0.2],[0.55,0.1],[0.6,0.35],[0.3,0.5]], direction: -1, scale: 1.3 }
  ];

  function drawShards(time) {
    if (time > 4.2) return;
    const progress = smooth(0, 3.6, time);
    shards.forEach(shard => {
      const offsetX = shard.direction * width * 1.15 * progress * shard.scale;
      const offsetY = shard.direction * height * 0.12 * progress;
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0e1215");
      gradient.addColorStop(1, "#2b353b");
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "rgba(200,215,220,.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      shard.points.forEach(([x, y], index) => {
        const px = x * width + offsetX;
        const py = y * height + offsetY;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    ctx.fillStyle = `rgba(235,240,240,${0.55 * (1 - smooth(0.3, 1.8, time))})`;
    ctx.fillRect(width * 0.33, height * 0.3, 1.5, height * 0.7);
  }

  function drawAtrium(time) {
    const alpha = smooth(9.4, 11, time) * (1 - smooth(13.8, 14.9, time));
    if (alpha <= 0) return;

    const zoom = 1.04 + 0.12 * clamp((time - 9) / 6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(width / 2, height * 0.55);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height * 0.55);

    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#cdd3c4");
    background.addColorStop(0.25, "#7d8e78");
    background.addColorStop(0.6, "#2b3a2a");
    background.addColorStop(1, "#0a0e0b");
    ctx.fillStyle = background;
    ctx.fillRect(-width * 0.1, -height * 0.1, width * 1.2, height * 1.2);

    const sway = [3, 6, 10];
    const layerAlpha = [0.85, 0.95, 1];
    layers.forEach((layer, index) => {
      const shiftX = Math.sin(time * 0.7 + index * 1.7) * sway[index];
      const shiftY = Math.cos(time * 0.5 + index) * sway[index] * 0.4;
      ctx.globalAlpha = alpha * layerAlpha[index];
      ctx.drawImage(layer, -width * 0.06 + shiftX, -height * 0.06 + shiftY, width * 1.12, height * 1.12);
      if (index === 1) {
        drawLightShafts(time, alpha);
        drawColumns(alpha);
      }
    });
    ctx.restore();
  }

  function drawLightShafts(time, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 3; i++) {
      const x = width * (0.25 + 0.22 * i) + Math.sin(time * 0.3 + i) * width * 0.03;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(235,240,215,.28)");
      gradient.addColorStop(1, "rgba(235,240,215,0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + width * 0.05, 0);
      ctx.lineTo(x + width * 0.2, height);
      ctx.lineTo(x + width * 0.07, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawColumns(alpha) {
    ctx.globalAlpha = alpha;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const columnWidth = width * (0.016 - i * 0.002);
        const x = side < 0 ? width * (0.015 + i * 0.05) : width * (1 - 0.015 - i * 0.05) - columnWidth;
        ctx.fillStyle = "rgba(8,10,9,.95)";
        ctx.fillRect(x, -height * 0.1, columnWidth, height * 1.2);
        ctx.fillStyle = "rgba(190,205,185,.18)";
        ctx.fillRect(side < 0 ? x + columnWidth * 0.8 : x, -height * 0.1, columnWidth * 0.2, height * 1.2);
      }
    }
    const foreground = ctx.createLinearGradient(0, height * 0.8, 0, height * 1.1);
    foreground.addColorStop(0, "rgba(5,8,6,0)");
    foreground.addColorStop(1, "rgba(5,8,6,.85)");
    ctx.fillStyle = foreground;
    ctx.fillRect(-width * 0.1, height * 0.8, width * 1.2, height * 0.4);
  }

  function drawDip(time) {
    const alpha = smooth(9.2, 9.9, time) * (1 - smooth(9.9, 10.9, time));
    if (alpha <= 0) return;
    ctx.fillStyle = `rgba(6,8,10,${0.8 * alpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  function drawFog(time) {
    const alpha = (time < 2 ? 1 - smooth(0, 1.4, time) : smooth(12.6, 14.3, time)) * 0.97;
    if (alpha <= 0) return;

    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgb(216,219,208)");
    gradient.addColorStop(1, "rgb(198,203,192)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = alpha * 0.6;
    for (let i = 0; i < 3; i++) {
      const x = width * (0.2 + 0.3 * i) + Math.sin(time * 0.4 + i) * width * 0.1;
      blob(ctx, x, height * (0.35 + 0.15 * i), Math.max(width, height) * 0.45, [236,238,228], 0.8);
    }
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.75);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function render(time) {
    if (!width || !height) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, width, height);
    drawSky();
    drawTower(time);
    drawShards(time);
    drawDip(time);
    drawAtrium(time);
    drawFog(time);
    drawVignette();
    canvas.classList.add("ready");
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    buildLayers();
    if (reducedMotion || fixedTime !== null) {
      render(fixedTime !== null && Number.isFinite(fixedTime) ? clamp(fixedTime, 0, DURATION) : 6.5);
    }
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function tick(now) {
    raf = 0;
    if (reducedMotion || fixedTime !== null || !visible || document.hidden) return;
    if (now - lastFrame >= 1000 / 30) {
      render(((now - startTime) / 1000) % DURATION);
      lastFrame = now;
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (reducedMotion || fixedTime !== null || !visible || document.hidden || raf) return;
    raf = requestAnimationFrame(tick);
  }

  resize();
  if (!reducedMotion && fixedTime === null) {
    render(0);
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    window.addEventListener("resize", resize, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    start();
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }
})();
