(function () {
  'use strict';

  // ─── Shapes ─────────────────────────────────────────────────────────────────

  const CORNER_PATH = 'M 640,337 Q 659,337 659,320 L 660,87 L 595,18 L 49,17 Q 28,17 28,34 L 29,154 L 88,215 Q 114,215 114,219 L 117,275 Q 117,295 137,315 L 179,335 Q 179,337 200,337 Z';
  const BOX_PATH    = 'M 32,13 L 486,14 L 516,56 L 515,288 Q 515,296 503,296 L 46,293 L 19,252 L 20,21 Q 20,13 32,13 Z';
  const LONG_L_PATH   = 'M 36,20 L 465,25 L 517,83 L 510,501 Q 510,510 500,510 L 202,502 L 152,447 L 152,268 Q 152,256 140,255 L 74,252 L 18,196 L 21,30 Q 21,20 36,20 Z';
  const SQUARE_PATH      = 'M 31,10 L 237,10 L 276,34 L 278,250 Q 278,256 270,256 L 55,256 L 19,233 L 16,17 Q 16,10 31,10 Z';
  const WIDE_SQUARE_PATH = 'M 62,10 L 474,10 L 552,34 L 556,250 Q 556,256 540,256 L 110,256 L 38,233 L 32,17 Q 32,10 62,10 Z';

  const SHAPES = [
    { label: 'Corner −8°',        path: CORNER_PATH,       svgW: 680, svgH: 377, skewDeg: -8 },
    { label: 'Corner',            path: CORNER_PATH,       svgW: 680, svgH: 377, skewDeg:  0 },
    { label: 'Box −8°',           path: BOX_PATH,          svgW: 562, svgH: 322, skewDeg: -8 },
    { label: 'Box',               path: BOX_PATH,          svgW: 562, svgH: 322, skewDeg:  0 },
    { label: 'Long L-shape −8°',  path: LONG_L_PATH,       svgW: 548, svgH: 530, skewDeg: -8 },
    { label: 'Long L-shape',      path: LONG_L_PATH,       svgW: 548, svgH: 530, skewDeg:  0 },
    { label: 'Square −8°',        path: SQUARE_PATH,       svgW: 296, svgH: 270, skewDeg: -8 },
    { label: 'Square',            path: SQUARE_PATH,       svgW: 296, svgH: 270, skewDeg:  0 },
    { label: 'Wide Square −8°',   path: WIDE_SQUARE_PATH,  svgW: 592, svgH: 270, skewDeg: -8 },
    { label: 'Wide Square',       path: WIDE_SQUARE_PATH,  svgW: 592, svgH: 270, skewDeg:  0 },
  ];

  // Parse SVG path commands once per shape
  function parsePath(d) {
    const cmds = [];
    const re   = /([MLQZz])\s*([-\d .,]*)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
      const cmd  = m[1].toUpperCase();
      const nums = m[2].match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      cmds.push({ cmd, nums });
    }
    return cmds;
  }

  SHAPES.forEach(s => { s.parsed = parsePath(s.path); });

  // ─── Gradients ──────────────────────────────────────────────────────────────

  const GRADIENTS = [
    { name: 'None',                            stops: null },
    { name: 'Canvas → Inspiration',            stops: ['#EDF2F5', '#E9DEFF'] },
    { name: 'Inspiration → Growth',            stops: ['#E9DEFF', '#D2FACD'] },
    { name: 'Passion → Knowledge',             stops: ['#FF3296', '#070540'] },
    { name: 'Growth → Inspiration → Passion',  stops: ['#D2FACD', '#E9DEFF', '#FF3296'] },
    { name: 'Fame → Growth',                   stops: ['#FF4600', '#D2FACD'] },
    { name: 'Growth → Passion → Fame',         stops: ['#D2FACD', '#FF3296', '#FF4600'] },
  ];

  // ─── Colors ─────────────────────────────────────────────────────────────────

  const COLORS = [
    { name: 'White',       hex: '#FFFFFF' },
    { name: 'Canvas',      hex: '#EDF2F5' },
    { name: 'Knowledge',   hex: '#070540' },
    { name: 'Passion',     hex: '#FF3296' },
    { name: 'Inspiration', hex: '#E9DEFF' },
    { name: 'Growth',      hex: '#D2FACD' },
    { name: 'Fame',        hex: '#FF4600' },
    { name: 'Black',       hex: '#000000' },
    { name: 'Transparent', hex: null      },
  ];

  // ─── State ──────────────────────────────────────────────────────────────────

  let uploadedImg      = null;
  let bgColor          = '#FFFFFF';
  let currentShape     = SHAPES[0];
  let gradientIndex    = 0;
  let gradientBlend    = 'screen';
  let gradientOpacity  = 0.8;
  let gradientReversed = false;

  // ─── DOM refs ───────────────────────────────────────────────────────────────

  let dropZone, fileInput, editorEl, dimensionsEl, shapeSelect, swatchesEl,
      frameCanvas, ctx, ratioWarn, copyBtn, dlBtn, resetBtn,
      gradientSelect, gradientOptions, blendScreenBtn, blendLightenBtn,
      gradientOpacityInput, opacityValEl, reverseCheckbox;

  // ─── Boot ───────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    dropZone     = document.getElementById('frame-drop-zone');
    fileInput    = document.getElementById('frame-file-input');
    editorEl     = document.getElementById('frame-editor');
    dimensionsEl = document.getElementById('frame-dimensions');
    shapeSelect  = document.getElementById('frame-shape-select');
    swatchesEl   = document.getElementById('frame-color-swatches');
    frameCanvas  = document.getElementById('frame-canvas');
    ctx          = frameCanvas.getContext('2d');
    ratioWarn    = document.getElementById('frame-ratio-warn');
    copyBtn      = document.getElementById('frame-copy-btn');
    dlBtn        = document.getElementById('frame-dl-btn');
    resetBtn     = document.getElementById('frame-reset-btn');
    gradientSelect     = document.getElementById('frame-gradient-select');
    gradientOptions    = document.getElementById('frame-gradient-options');
    blendScreenBtn     = document.getElementById('frame-blend-screen');
    blendLightenBtn    = document.getElementById('frame-blend-lighten');
    gradientOpacityInput = document.getElementById('frame-gradient-opacity');
    opacityValEl         = document.getElementById('frame-opacity-val');
    reverseCheckbox      = document.getElementById('frame-gradient-reverse');

    setupDropZone();
    buildShapeSelect();
    buildSwatches();
    buildGradientSelect();
    copyBtn.addEventListener('click', copyToClipboard);
    dlBtn.addEventListener('click', downloadPNG);
    resetBtn.addEventListener('click', reset);
  });

  // ─── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    uploadedImg                   = null;
    gradientIndex                 = 0;
    gradientReversed              = false;
    gradientSelect.value          = '0';
    reverseCheckbox.checked       = false;
    gradientOptions.style.display = 'none';
    ratioWarn.style.display       = 'none';
    fileInput.value               = '';
    ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
    editorEl.style.display        = 'none';
    dropZone.style.display        = '';
  }

  // ─── Drop zone ──────────────────────────────────────────────────────────────

  function setupDropZone() {
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) loadImageFile(file);
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) loadImageFile(e.target.files[0]);
    });
  }

  // ─── Shape select ───────────────────────────────────────────────────────────

  function buildShapeSelect() {
    SHAPES.forEach((shape, i) => {
      const opt   = document.createElement('option');
      const ratio = (shape.svgW / shape.svgH).toFixed(2);
      opt.value       = i;
      opt.textContent = `${shape.label} — ${ratio}:1`;
      shapeSelect.appendChild(opt);
    });

    shapeSelect.addEventListener('change', () => {
      currentShape = SHAPES[shapeSelect.value];
      if (uploadedImg) {
        checkRatio(uploadedImg.width, uploadedImg.height);
        render();
      }
    });
  }

  // ─── Color swatches ─────────────────────────────────────────────────────────

  function buildSwatches() {
    COLORS.forEach(({ name, hex }) => {
      const btn = document.createElement('button');
      btn.className = 'frame-swatch';
      btn.title = name;
      btn.type  = 'button';

      if (hex === null) {
        btn.classList.add('frame-swatch--transparent');
      } else {
        btn.style.background = hex;
      }

      if (hex === bgColor) btn.classList.add('frame-swatch--selected');

      btn.addEventListener('click', () => {
        swatchesEl.querySelectorAll('.frame-swatch').forEach(s => s.classList.remove('frame-swatch--selected'));
        btn.classList.add('frame-swatch--selected');
        bgColor = hex;
        if (uploadedImg) render();
      });

      swatchesEl.appendChild(btn);
    });
  }

  // ─── Gradient select ────────────────────────────────────────────────────────

  function buildGradientSelect() {
    GRADIENTS.forEach((g, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = g.name;
      gradientSelect.appendChild(opt);
    });

    gradientSelect.addEventListener('change', () => {
      gradientIndex = +gradientSelect.value;
      gradientOptions.style.display = gradientIndex === 0 ? 'none' : 'block';
      if (uploadedImg) render();
    });

    blendScreenBtn.addEventListener('click', () => {
      gradientBlend = 'screen';
      blendScreenBtn.classList.add('frame-blend-btn--active');
      blendLightenBtn.classList.remove('frame-blend-btn--active');
      if (uploadedImg) render();
    });

    blendLightenBtn.addEventListener('click', () => {
      gradientBlend = 'lighten';
      blendLightenBtn.classList.add('frame-blend-btn--active');
      blendScreenBtn.classList.remove('frame-blend-btn--active');
      if (uploadedImg) render();
    });

    gradientOpacityInput.addEventListener('input', () => {
      gradientOpacity = +gradientOpacityInput.value / 100;
      opacityValEl.textContent = gradientOpacityInput.value + '%';
      if (uploadedImg) render();
    });

    reverseCheckbox.addEventListener('change', () => {
      gradientReversed = reverseCheckbox.checked;
      if (uploadedImg) render();
    });
  }

  // ─── Image loading ──────────────────────────────────────────────────────────

  function aspectRatio(w, h) {
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    const d = gcd(w, h);
    const rw = w / d, rh = h / d;
    if (rw <= 50 && rh <= 50) return `${rw}:${rh}`;
    return `${(w / h).toFixed(2)}:1`;
  }

  function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        uploadedImg = img;
        dimensionsEl.textContent  = `${img.width} × ${img.height} px — ${aspectRatio(img.width, img.height)}`;
        dropZone.style.display  = 'none';
        editorEl.style.display  = 'grid';
        checkRatio(img.width, img.height);
        render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ─── Ratio check ────────────────────────────────────────────────────────────

  function checkRatio(W, H) {
    const NATIVE = currentShape.svgW / currentShape.svgH;
    const diff   = Math.abs((W / H) / NATIVE - 1);

    if (diff > 0.30) {
      const r = (W / H).toFixed(2);
      ratioWarn.textContent = `Image ratio ${r}:1 differs from the frame's native 1.80:1 — the shape will appear stretched. Best results with roughly 16:9 images.`;
      ratioWarn.style.display = 'block';
    } else {
      ratioWarn.style.display = 'none';
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  function traceLPath(c, W, H, shape) {
    const sx = W / shape.svgW;
    const sy = H / shape.svgH;
    c.beginPath();
    for (const { cmd, nums: n } of shape.parsed) {
      switch (cmd) {
        case 'M': c.moveTo(n[0] * sx, n[1] * sy); break;
        case 'L': c.lineTo(n[0] * sx, n[1] * sy); break;
        case 'Q': c.quadraticCurveTo(n[0]*sx, n[1]*sy, n[2]*sx, n[3]*sy); break;
        case 'Z': c.closePath(); break;
      }
    }
  }

  // Bounding box of shape in device space after skewY(sk) is applied.
  // Device position of a path point (px, py) = (px*sx, sk*px*sx + py*sy).
  function deviceBBox(W, H, shape, sk) {
    const sx = W / shape.svgW;
    const sy = H / shape.svgH;
    let minX =  Infinity, minY =  Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    function check(px, py) {
      const dx = px * sx;
      const dy = sk * px * sx + py * sy;
      if (dx < minX) minX = dx;
      if (dx > maxX) maxX = dx;
      if (dy < minY) minY = dy;
      if (dy > maxY) maxY = dy;
    }

    for (const { cmd, nums: n } of shape.parsed) {
      if      (cmd === 'M' || cmd === 'L') { check(n[0], n[1]); }
      else if (cmd === 'Q')                { check(n[0], n[1]); check(n[2], n[3]); }
    }
    return { minX, minY, maxX, maxY };
  }

  function render() {
    const W = uploadedImg.width;
    const H = uploadedImg.height;
    frameCanvas.width  = W;
    frameCanvas.height = H;

    // Background
    if (bgColor !== null) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }

    const sk   = Math.tan(currentShape.skewDeg * Math.PI / 180);
    const bbox = deviceBBox(W, H, currentShape, sk);

    const bboxW = bbox.maxX - bbox.minX;
    const bboxH = bbox.maxY - bbox.minY;
    // Scale down only if the shape overflows the canvas; never scale up
    const fit   = Math.min(1, W / bboxW, H / bboxH);

    const cx = (bbox.minX + bbox.maxX) / 2;
    const cy = (bbox.minY + bbox.maxY) / 2;
    const dx = W / 2 - cx * fit;
    const dy = H / 2 - cy * fit;

    // translate → scale → skewY → clip → undo skewY → undo scale → undo translate → draw image
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(fit, fit);
    if (sk !== 0) ctx.transform(1, sk, 0, 1, 0, 0);
    traceLPath(ctx, W, H, currentShape);
    ctx.clip();
    if (sk !== 0) ctx.transform(1, -sk, 0, 1, 0, 0);
    ctx.scale(1 / fit, 1 / fit);
    ctx.translate(-dx, -dy);
    ctx.drawImage(uploadedImg, 0, 0, W, H);

    // Gradient overlay — drawn inside the same clip so it only covers the image shape
    const g = GRADIENTS[gradientIndex];
    if (g.stops) {
      const stops = gradientReversed ? [...g.stops].reverse() : g.stops;
      const grad  = ctx.createLinearGradient(0, 0, 0, H);
      const step  = 1 / (stops.length - 1);
      stops.forEach((c, i) => grad.addColorStop(i * step, c));
      ctx.globalAlpha              = gradientOpacity;
      ctx.globalCompositeOperation = gradientBlend;
      ctx.fillStyle                = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha              = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }

  // ─── Export ─────────────────────────────────────────────────────────────────

  async function copyToClipboard() {
    frameCanvas.toBlob(async blob => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        flash(copyBtn, 'Copied!');
      } catch {
        flash(copyBtn, 'Failed — try download');
      }
    }, 'image/png');
  }

  function downloadPNG() {
    const d    = new Date();
    const pad  = n => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const name = `${date}-startupoulu-${frameCanvas.width}x${frameCanvas.height}.png`;
    frameCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function flash(btn, msg) {
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => (btn.textContent = orig), 2000);
  }

})();
