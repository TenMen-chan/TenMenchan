(() => {
  'use strict';

  function makeSegments(length, preferred) {
    const count = Math.max(1, Math.round(length / preferred));
    return { count, size: length / count };
  }

  function updateBubblePath(bubble) {
    const svg = bubble.querySelector(':scope > svg');
    const path = svg && svg.querySelector('path:not(.svg-bubble-shadow)');
    if (!svg || !path) return;

    svg.querySelectorAll('.svg-bubble-shadow, .svg-dot-shadow').forEach((element) => element.remove());
    const shape = bubble.dataset.bubbleShape || 'normal';
    const isNormal = shape === 'normal';
    const isPrickly = shape === 'prickly';
    const isSpiky = shape === 'spiky';
    const tail = bubble.dataset.cloudTail || (isNormal || isPrickly ? 'speech' : 'none');
    const tailSpace = isNormal || isPrickly ? 28 : tail === 'speech' || tail === 'thought' ? 42 : isSpiky ? 24 : 10;
    const padLeft = tailSpace;
    const padRight = 10;
    const padY = 10;
    const width = Math.ceil(bubble.offsetWidth + padLeft + padRight);
    const height = Math.ceil(bubble.offsetHeight + padY * 2);
    const edge = 12;

    if (isNormal || isPrickly) {
      const radius = 20;
      const left = padLeft + 2;
      const top = edge;
      const right = width - edge;
      const bottom = height - edge;
      const anchorY = Math.min(top + radius + 10, bottom - radius - 8);
      let d;

      if (!isPrickly) {
        d = [
          `M ${left + radius} ${top}`,
          `H ${right - radius}`,
          `Q ${right} ${top} ${right} ${top + radius}`,
          `V ${bottom - radius}`,
          `Q ${right} ${bottom} ${right - radius} ${bottom}`,
          `H ${left + radius}`,
          `Q ${left} ${bottom} ${left} ${bottom - radius}`,
          `V ${anchorY + 10}`,
          `L ${left - 18} ${anchorY}`,
          `L ${left} ${anchorY - 10}`,
          `V ${top + radius}`,
          `Q ${left} ${top} ${left + radius} ${top}`,
          'Z'
        ].join(' ');
      } else {
        const thorn = 6;
        const thornBase = 12;
        const horizontal = (from, to, y, outward) => {
          const direction = to >= from ? 1 : -1;
          const length = Math.abs(to - from);
          const count = Math.max(1, Math.ceil(length / 42));
          const size = length / count;
          const parts = [];
          for (let index = 0; index < count; index += 1) {
            const end = from + direction * size * (index + 1);
            const middle = from + direction * size * 0.5;
            if (size > 24) {
              parts.push(`L ${middle - direction * thornBase / 2} ${y}`);
              parts.push(`L ${middle} ${y + outward * thorn}`);
              parts.push(`L ${middle + direction * thornBase / 2} ${y}`);
            }
            parts.push(`L ${end} ${y}`);
          }
          return parts;
        };
        const vertical = (x, from, to, outward) => {
          const direction = to >= from ? 1 : -1;
          const length = Math.abs(to - from);
          const count = Math.max(1, Math.ceil(length / 30));
          const size = length / count;
          const parts = [];
          for (let index = 0; index < count; index += 1) {
            const end = from + direction * size * (index + 1);
            const middle = from + direction * size * 0.5;
            if (size > 16) {
              parts.push(`L ${x} ${middle - direction * thornBase / 2}`);
              parts.push(`L ${x + outward * thorn} ${middle}`);
              parts.push(`L ${x} ${middle + direction * thornBase / 2}`);
            }
            parts.push(`L ${x} ${end}`);
          }
          return parts;
        };
        const parts = [`M ${left + radius} ${top}`];
        parts.push(...horizontal(left + radius, right - radius, top, -1));
        parts.push(`Q ${right} ${top} ${right} ${top + radius}`);
        parts.push(...vertical(right, top + radius, bottom - radius, 1));
        parts.push(`Q ${right} ${bottom} ${right - radius} ${bottom}`);
        parts.push(...horizontal(right - radius, left + radius, bottom, 1));
        parts.push(`Q ${left} ${bottom} ${left} ${bottom - radius}`);
        parts.push(...vertical(left, bottom - radius, anchorY + 10, -1));
        parts.push(`L ${left - 18} ${anchorY}`);
        parts.push(`L ${left} ${anchorY - 10}`);
        parts.push(`V ${top + radius}`);
        parts.push(`Q ${left} ${top} ${left + radius} ${top}`);
        parts.push('Z');
        d = parts.join(' ');
      }

      svg.style.left = `${-padLeft}px`;
      svg.style.top = `${-padY}px`;
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.style.transform = '';
      svg.style.transformOrigin = 'center';
      const shadow = path.cloneNode(false);
      shadow.setAttribute('class', 'svg-bubble-shadow');
      shadow.setAttribute('transform', 'translate(4 5)');
      shadow.setAttribute('d', d);
      svg.insertBefore(shadow, path);
      path.setAttribute('d', d);
      return;
    }

    const corner = isSpiky ? 15 : 18;
    const depth = isSpiky ? 10 : 13;
    const left = padLeft + 2;
    const top = edge;
    const right = width - edge;
    const bottom = height - edge;
    const horizontal = makeSegments(right - left - corner * 2, 30);
    const vertical = makeSegments(bottom - top - corner * 2, isSpiky ? 28 : 26);
    let d = `M ${left + corner} ${top}`;

    for (let index = 0; index < horizontal.count; index += 1) {
      d += isSpiky
        ? ` l ${horizontal.size / 2} ${-depth} l ${horizontal.size / 2} ${depth}`
        : ` q ${horizontal.size / 2} ${-depth} ${horizontal.size} 0`;
    }
    d += isSpiky
      ? ` L ${right + depth} ${top - depth} L ${right} ${top + corner}`
      : ` Q ${right} ${top} ${right} ${top + corner}`;
    for (let index = 0; index < vertical.count; index += 1) {
      d += isSpiky
        ? ` l ${depth} ${vertical.size / 2} l ${-depth} ${vertical.size / 2}`
        : ` q ${depth} ${vertical.size / 2} 0 ${vertical.size}`;
    }
    d += isSpiky
      ? ` L ${right + depth} ${bottom + depth} L ${right - corner} ${bottom}`
      : ` Q ${right} ${bottom} ${right - corner} ${bottom}`;
    for (let index = 0; index < horizontal.count; index += 1) {
      d += isSpiky
        ? ` l ${-horizontal.size / 2} ${depth} l ${-horizontal.size / 2} ${-depth}`
        : ` q ${-horizontal.size / 2} ${depth} ${-horizontal.size} 0`;
    }
    d += isSpiky
      ? ` L ${left - depth} ${bottom + depth} L ${left} ${bottom - corner}`
      : ` Q ${left} ${bottom} ${left} ${bottom - corner}`;

    if (tail === 'speech') {
      const anchorY = Math.min(top + 32, bottom - corner - 12);
      const lowerLength = bottom - corner - (anchorY + 11);
      if (lowerLength > 0) {
        const lower = makeSegments(lowerLength, isSpiky ? 28 : 26);
        for (let index = 0; index < lower.count; index += 1) {
          d += isSpiky
            ? ` l ${-depth} ${-lower.size / 2} l ${depth} ${-lower.size / 2}`
            : ` q ${-depth} ${-lower.size / 2} 0 ${-lower.size}`;
        }
      }
      d += ` L ${left - 18} ${anchorY} L ${left} ${anchorY - 11}`;
      const upperResumeY = anchorY - 21;
      d += ` L ${left} ${upperResumeY}`;
      const upperLength = upperResumeY - (top + corner);
      if (upperLength > 0) {
        const upper = makeSegments(upperLength, isSpiky ? 28 : 26);
        for (let index = 0; index < upper.count; index += 1) {
          d += isSpiky
            ? ` l ${-depth} ${-upper.size / 2} l ${depth} ${-upper.size / 2}`
            : ` q ${-depth} ${-upper.size / 2} 0 ${-upper.size}`;
        }
      }
    } else {
      for (let index = 0; index < vertical.count; index += 1) {
        if (isSpiky) {
          const spikeDepth = index === vertical.count - 1 ? depth + 10 : depth;
          d += ` l ${-spikeDepth} ${-vertical.size / 2} l ${spikeDepth} ${-vertical.size / 2}`;
        } else {
          d += ` q ${-depth} ${-vertical.size / 2} 0 ${-vertical.size}`;
        }
      }
    }
    d += isSpiky
      ? ` L ${left - depth} ${top - depth} L ${left + corner} ${top} Z`
      : ` Q ${left} ${top} ${left + corner} ${top} Z`;

    svg.style.left = `${-padLeft}px`;
    svg.style.top = `${-padY}px`;
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.transform = '';
    svg.style.transformOrigin = 'center';
    const shadow = path.cloneNode(false);
    shadow.setAttribute('class', 'svg-bubble-shadow');
    shadow.setAttribute('transform', 'translate(4 5)');
    shadow.setAttribute('d', d);
    svg.insertBefore(shadow, path);
    path.setAttribute('d', d);

    if (!isSpiky && tail === 'thought') {
      const anchorY = Math.min(top + 32, bottom - corner - 12);
      const large = svg.querySelector('.cloud-thought-dot-large');
      const small = svg.querySelector('.cloud-thought-dot-small');
      if (!large || !small) return;
      large.setAttribute('cx', left - 18);
      large.setAttribute('cy', anchorY + 3);
      large.setAttribute('r', 7);
      small.setAttribute('cx', left - 33);
      small.setAttribute('cy', anchorY + 10);
      small.setAttribute('r', 4);
      const largeShadow = large.cloneNode(false);
      largeShadow.setAttribute('class', 'svg-dot-shadow');
      largeShadow.setAttribute('cx', left - 16);
      largeShadow.setAttribute('cy', anchorY + 5);
      const smallShadow = small.cloneNode(false);
      smallShadow.setAttribute('class', 'svg-dot-shadow');
      smallShadow.setAttribute('cx', left - 31);
      smallShadow.setAttribute('cy', anchorY + 12);
      svg.insertBefore(smallShadow, small);
      svg.insertBefore(largeShadow, large);
    }
  }

  function refresh(root = document) {
    root.querySelectorAll('.bubble-path').forEach(updateBubblePath);
  }

  function start() {
    refresh();
    requestAnimationFrame(refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => refresh());

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) updateBubblePath(entry.target);
    });
    document.querySelectorAll('.bubble-path').forEach((bubble) => observer.observe(bubble));
    window.addEventListener('resize', () => requestAnimationFrame(refresh));
  }

  window.DialogueBubbles = { refresh };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
