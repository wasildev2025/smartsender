import { strictEqual as ve, notStrictEqual as Te } from "assert";
import { resolve as I, dirname as se, normalize as ze, relative as Me, extname as Ue, basename as De } from "path";
import { statSync as ye, readdirSync as Qe, readFileSync as oe, writeFile as Ye } from "fs";
import { format as Ee, inspect as qe } from "util";
import { fileURLToPath as Ge } from "url";
const Je = {
  right: ke,
  center: et
}, Ke = 0, V = 1, Ve = 2, H = 3;
class He {
  constructor(n) {
    var r;
    this.width = n.width, this.wrap = (r = n.wrap) !== null && r !== void 0 ? r : !0, this.rows = [];
  }
  span(...n) {
    const r = this.div(...n);
    r.span = !0;
  }
  resetOutput() {
    this.rows = [];
  }
  div(...n) {
    if (n.length === 0 && this.div(""), this.wrap && this.shouldApplyLayoutDSL(...n) && typeof n[0] == "string")
      return this.applyLayoutDSL(n[0]);
    const r = n.map((c) => typeof c == "string" ? this.colFromString(c) : c);
    return this.rows.push(r), r;
  }
  shouldApplyLayoutDSL(...n) {
    return n.length === 1 && typeof n[0] == "string" && /[\t\n]/.test(n[0]);
  }
  applyLayoutDSL(n) {
    const r = n.split(`
`).map((l) => l.split("	"));
    let c = 0;
    return r.forEach((l) => {
      l.length > 1 && j.stringWidth(l[0]) > c && (c = Math.min(Math.floor(this.width * 0.5), j.stringWidth(l[0])));
    }), r.forEach((l) => {
      this.div(...l.map((h, p) => ({
        text: h.trim(),
        padding: this.measurePadding(h),
        width: p === 0 && l.length > 1 ? c : void 0
      })));
    }), this.rows[this.rows.length - 1];
  }
  colFromString(n) {
    return {
      text: n,
      padding: this.measurePadding(n)
    };
  }
  measurePadding(n) {
    const r = j.stripAnsi(n);
    return [0, r.match(/\s*$/)[0].length, 0, r.match(/^\s*/)[0].length];
  }
  toString() {
    const n = [];
    return this.rows.forEach((r) => {
      this.rowToString(r, n);
    }), n.filter((r) => !r.hidden).map((r) => r.text).join(`
`);
  }
  rowToString(n, r) {
    return this.rasterize(n).forEach((c, l) => {
      let h = "";
      c.forEach((p, m) => {
        const { width: E } = n[m], x = this.negatePadding(n[m]);
        let w = p;
        if (x > j.stringWidth(p) && (w += " ".repeat(x - j.stringWidth(p))), n[m].align && n[m].align !== "left" && this.wrap) {
          const D = Je[n[m].align];
          w = D(w, x), j.stringWidth(w) < x && (w += " ".repeat((E || 0) - j.stringWidth(w) - 1));
        }
        const S = n[m].padding || [0, 0, 0, 0];
        S[H] && (h += " ".repeat(S[H])), h += de(n[m], w, "| "), h += w, h += de(n[m], w, " |"), S[V] && (h += " ".repeat(S[V])), l === 0 && r.length > 0 && (h = this.renderInline(h, r[r.length - 1]));
      }), r.push({
        text: h.replace(/ +$/, ""),
        span: n.span
      });
    }), r;
  }
  // if the full 'source' can render in
  // the target line, do so.
  renderInline(n, r) {
    const c = n.match(/^ */), l = c ? c[0].length : 0, h = r.text, p = j.stringWidth(h.trimRight());
    return r.span ? this.wrap ? l < p ? n : (r.hidden = !0, h.trimRight() + " ".repeat(l - p) + n.trimLeft()) : (r.hidden = !0, h + n) : n;
  }
  rasterize(n) {
    const r = [], c = this.columnWidths(n);
    let l;
    return n.forEach((h, p) => {
      h.width = c[p], this.wrap ? l = j.wrap(h.text, this.negatePadding(h), { hard: !0 }).split(`
`) : l = h.text.split(`
`), h.border && (l.unshift("." + "-".repeat(this.negatePadding(h) + 2) + "."), l.push("'" + "-".repeat(this.negatePadding(h) + 2) + "'")), h.padding && (l.unshift(...new Array(h.padding[Ke] || 0).fill("")), l.push(...new Array(h.padding[Ve] || 0).fill(""))), l.forEach((m, E) => {
        r[E] || r.push([]);
        const x = r[E];
        for (let w = 0; w < p; w++)
          x[w] === void 0 && x.push("");
        x.push(m);
      });
    }), r;
  }
  negatePadding(n) {
    let r = n.width || 0;
    return n.padding && (r -= (n.padding[H] || 0) + (n.padding[V] || 0)), n.border && (r -= 4), r;
  }
  columnWidths(n) {
    if (!this.wrap)
      return n.map((p) => p.width || j.stringWidth(p.text));
    let r = n.length, c = this.width;
    const l = n.map((p) => {
      if (p.width)
        return r--, c -= p.width, p.width;
    }), h = r ? Math.floor(c / r) : 0;
    return l.map((p, m) => p === void 0 ? Math.max(h, Ze(n[m])) : p);
  }
}
function de(o, n, r) {
  return o.border ? /[.']-+[.']/.test(n) ? "" : n.trim().length !== 0 ? r : "  " : "";
}
function Ze(o) {
  const n = o.padding || [], r = 1 + (n[H] || 0) + (n[V] || 0);
  return o.border ? r + 4 : r;
}
function Xe() {
  return typeof process == "object" && process.stdout && process.stdout.columns ? process.stdout.columns : 80;
}
function ke(o, n) {
  o = o.trim();
  const r = j.stringWidth(o);
  return r < n ? " ".repeat(n - r) + o : o;
}
function et(o, n) {
  o = o.trim();
  const r = j.stringWidth(o);
  return r >= n ? o : " ".repeat(n - r >> 1) + o;
}
let j;
function tt(o, n) {
  return j = n, new He({
    width: (o == null ? void 0 : o.width) || Xe(),
    wrap: o == null ? void 0 : o.wrap
  });
}
const Ae = new RegExp("\x1B(?:\\[(?:\\d+[ABCDEFGJKSTm]|\\d+;\\d+[Hfm]|\\d+;\\d+;\\d+m|6n|s|u|\\?25[lh])|\\w)", "g");
function Oe(o) {
  return o.replace(Ae, "");
}
function nt(o, n) {
  const [r, c] = o.match(Ae) || ["", ""];
  o = Oe(o);
  let l = "";
  for (let h = 0; h < o.length; h++)
    h !== 0 && h % n === 0 && (l += `
`), l += o.charAt(h);
  return r && c && (l = `${r}${l}${c}`), l;
}
function it(o) {
  return tt(o, {
    stringWidth: (n) => [...n].length,
    stripAnsi: Oe,
    wrap: nt
  });
}
function rt(o, n) {
  let r = I(".", o), c;
  for (ye(r).isDirectory() || (r = se(r)); ; ) {
    if (c = n(r, Qe(r)), c) return I(r, c);
    if (r = se(c = r), c === r) break;
  }
}
/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
function T(o) {
  if (o !== o.toLowerCase() && o !== o.toUpperCase() || (o = o.toLowerCase()), o.indexOf("-") === -1 && o.indexOf("_") === -1)
    return o;
  {
    let r = "", c = !1;
    const l = o.match(/^-+/);
    for (let h = l ? l[0].length : 0; h < o.length; h++) {
      let p = o.charAt(h);
      c && (c = !1, p = p.toUpperCase()), h !== 0 && (p === "-" || p === "_") ? c = !0 : p !== "-" && p !== "_" && (r += p);
    }
    return r;
  }
}
function we(o, n) {
  const r = o.toLowerCase();
  n = n || "-";
  let c = "";
  for (let l = 0; l < o.length; l++) {
    const h = r.charAt(l), p = o.charAt(l);
    h !== p && l > 0 ? c += `${n}${r.charAt(l)}` : c += p;
  }
  return c;
}
function _e(o) {
  return o == null ? !1 : typeof o == "number" || /^0x[0-9a-f]+$/i.test(o) ? !0 : /^0[^.]/.test(o) ? !1 : /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(o);
}
/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
function st(o) {
  if (Array.isArray(o))
    return o.map((p) => typeof p != "string" ? p + "" : p);
  o = o.trim();
  let n = 0, r = null, c = null, l = null;
  const h = [];
  for (let p = 0; p < o.length; p++) {
    if (r = c, c = o.charAt(p), c === " " && !l) {
      r !== " " && n++;
      continue;
    }
    c === l ? l = null : (c === "'" || c === '"') && !l && (l = c), h[n] || (h[n] = ""), h[n] += c;
  }
  return h;
}
/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
var W;
(function(o) {
  o.BOOLEAN = "boolean", o.STRING = "string", o.NUMBER = "number", o.ARRAY = "array";
})(W || (W = {}));
/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
let R;
class ot {
  constructor(n) {
    R = n;
  }
  parse(n, r) {
    const c = Object.assign({
      alias: void 0,
      array: void 0,
      boolean: void 0,
      config: void 0,
      configObjects: void 0,
      configuration: void 0,
      coerce: void 0,
      count: void 0,
      default: void 0,
      envPrefix: void 0,
      narg: void 0,
      normalize: void 0,
      string: void 0,
      number: void 0,
      __: void 0,
      key: void 0
    }, r), l = st(n), h = typeof n == "string", p = at(Object.assign(/* @__PURE__ */ Object.create(null), c.alias)), m = Object.assign({
      "boolean-negation": !0,
      "camel-case-expansion": !0,
      "combine-arrays": !1,
      "dot-notation": !0,
      "duplicate-arguments-array": !0,
      "flatten-duplicate-arrays": !0,
      "greedy-arrays": !0,
      "halt-at-non-option": !1,
      "nargs-eats-options": !1,
      "negation-prefix": "no-",
      "parse-numbers": !0,
      "parse-positional-numbers": !0,
      "populate--": !1,
      "set-placeholder-key": !1,
      "short-option-groups": !0,
      "strip-aliased": !1,
      "strip-dashed": !1,
      "unknown-options-as-args": !1
    }, c.configuration), E = Object.assign(/* @__PURE__ */ Object.create(null), c.default), x = c.configObjects || [], w = c.envPrefix, S = m["populate--"], D = S ? "--" : "_", Q = /* @__PURE__ */ Object.create(null), ae = /* @__PURE__ */ Object.create(null), $ = c.__ || R.format, a = {
      aliases: /* @__PURE__ */ Object.create(null),
      arrays: /* @__PURE__ */ Object.create(null),
      bools: /* @__PURE__ */ Object.create(null),
      strings: /* @__PURE__ */ Object.create(null),
      numbers: /* @__PURE__ */ Object.create(null),
      counts: /* @__PURE__ */ Object.create(null),
      normalize: /* @__PURE__ */ Object.create(null),
      configs: /* @__PURE__ */ Object.create(null),
      nargs: /* @__PURE__ */ Object.create(null),
      coercions: /* @__PURE__ */ Object.create(null),
      keys: []
    }, C = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/, Z = new RegExp("^--" + m["negation-prefix"] + "(.+)");
    [].concat(c.array || []).filter(Boolean).forEach(function(e) {
      const i = typeof e == "object" ? e.key : e, f = Object.keys(e).map(function(s) {
        return {
          boolean: "bools",
          string: "strings",
          number: "numbers"
        }[s];
      }).filter(Boolean).pop();
      f && (a[f][i] = !0), a.arrays[i] = !0, a.keys.push(i);
    }), [].concat(c.boolean || []).filter(Boolean).forEach(function(e) {
      a.bools[e] = !0, a.keys.push(e);
    }), [].concat(c.string || []).filter(Boolean).forEach(function(e) {
      a.strings[e] = !0, a.keys.push(e);
    }), [].concat(c.number || []).filter(Boolean).forEach(function(e) {
      a.numbers[e] = !0, a.keys.push(e);
    }), [].concat(c.count || []).filter(Boolean).forEach(function(e) {
      a.counts[e] = !0, a.keys.push(e);
    }), [].concat(c.normalize || []).filter(Boolean).forEach(function(e) {
      a.normalize[e] = !0, a.keys.push(e);
    }), typeof c.narg == "object" && Object.entries(c.narg).forEach(([e, i]) => {
      typeof i == "number" && (a.nargs[e] = i, a.keys.push(e));
    }), typeof c.coerce == "object" && Object.entries(c.coerce).forEach(([e, i]) => {
      typeof i == "function" && (a.coercions[e] = i, a.keys.push(e));
    }), typeof c.config < "u" && (Array.isArray(c.config) || typeof c.config == "string" ? [].concat(c.config).filter(Boolean).forEach(function(e) {
      a.configs[e] = !0;
    }) : typeof c.config == "object" && Object.entries(c.config).forEach(([e, i]) => {
      (typeof i == "boolean" || typeof i == "function") && (a.configs[e] = i);
    })), Fe(c.key, p, c.default, a.arrays), Object.keys(E).forEach(function(e) {
      (a.aliases[e] || []).forEach(function(i) {
        E[i] = E[e];
      });
    });
    let N = null;
    Be();
    let Y = [];
    const A = Object.assign(/* @__PURE__ */ Object.create(null), { _: [] }), ce = {};
    for (let e = 0; e < l.length; e++) {
      const i = l[e], f = i.replace(/^-{3,}/, "---");
      let s, t, d, u, g, O;
      if (i !== "--" && /^-/.test(i) && K(i))
        X(i);
      else if (f.match(/^---+(=|$)/)) {
        X(i);
        continue;
      } else if (i.match(/^--.+=/) || !m["short-option-groups"] && i.match(/^-.+=/))
        u = i.match(/^--?([^=]+)=([\s\S]*)$/), u !== null && Array.isArray(u) && u.length >= 3 && (b(u[1], a.arrays) ? e = G(e, u[1], l, u[2]) : b(u[1], a.nargs) !== !1 ? e = q(e, u[1], l, u[2]) : y(u[1], u[2], !0));
      else if (i.match(Z) && m["boolean-negation"])
        u = i.match(Z), u !== null && Array.isArray(u) && u.length >= 2 && (t = u[1], y(t, b(t, a.arrays) ? [!1] : !1));
      else if (i.match(/^--.+/) || !m["short-option-groups"] && i.match(/^-[^-]+/))
        u = i.match(/^--?(.+)/), u !== null && Array.isArray(u) && u.length >= 2 && (t = u[1], b(t, a.arrays) ? e = G(e, t, l) : b(t, a.nargs) !== !1 ? e = q(e, t, l) : (g = l[e + 1], g !== void 0 && (!g.match(/^-/) || g.match(C)) && !b(t, a.bools) && !b(t, a.counts) || /^(true|false)$/.test(g) ? (y(t, g), e++) : y(t, P(t))));
      else if (i.match(/^-.\..+=/))
        u = i.match(/^-([^=]+)=([\s\S]*)$/), u !== null && Array.isArray(u) && u.length >= 3 && y(u[1], u[2]);
      else if (i.match(/^-.\..+/) && !i.match(C))
        g = l[e + 1], u = i.match(/^-(.\..+)/), u !== null && Array.isArray(u) && u.length >= 2 && (t = u[1], g !== void 0 && !g.match(/^-/) && !b(t, a.bools) && !b(t, a.counts) ? (y(t, g), e++) : y(t, P(t)));
      else if (i.match(/^-[^-]+/) && !i.match(C)) {
        d = i.slice(1, -1).split(""), s = !1;
        for (let _ = 0; _ < d.length; _++) {
          if (g = i.slice(_ + 2), d[_ + 1] && d[_ + 1] === "=") {
            O = i.slice(_ + 3), t = d[_], b(t, a.arrays) ? e = G(e, t, l, O) : b(t, a.nargs) !== !1 ? e = q(e, t, l, O) : y(t, O), s = !0;
            break;
          }
          if (g === "-") {
            y(d[_], g);
            continue;
          }
          if (/[A-Za-z]/.test(d[_]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(g) && b(g, a.bools) === !1) {
            y(d[_], g), s = !0;
            break;
          }
          if (d[_ + 1] && d[_ + 1].match(/\W/)) {
            y(d[_], g), s = !0;
            break;
          } else
            y(d[_], P(d[_]));
        }
        t = i.slice(-1)[0], !s && t !== "-" && (b(t, a.arrays) ? e = G(e, t, l) : b(t, a.nargs) !== !1 ? e = q(e, t, l) : (g = l[e + 1], g !== void 0 && (!/^(-|--)[^-]/.test(g) || g.match(C)) && !b(t, a.bools) && !b(t, a.counts) || /^(true|false)$/.test(g) ? (y(t, g), e++) : y(t, P(t))));
      } else if (i.match(/^-[0-9]$/) && i.match(C) && b(i.slice(1), a.bools))
        t = i.slice(1), y(t, P(t));
      else if (i === "--") {
        Y = l.slice(e + 1);
        break;
      } else if (m["halt-at-non-option"]) {
        Y = l.slice(e);
        break;
      } else
        X(i);
    }
    fe(A, !0), fe(A, !1), Ne(A), Le(), ue(A, a.aliases, E, !0), We(A), m["set-placeholder-key"] && Ce(A), Object.keys(a.counts).forEach(function(e) {
      B(A, e.split(".")) || y(e, 0);
    }), S && Y.length && (A[D] = []), Y.forEach(function(e) {
      A[D].push(e);
    }), m["camel-case-expansion"] && m["strip-dashed"] && Object.keys(A).filter((e) => e !== "--" && e.includes("-")).forEach((e) => {
      delete A[e];
    }), m["strip-aliased"] && [].concat(...Object.keys(p).map((e) => p[e])).forEach((e) => {
      m["camel-case-expansion"] && e.includes("-") && delete A[e.split(".").map((i) => T(i)).join(".")], delete A[e];
    });
    function X(e) {
      const i = J("_", e);
      (typeof i == "string" || typeof i == "number") && A._.push(i);
    }
    function q(e, i, f, s) {
      let t, d = b(i, a.nargs);
      if (d = typeof d != "number" || isNaN(d) ? 1 : d, d === 0)
        return F(s) || (N = Error($("Argument unexpected for: %s", i))), y(i, P(i)), e;
      let u = F(s) ? 0 : 1;
      if (m["nargs-eats-options"])
        f.length - (e + 1) + u < d && (N = Error($("Not enough arguments following: %s", i))), u = d;
      else {
        for (t = e + 1; t < f.length && (!f[t].match(/^-[^0-9]/) || f[t].match(C) || K(f[t])); t++)
          u++;
        u < d && (N = Error($("Not enough arguments following: %s", i)));
      }
      let g = Math.min(u, d);
      for (!F(s) && g > 0 && (y(i, s), g--), t = e + 1; t < g + e + 1; t++)
        y(i, f[t]);
      return e + g;
    }
    function G(e, i, f, s) {
      let t = [], d = s || f[e + 1];
      const u = b(i, a.nargs);
      if (b(i, a.bools) && !/^(true|false)$/.test(d))
        t.push(!0);
      else if (F(d) || F(s) && /^-/.test(d) && !C.test(d) && !K(d)) {
        if (E[i] !== void 0) {
          const g = E[i];
          t = Array.isArray(g) ? g : [g];
        }
      } else {
        F(s) || t.push(k(i, s, !0));
        for (let g = e + 1; g < f.length && !(!m["greedy-arrays"] && t.length > 0 || u && typeof u == "number" && t.length >= u || (d = f[g], /^-/.test(d) && !C.test(d) && !K(d))); g++)
          e = g, t.push(k(i, d, h));
      }
      return typeof u == "number" && (u && t.length < u || isNaN(u) && t.length === 0) && (N = Error($("Not enough arguments following: %s", i))), y(i, t), e;
    }
    function y(e, i, f = h) {
      if (/-/.test(e) && m["camel-case-expansion"]) {
        const d = e.split(".").map(function(u) {
          return T(u);
        }).join(".");
        le(e, d);
      }
      const s = k(e, i, f), t = e.split(".");
      v(A, t, s), a.aliases[e] && a.aliases[e].forEach(function(d) {
        const u = d.split(".");
        v(A, u, s);
      }), t.length > 1 && m["dot-notation"] && (a.aliases[t[0]] || []).forEach(function(d) {
        let u = d.split(".");
        const g = [].concat(t);
        g.shift(), u = u.concat(g), (a.aliases[e] || []).includes(u.join(".")) || v(A, u, s);
      }), b(e, a.normalize) && !b(e, a.arrays) && [e].concat(a.aliases[e] || []).forEach(function(u) {
        Object.defineProperty(ce, u, {
          enumerable: !0,
          get() {
            return i;
          },
          set(g) {
            i = typeof g == "string" ? R.normalize(g) : g;
          }
        });
      });
    }
    function le(e, i) {
      a.aliases[e] && a.aliases[e].length || (a.aliases[e] = [i], Q[i] = !0), a.aliases[i] && a.aliases[i].length || le(i, e);
    }
    function k(e, i, f) {
      f && (i = ct(i)), (b(e, a.bools) || b(e, a.counts)) && typeof i == "string" && (i = i === "true");
      let s = Array.isArray(i) ? i.map(function(t) {
        return J(e, t);
      }) : J(e, i);
      return b(e, a.counts) && (F(s) || typeof s == "boolean") && (s = te()), b(e, a.normalize) && b(e, a.arrays) && (Array.isArray(i) ? s = i.map((t) => R.normalize(t)) : s = R.normalize(i)), s;
    }
    function J(e, i) {
      return !m["parse-positional-numbers"] && e === "_" || !b(e, a.strings) && !b(e, a.bools) && !Array.isArray(i) && (_e(i) && m["parse-numbers"] && Number.isSafeInteger(Math.floor(parseFloat(`${i}`))) || !F(i) && b(e, a.numbers)) && (i = Number(i)), i;
    }
    function Ne(e) {
      const i = /* @__PURE__ */ Object.create(null);
      ue(i, a.aliases, E), Object.keys(a.configs).forEach(function(f) {
        const s = e[f] || i[f];
        if (s)
          try {
            let t = null;
            const d = R.resolve(R.cwd(), s), u = a.configs[f];
            if (typeof u == "function") {
              try {
                t = u(d);
              } catch (g) {
                t = g;
              }
              if (t instanceof Error) {
                N = t;
                return;
              }
            } else
              t = R.require(d);
            ee(t);
          } catch (t) {
            t.name === "PermissionDenied" ? N = t : e[f] && (N = Error($("Invalid JSON config file: %s", s)));
          }
      });
    }
    function ee(e, i) {
      Object.keys(e).forEach(function(f) {
        const s = e[f], t = i ? i + "." + f : f;
        typeof s == "object" && s !== null && !Array.isArray(s) && m["dot-notation"] ? ee(s, t) : (!B(A, t.split(".")) || b(t, a.arrays) && m["combine-arrays"]) && y(t, s);
      });
    }
    function Le() {
      typeof x < "u" && x.forEach(function(e) {
        ee(e);
      });
    }
    function fe(e, i) {
      if (typeof w > "u")
        return;
      const f = typeof w == "string" ? w : "", s = R.env();
      Object.keys(s).forEach(function(t) {
        if (f === "" || t.lastIndexOf(f, 0) === 0) {
          const d = t.split("__").map(function(u, g) {
            return g === 0 && (u = u.substring(f.length)), T(u);
          });
          (i && a.configs[d.join(".")] || !i) && !B(e, d) && y(d.join("."), s[t]);
        }
      });
    }
    function We(e) {
      let i;
      const f = /* @__PURE__ */ new Set();
      Object.keys(e).forEach(function(s) {
        if (!f.has(s) && (i = b(s, a.coercions), typeof i == "function"))
          try {
            const t = J(s, i(e[s]));
            [].concat(a.aliases[s] || [], s).forEach((d) => {
              f.add(d), e[d] = t;
            });
          } catch (t) {
            N = t;
          }
      });
    }
    function Ce(e) {
      return a.keys.forEach((i) => {
        ~i.indexOf(".") || typeof e[i] > "u" && (e[i] = void 0);
      }), e;
    }
    function ue(e, i, f, s = !1) {
      Object.keys(f).forEach(function(t) {
        B(e, t.split(".")) || (v(e, t.split("."), f[t]), s && (ae[t] = !0), (i[t] || []).forEach(function(d) {
          B(e, d.split(".")) || v(e, d.split("."), f[t]);
        }));
      });
    }
    function B(e, i) {
      let f = e;
      m["dot-notation"] || (i = [i.join(".")]), i.slice(0, -1).forEach(function(t) {
        f = f[t] || {};
      });
      const s = i[i.length - 1];
      return typeof f != "object" ? !1 : s in f;
    }
    function v(e, i, f) {
      let s = e;
      m["dot-notation"] || (i = [i.join(".")]), i.slice(0, -1).forEach(function(O) {
        O = pe(O), typeof s == "object" && s[O] === void 0 && (s[O] = {}), typeof s[O] != "object" || Array.isArray(s[O]) ? (Array.isArray(s[O]) ? s[O].push({}) : s[O] = [s[O], {}], s = s[O][s[O].length - 1]) : s = s[O];
      });
      const t = pe(i[i.length - 1]), d = b(i.join("."), a.arrays), u = Array.isArray(f);
      let g = m["duplicate-arguments-array"];
      !g && b(t, a.nargs) && (g = !0, (!F(s[t]) && a.nargs[t] === 1 || Array.isArray(s[t]) && s[t].length === a.nargs[t]) && (s[t] = void 0)), f === te() ? s[t] = te(s[t]) : Array.isArray(s[t]) ? g && d && u ? s[t] = m["flatten-duplicate-arrays"] ? s[t].concat(f) : (Array.isArray(s[t][0]) ? s[t] : [s[t]]).concat([f]) : !g && !!d == !!u ? s[t] = f : s[t] = s[t].concat([f]) : s[t] === void 0 && d ? s[t] = u ? f : [f] : g && !(s[t] === void 0 || b(t, a.counts) || b(t, a.bools)) ? s[t] = [s[t], f] : s[t] = f;
    }
    function Fe(...e) {
      e.forEach(function(i) {
        Object.keys(i || {}).forEach(function(f) {
          a.aliases[f] || (a.aliases[f] = [].concat(p[f] || []), a.aliases[f].concat(f).forEach(function(s) {
            if (/-/.test(s) && m["camel-case-expansion"]) {
              const t = T(s);
              t !== f && a.aliases[f].indexOf(t) === -1 && (a.aliases[f].push(t), Q[t] = !0);
            }
          }), a.aliases[f].concat(f).forEach(function(s) {
            if (s.length > 1 && /[A-Z]/.test(s) && m["camel-case-expansion"]) {
              const t = we(s, "-");
              t !== f && a.aliases[f].indexOf(t) === -1 && (a.aliases[f].push(t), Q[t] = !0);
            }
          }), a.aliases[f].forEach(function(s) {
            a.aliases[s] = [f].concat(a.aliases[f].filter(function(t) {
              return s !== t;
            }));
          }));
        });
      });
    }
    function b(e, i) {
      const f = [].concat(a.aliases[e] || [], e), s = Object.keys(i), t = f.find((d) => s.includes(d));
      return t ? i[t] : !1;
    }
    function he(e) {
      const i = Object.keys(a);
      return [].concat(i.map((s) => a[s])).some(function(s) {
        return Array.isArray(s) ? s.includes(e) : s[e];
      });
    }
    function Re(e, ...i) {
      return [].concat(...i).some(function(s) {
        const t = e.match(s);
        return t && he(t[1]);
      });
    }
    function Se(e) {
      if (e.match(C) || !e.match(/^-[^-]+/))
        return !1;
      let i = !0, f;
      const s = e.slice(1).split("");
      for (let t = 0; t < s.length; t++) {
        if (f = e.slice(t + 2), !he(s[t])) {
          i = !1;
          break;
        }
        if (s[t + 1] && s[t + 1] === "=" || f === "-" || /[A-Za-z]/.test(s[t]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(f) || s[t + 1] && s[t + 1].match(/\W/))
          break;
      }
      return i;
    }
    function K(e) {
      return m["unknown-options-as-args"] && $e(e);
    }
    function $e(e) {
      return e = e.replace(/^-{3,}/, "--"), e.match(C) || Se(e) ? !1 : !Re(e, /^-+([^=]+?)=[\s\S]*$/, Z, /^-+([^=]+?)$/, /^-+([^=]+?)-$/, /^-+([^=]+?\d+)$/, /^-+([^=]+?)\W+.*$/);
    }
    function P(e) {
      return !b(e, a.bools) && !b(e, a.counts) && `${e}` in E ? E[e] : Pe(Ie(e));
    }
    function Pe(e) {
      return {
        [W.BOOLEAN]: !0,
        [W.STRING]: "",
        [W.NUMBER]: void 0,
        [W.ARRAY]: []
      }[e];
    }
    function Ie(e) {
      let i = W.BOOLEAN;
      return b(e, a.strings) ? i = W.STRING : b(e, a.numbers) ? i = W.NUMBER : b(e, a.bools) ? i = W.BOOLEAN : b(e, a.arrays) && (i = W.ARRAY), i;
    }
    function F(e) {
      return e === void 0;
    }
    function Be() {
      Object.keys(a.counts).find((e) => b(e, a.arrays) ? (N = Error($("Invalid configuration: %s, opts.count excludes opts.array.", e)), !0) : b(e, a.nargs) ? (N = Error($("Invalid configuration: %s, opts.count excludes opts.narg.", e)), !0) : !1);
    }
    return {
      aliases: Object.assign({}, a.aliases),
      argv: Object.assign(ce, A),
      configuration: m,
      defaulted: Object.assign({}, ae),
      error: N,
      newAliases: Object.assign({}, Q)
    };
  }
}
function at(o) {
  const n = [], r = /* @__PURE__ */ Object.create(null);
  let c = !0;
  for (Object.keys(o).forEach(function(l) {
    n.push([].concat(o[l], l));
  }); c; ) {
    c = !1;
    for (let l = 0; l < n.length; l++)
      for (let h = l + 1; h < n.length; h++)
        if (n[l].filter(function(m) {
          return n[h].indexOf(m) !== -1;
        }).length) {
          n[l] = n[l].concat(n[h]), n.splice(h, 1), c = !0;
          break;
        }
  }
  return n.forEach(function(l) {
    l = l.filter(function(p, m, E) {
      return E.indexOf(p) === m;
    });
    const h = l.pop();
    h !== void 0 && typeof h == "string" && (r[h] = l);
  }), r;
}
function te(o) {
  return o !== void 0 ? o + 1 : 1;
}
function pe(o) {
  return o === "__proto__" ? "___proto___" : o;
}
function ct(o) {
  return typeof o == "string" && (o[0] === "'" || o[0] === '"') && o[o.length - 1] === o[0] ? o.substring(1, o.length - 1) : o;
}
/**
 * @fileoverview Main entrypoint for libraries using yargs-parser in Node.js
 * CJS and ESM environments.
 *
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
var ne, ie, re;
const ge = process && process.env && process.env.YARGS_MIN_NODE_VERSION ? Number(process.env.YARGS_MIN_NODE_VERSION) : 12, me = (ie = (ne = process == null ? void 0 : process.versions) === null || ne === void 0 ? void 0 : ne.node) !== null && ie !== void 0 ? ie : (re = process == null ? void 0 : process.version) === null || re === void 0 ? void 0 : re.slice(1);
if (me && Number(me.match(/^([^.]+)/)[1]) < ge)
  throw Error(`yargs parser supports a minimum Node.js version of ${ge}. Read our version support policy: https://github.com/yargs/yargs-parser#supported-nodejs-versions`);
const lt = process ? process.env : {}, je = new ot({
  cwd: process.cwd,
  env: () => lt,
  format: Ee,
  normalize: ze,
  resolve: I,
  // TODO: figure  out a  way to combine ESM and CJS coverage, such  that
  // we can exercise all the lines below:
  require: (o) => {
    if (typeof require < "u")
      return require(o);
    if (o.match(/\.json$/))
      return JSON.parse(oe(o, "utf8"));
    throw Error("only .json config files are supported in ESM");
  }
}), U = function(n, r) {
  return je.parse(n.slice(), r).argv;
};
U.detailed = function(o, n) {
  return je.parse(o.slice(), n);
};
U.camelCase = T;
U.decamelize = we;
U.looksLikeNumber = _e;
function xe() {
  return ft() ? 0 : 1;
}
function ft() {
  return ut() && !process.defaultApp;
}
function ut() {
  return !!process.versions.electron;
}
function jt(o) {
  return o.slice(xe() + 1);
}
function ht() {
  return process.argv[xe()];
}
class z extends Error {
  constructor(n) {
    super(n || "yargs error"), this.name = "YError", Error.captureStackTrace && Error.captureStackTrace(this, z);
  }
}
const dt = {
  fs: {
    readFileSync: oe,
    writeFile: Ye
  },
  format: Ee,
  resolve: I,
  exists: (o) => {
    try {
      return ye(o).isFile();
    } catch {
      return !1;
    }
  }
};
let L;
class pt {
  constructor(n) {
    n = n || {}, this.directory = n.directory || "./locales", this.updateFiles = typeof n.updateFiles == "boolean" ? n.updateFiles : !0, this.locale = n.locale || "en", this.fallbackToLanguage = typeof n.fallbackToLanguage == "boolean" ? n.fallbackToLanguage : !0, this.cache = /* @__PURE__ */ Object.create(null), this.writeQueue = [];
  }
  __(...n) {
    if (typeof arguments[0] != "string")
      return this._taggedLiteral(arguments[0], ...arguments);
    const r = n.shift();
    let c = function() {
    };
    return typeof n[n.length - 1] == "function" && (c = n.pop()), c = c || function() {
    }, this.cache[this.locale] || this._readLocaleFile(), !this.cache[this.locale][r] && this.updateFiles ? (this.cache[this.locale][r] = r, this._enqueueWrite({
      directory: this.directory,
      locale: this.locale,
      cb: c
    })) : c(), L.format.apply(L.format, [this.cache[this.locale][r] || r].concat(n));
  }
  __n() {
    const n = Array.prototype.slice.call(arguments), r = n.shift(), c = n.shift(), l = n.shift();
    let h = function() {
    };
    typeof n[n.length - 1] == "function" && (h = n.pop()), this.cache[this.locale] || this._readLocaleFile();
    let p = l === 1 ? r : c;
    this.cache[this.locale][r] && (p = this.cache[this.locale][r][l === 1 ? "one" : "other"]), !this.cache[this.locale][r] && this.updateFiles ? (this.cache[this.locale][r] = {
      one: r,
      other: c
    }, this._enqueueWrite({
      directory: this.directory,
      locale: this.locale,
      cb: h
    })) : h();
    const m = [p];
    return ~p.indexOf("%d") && m.push(l), L.format.apply(L.format, m.concat(n));
  }
  setLocale(n) {
    this.locale = n;
  }
  getLocale() {
    return this.locale;
  }
  updateLocale(n) {
    this.cache[this.locale] || this._readLocaleFile();
    for (const r in n)
      Object.prototype.hasOwnProperty.call(n, r) && (this.cache[this.locale][r] = n[r]);
  }
  _taggedLiteral(n, ...r) {
    let c = "";
    return n.forEach(function(l, h) {
      const p = r[h + 1];
      c += l, typeof p < "u" && (c += "%s");
    }), this.__.apply(this, [c].concat([].slice.call(r, 1)));
  }
  _enqueueWrite(n) {
    this.writeQueue.push(n), this.writeQueue.length === 1 && this._processWriteQueue();
  }
  _processWriteQueue() {
    const n = this, r = this.writeQueue[0], c = r.directory, l = r.locale, h = r.cb, p = this._resolveLocaleFile(c, l), m = JSON.stringify(this.cache[l], null, 2);
    L.fs.writeFile(p, m, "utf-8", function(E) {
      n.writeQueue.shift(), n.writeQueue.length > 0 && n._processWriteQueue(), h(E);
    });
  }
  _readLocaleFile() {
    let n = {};
    const r = this._resolveLocaleFile(this.directory, this.locale);
    try {
      L.fs.readFileSync && (n = JSON.parse(L.fs.readFileSync(r, "utf-8")));
    } catch (c) {
      if (c instanceof SyntaxError && (c.message = "syntax error in " + r), c.code === "ENOENT")
        n = {};
      else
        throw c;
    }
    this.cache[this.locale] = n;
  }
  _resolveLocaleFile(n, r) {
    let c = L.resolve(n, "./", r + ".json");
    if (this.fallbackToLanguage && !this._fileExistsSync(c) && ~r.lastIndexOf("_")) {
      const l = L.resolve(n, "./", r.split("_")[0] + ".json");
      this._fileExistsSync(l) && (c = l);
    }
    return c;
  }
  _fileExistsSync(n) {
    return L.exists(n);
  }
}
function gt(o, n) {
  L = n;
  const r = new pt(o);
  return {
    __: r.__.bind(r),
    __n: r.__n.bind(r),
    setLocale: r.setLocale.bind(r),
    getLocale: r.getLocale.bind(r),
    updateLocale: r.updateLocale.bind(r),
    locale: r.locale
  };
}
const mt = (o) => gt(o, dt), bt = "require is not supported by ESM", be = "loading a directory of commands is not supported yet for ESM";
let M;
try {
  M = Ge(import.meta.url);
} catch {
  M = process.cwd();
}
const yt = M.substring(0, M.lastIndexOf("node_modules")), xt = {
  assert: {
    notStrictEqual: Te,
    strictEqual: ve
  },
  cliui: it,
  findUp: rt,
  getEnv: (o) => process.env[o],
  inspect: qe,
  getCallerFile: () => {
    throw new z(be);
  },
  getProcessArgvBin: ht,
  mainFilename: yt || process.cwd(),
  Parser: U,
  path: {
    basename: De,
    dirname: se,
    extname: Ue,
    relative: Me,
    resolve: I
  },
  process: {
    argv: () => process.argv,
    cwd: process.cwd,
    emitWarning: (o, n) => process.emitWarning(o, n),
    execPath: () => process.execPath,
    exit: process.exit,
    nextTick: process.nextTick,
    stdColumns: typeof process.stdout.columns < "u" ? process.stdout.columns : null
  },
  readFileSync: oe,
  require: () => {
    throw new z(bt);
  },
  requireDirectory: () => {
    throw new z(be);
  },
  stringWidth: (o) => [...o].length,
  y18n: mt({
    directory: I(M, "../../../locales"),
    updateFiles: !1
  })
};
export {
  z as Y,
  jt as h,
  xt as s,
  U as y
};
