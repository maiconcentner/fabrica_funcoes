/* Desenho de expressões em SVG: frações com traço, potências, raízes e parênteses do tamanho certo. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const M = (FF.math = {});

  const FONT = '"STIX Two Text", "Cambria Math", "Times New Roman", serif';
  let ctx = null;
  function measure(txt, size, italic) {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    ctx.font = (italic ? 'italic ' : '') + '500 ' + size + 'px ' + FONT;
    return ctx.measureText(txt).width;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* Caixa: { w, a (acima da linha de base), d (abaixo), draw(x, y) } */
  function text(str, size, opts) {
    opts = opts || {};
    const w = measure(str, size, opts.italic);
    return {
      w, a: size * 0.72, d: size * 0.24,
      draw(x, y) {
        const cls = opts.cls ? ' class="' + opts.cls + '"' : '';
        const st = opts.italic ? ' font-style="italic"' : '';
        return '<text x="' + r(x) + '" y="' + r(y) + '" font-size="' + r(size) + '"' + st + cls + '>' + esc(str) + '</text>';
      },
    };
  }
  function hbox(items, gap) {
    gap = gap || 0;
    const w = items.reduce((s, b) => s + b.w, 0) + gap * Math.max(0, items.length - 1);
    const a = Math.max.apply(null, items.map((b) => b.a));
    const d = Math.max.apply(null, items.map((b) => b.d));
    return {
      w, a, d,
      draw(x, y) {
        let out = '';
        let cx = x;
        items.forEach((b) => { out += b.draw(cx, y); cx += b.w + gap; });
        return out;
      },
    };
  }
  function parens(b, size) {
    const h = b.a + b.d;
    const tall = h > size * 1.25;
    if (!tall) { // parênteses comuns: usa o próprio caractere da fonte
      const l = text('(', size), rr = text(')', size);
      return hbox([l, b, rr], size * 0.02);
    }
    const pw = size * 0.34;
    return {
      w: b.w + 2 * pw, a: b.a + size * 0.06, d: b.d + size * 0.06,
      draw(x, y) {
        const top = y - this.a, bot = y + this.d;
        const mid = (top + bot) / 2;
        const sw = Math.max(1.2, size * 0.065);
        const L = 'M' + r(x + pw * 0.8) + ' ' + r(top) + ' Q' + r(x + pw * 0.05) + ' ' + r(mid) + ' ' + r(x + pw * 0.8) + ' ' + r(bot);
        const xr = x + pw + b.w;
        const R = 'M' + r(xr + pw * 0.2) + ' ' + r(top) + ' Q' + r(xr + pw * 0.95) + ' ' + r(mid) + ' ' + r(xr + pw * 0.2) + ' ' + r(bot);
        return '<path d="' + L + ' ' + R + '" fill="none" stroke="currentColor" stroke-width="' + r(sw) + '" stroke-linecap="round"/>' + b.draw(x + pw, y);
      },
    };
  }
  function frac(nb, db, size) {
    const pad = size * 0.12;
    const w = Math.max(nb.w, db.w) + 2 * pad;
    const axis = size * 0.28;
    const gap = size * 0.14;
    return {
      w, a: axis + gap + nb.d + nb.a, d: gap + db.a + db.d - axis,
      draw(x, y) {
        const by = y - axis;
        const sw = Math.max(1.2, size * 0.06);
        return '<line x1="' + r(x) + '" y1="' + r(by) + '" x2="' + r(x + w) + '" y2="' + r(by) + '" stroke="currentColor" stroke-width="' + r(sw) + '"/>' +
          nb.draw(x + (w - nb.w) / 2, by - gap - nb.d) + db.draw(x + (w - db.w) / 2, by + gap + db.a);
      },
    };
  }
  function sup(bb, eb, size) {
    const rise = size * 0.42;
    return {
      w: bb.w + eb.w + size * 0.04, a: Math.max(bb.a, rise + eb.a), d: bb.d,
      draw(x, y) { return bb.draw(x, y) + eb.draw(x + bb.w + size * 0.04, y - rise); },
    };
  }
  function root(b, size, index) {
    const rw = size * 0.62;
    const over = size * 0.14;
    return {
      w: b.w + rw + size * 0.08, a: b.a + over + size * 0.06, d: b.d,
      draw(x, y) {
        const top = y - b.a - over;
        const bot = y + b.d;
        const sw = Math.max(1.2, size * 0.06);
        const p = 'M' + r(x) + ' ' + r(y - size * 0.22) + ' L' + r(x + rw * 0.25) + ' ' + r(y - size * 0.3) + ' L' + r(x + rw * 0.55) + ' ' + r(bot) +
          ' L' + r(x + rw) + ' ' + r(top) + ' L' + r(x + rw + b.w + size * 0.08) + ' ' + r(top);
        let idx = '';
        if (index) idx = '<text x="' + r(x + rw * 0.05) + '" y="' + r(y - size * 0.42) + '" font-size="' + r(size * 0.5) + '">' + index + '</text>';
        return '<path d="' + p + '" fill="none" stroke="currentColor" stroke-width="' + r(sw) + '" stroke-linejoin="round"/>' + idx + b.draw(x + rw + size * 0.04, y);
      },
    };
  }
  function r(v) { return Math.round(v * 10) / 10; }

  const PREC = X.PREC;
  /* ctx: 'top' | 'left' | 'op' — como em FF.expr.text */
  function layout(n, size, vn, ctx, depth) {
    const sub = (m, c) => layout(m, size, vn, c, depth);
    const small = (m, c, f) => layout(m, Math.max(size * f, 9), vn, c, depth + 1);
    const op = (s) => text(s, size);
    const wrapIf = (b, cond) => (cond ? parens(b, size) : b);
    switch (n.t) {
      case 'num': {
        const cls = n.bad ? 'mx-bad' : n.fresh ? 'mx-fresh' : n.sub ? 'mx-sub' : '';
        const b = text(X.fmtNum(n.v, n.sub ? 4 : undefined), size, { cls });
        return n.v < 0 && ctx !== 'top' && ctx !== 'left' ? parens(b, size) : b;
      }
      case 'var': return text(vn, size, { italic: true });
      case 'neg': return hbox([op('−'), wrapIf(sub(n.a, 'op'), PREC[n.a.t] <= 2)]);
      case 'sqrt': return root(sub(n.a, 'top'), size);
      case 'cbrt': return root(sub(n.a, 'top'), size, '3');
      case 'add': case 'sub': {
        const l = sub(n.a, ctx === 'top' || ctx === 'left' ? 'left' : 'op');
        const rb = wrapIf(sub(n.b, 'op'), n.t === 'sub' ? PREC[n.b.t] <= 1 : PREC[n.b.t] < 1);
        return hbox([l, op(n.t === 'add' ? ' + ' : ' − '), rb]);
      }
      case 'mul': {
        const l = wrapIf(sub(n.a, ctx === 'top' || ctx === 'left' ? 'left' : 'op'), PREC[n.a.t] < 2);
        const rb = wrapIf(sub(n.b, 'op'), PREC[n.b.t] <= 2 && n.b.t !== 'pow' && n.b.t !== 'sqrt' && n.b.t !== 'div');
        return X.implicit(n) ? hbox([l, rb], size * 0.04) : hbox([l, op(' · '), rb]);
      }
      case 'div': {
        const f = depth > 0 ? 0.85 : 0.92;
        return frac(small(n.a, 'top', f), small(n.b, 'top', f), size);
      }
      case 'pow': {
        const bb = wrapIf(sub(n.a, 'op'), PREC[n.a.t] < 5);
        return sup(bb, small(n.b, 'top', 0.62), size);
      }
      case 'bad': return text('?', size);
    }
    return text('?', size);
  }

  /* Caixa pronta para posicionar dentro de outro SVG. */
  M.box = function (n, size, vn) {
    return layout(n, size, vn || 'x', 'top', 0);
  };
  /* Desenha "prefixo expressão" com o centro em (cx, cy). */
  /* "f(x) = ", "P = ", "f(3) = ": letras em itálico, o resto normal. */
  function prefixBox(prefix, size) {
    const parts = [];
    let buf = '';
    for (const ch of prefix) {
      if (/[a-zA-Z]/.test(ch)) {
        if (buf) { parts.push(text(buf, size)); buf = ''; }
        parts.push(text(ch, size, { italic: true }));
      } else buf += ch;
    }
    if (buf) parts.push(text(buf, size));
    return hbox(parts);
  }
  M.draw = function (n, size, vn, cx, cy, prefix, cls) {
    const items = [];
    if (prefix) items.push(prefixBox(prefix, size));
    items.push(M.box(n, size, vn));
    const b = hbox(items);
    const x = cx - b.w / 2;
    const y = cy + (b.a - b.d) / 2;
    return { svg: '<g class="mx' + (cls ? ' ' + cls : '') + '">' + b.draw(x, y) + '</g>', w: b.w, h: b.a + b.d };
  };
  /* SVG em linha, para usar dentro de textos e cartões. prefix pode ser HTML simples já pronto em texto. */
  M.inline = function (n, size, vn, prefix, maxW) {
    const items = [];
    if (prefix) items.push(prefixBox(prefix, size));
    items.push(M.box(n, size, vn || 'x'));
    const b = hbox(items);
    const pad = 2;
    const W = b.w + pad * 2, H = b.a + b.d + pad * 2;
    const k = maxW && W > maxW ? maxW / W : 1;
    return '<svg class="mx-inline" width="' + r(W * k) + '" height="' + r(H * k) + '" viewBox="0 0 ' + r(W) + ' ' + r(H) + '" style="vertical-align:' + r(-(b.d + pad) * k) + 'px" aria-hidden="true">' +
      b.draw(pad, pad + b.a) + '</svg>';
  };
  M.textWidth = measure;
})();
