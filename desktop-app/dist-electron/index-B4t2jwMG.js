import { e as mt, g as xi } from "./main-Cwyr03mT.js";
import bi from "events";
import { r as yi } from "./index-BCOBbaYR.js";
import gi from "fs";
import Ei from "path";
function wi(_, N) {
  for (var R = 0; R < N.length; R++) {
    const c = N[R];
    if (typeof c != "string" && !Array.isArray(c)) {
      for (const p in c)
        if (p !== "default" && !(p in _)) {
          const g = Object.getOwnPropertyDescriptor(c, p);
          g && Object.defineProperty(_, p, g.get ? g : {
            enumerable: !0,
            get: () => c[p]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(_, Symbol.toStringTag, { value: "Module" }));
}
var gt = {}, Et = {}, Nt, re;
function ki() {
  return re || (re = 1, Nt = bi), Nt;
}
var Pt, se;
function Ti() {
  return se || (se = 1, Pt = class {
    constructor(N) {
      if (!(N > 0) || (N - 1 & N) !== 0) throw new Error("Max size for a FixedFIFO should be a power of two");
      this.buffer = new Array(N), this.mask = N - 1, this.top = 0, this.btm = 0, this.next = null;
    }
    clear() {
      this.top = this.btm = 0, this.next = null, this.buffer.fill(void 0);
    }
    push(N) {
      return this.buffer[this.top] !== void 0 ? !1 : (this.buffer[this.top] = N, this.top = this.top + 1 & this.mask, !0);
    }
    shift() {
      const N = this.buffer[this.btm];
      if (N !== void 0)
        return this.buffer[this.btm] = void 0, this.btm = this.btm + 1 & this.mask, N;
    }
    peek() {
      return this.buffer[this.btm];
    }
    isEmpty() {
      return this.buffer[this.btm] === void 0;
    }
  }), Pt;
}
var Lt, ae;
function xe() {
  if (ae) return Lt;
  ae = 1;
  const _ = Ti();
  return Lt = class {
    constructor(R) {
      this.hwm = R || 16, this.head = new _(this.hwm), this.tail = this.head, this.length = 0;
    }
    clear() {
      this.head = this.tail, this.head.clear(), this.length = 0;
    }
    push(R) {
      if (this.length++, !this.head.push(R)) {
        const c = this.head;
        this.head = c.next = new _(2 * this.head.buffer.length), this.head.push(R);
      }
    }
    shift() {
      this.length !== 0 && this.length--;
      const R = this.tail.shift();
      if (R === void 0 && this.tail.next) {
        const c = this.tail.next;
        return this.tail.next = null, this.tail = c, this.tail.shift();
      }
      return R;
    }
    peek() {
      const R = this.tail.peek();
      return R === void 0 && this.tail.next ? this.tail.next.peek() : R;
    }
    isEmpty() {
      return this.length === 0;
    }
  }, Lt;
}
var Ot, ue;
function St() {
  if (ue) return Ot;
  ue = 1;
  function _(r) {
    return Buffer.isBuffer(r) || r instanceof Uint8Array;
  }
  function N(r) {
    return Buffer.isEncoding(r);
  }
  function R(r, s, d) {
    return Buffer.alloc(r, s, d);
  }
  function c(r) {
    return Buffer.allocUnsafe(r);
  }
  function p(r) {
    return Buffer.allocUnsafeSlow(r);
  }
  function g(r, s) {
    return Buffer.byteLength(r, s);
  }
  function k(r, s) {
    return Buffer.compare(r, s);
  }
  function D(r, s) {
    return Buffer.concat(r, s);
  }
  function A(r, s, d, B, K) {
    return a(r).copy(s, d, B, K);
  }
  function T(r, s) {
    return a(r).equals(s);
  }
  function y(r, s, d, B, K) {
    return a(r).fill(s, d, B, K);
  }
  function J(r, s, d) {
    return Buffer.from(r, s, d);
  }
  function H(r, s, d, B) {
    return a(r).includes(s, d, B);
  }
  function f(r, s, d, B) {
    return a(r).indexOf(s, d, B);
  }
  function b(r, s, d, B) {
    return a(r).lastIndexOf(s, d, B);
  }
  function S(r) {
    return a(r).swap16();
  }
  function e(r) {
    return a(r).swap32();
  }
  function n(r) {
    return a(r).swap64();
  }
  function a(r) {
    return Buffer.isBuffer(r) ? r : Buffer.from(r.buffer, r.byteOffset, r.byteLength);
  }
  function I(r, s, d, B) {
    return a(r).toString(s, d, B);
  }
  function V(r, s, d, B, K) {
    return a(r).write(s, d, B, K);
  }
  function $(r, s) {
    return a(r).readDoubleBE(s);
  }
  function C(r, s) {
    return a(r).readDoubleLE(s);
  }
  function L(r, s) {
    return a(r).readFloatBE(s);
  }
  function x(r, s) {
    return a(r).readFloatLE(s);
  }
  function o(r, s) {
    return a(r).readInt32BE(s);
  }
  function i(r, s) {
    return a(r).readInt32LE(s);
  }
  function h(r, s) {
    return a(r).readUInt32BE(s);
  }
  function m(r, s) {
    return a(r).readUInt32LE(s);
  }
  function O(r, s, d) {
    return a(r).writeDoubleBE(s, d);
  }
  function U(r, s, d) {
    return a(r).writeDoubleLE(s, d);
  }
  function M(r, s, d) {
    return a(r).writeFloatBE(s, d);
  }
  function Q(r, s, d) {
    return a(r).writeFloatLE(s, d);
  }
  function X(r, s, d) {
    return a(r).writeInt32BE(s, d);
  }
  function G(r, s, d) {
    return a(r).writeInt32LE(s, d);
  }
  function F(r, s, d) {
    return a(r).writeUInt32BE(s, d);
  }
  function E(r, s, d) {
    return a(r).writeUInt32LE(s, d);
  }
  return Ot = {
    isBuffer: _,
    isEncoding: N,
    alloc: R,
    allocUnsafe: c,
    allocUnsafeSlow: p,
    byteLength: g,
    compare: k,
    concat: D,
    copy: A,
    equals: T,
    fill: y,
    from: J,
    includes: H,
    indexOf: f,
    lastIndexOf: b,
    swap16: S,
    swap32: e,
    swap64: n,
    toBuffer: a,
    toString: I,
    write: V,
    readDoubleBE: $,
    readDoubleLE: C,
    readFloatBE: L,
    readFloatLE: x,
    readInt32BE: o,
    readInt32LE: i,
    readUInt32BE: h,
    readUInt32LE: m,
    writeDoubleBE: O,
    writeDoubleLE: U,
    writeFloatBE: M,
    writeFloatLE: Q,
    writeInt32BE: X,
    writeInt32LE: G,
    writeUInt32BE: F,
    writeUInt32LE: E
  }, Ot;
}
var Ut, oe;
function Ii() {
  if (oe) return Ut;
  oe = 1;
  const _ = St();
  return Ut = class {
    constructor(R) {
      this.encoding = R;
    }
    get remaining() {
      return 0;
    }
    decode(R) {
      return _.toString(R, this.encoding);
    }
    flush() {
      return "";
    }
  }, Ut;
}
var Ft, le;
function Ri() {
  if (le) return Ft;
  le = 1;
  const _ = St();
  Ft = class {
    constructor() {
      this._reset();
    }
    get remaining() {
      return this.bytesSeen;
    }
    decode(p) {
      if (p.byteLength === 0) return "";
      if (this.bytesNeeded === 0 && N(p, 0) === 0)
        return this.bytesSeen = R(p), _.toString(p, "utf8");
      let g = "", k = 0;
      if (this.bytesNeeded > 0) {
        for (; k < p.byteLength; ) {
          const T = p[k];
          if (T < this.lowerBoundary || T > this.upperBoundary) {
            g += "�", this._reset();
            break;
          }
          if (this.lowerBoundary = 128, this.upperBoundary = 191, this.codePoint = this.codePoint << 6 | T & 63, this.bytesSeen++, k++, this.bytesSeen === this.bytesNeeded) {
            g += String.fromCodePoint(this.codePoint), this._reset();
            break;
          }
        }
        if (this.bytesNeeded > 0) return g;
      }
      const D = N(p, k), A = p.byteLength - D;
      A > k && (g += _.toString(p, "utf8", k, A));
      for (let T = A; T < p.byteLength; T++) {
        const y = p[T];
        if (this.bytesNeeded === 0) {
          y <= 127 ? (this.bytesSeen = 0, g += String.fromCharCode(y)) : y >= 194 && y <= 223 ? (this.bytesNeeded = 2, this.bytesSeen = 1, this.codePoint = y & 31) : y >= 224 && y <= 239 ? (y === 224 ? this.lowerBoundary = 160 : y === 237 && (this.upperBoundary = 159), this.bytesNeeded = 3, this.bytesSeen = 1, this.codePoint = y & 15) : y >= 240 && y <= 244 ? (y === 240 ? this.lowerBoundary = 144 : y === 244 && (this.upperBoundary = 143), this.bytesNeeded = 4, this.bytesSeen = 1, this.codePoint = y & 7) : (this.bytesSeen = 1, g += "�");
          continue;
        }
        if (y < this.lowerBoundary || y > this.upperBoundary) {
          g += "�", T--, this._reset();
          continue;
        }
        this.lowerBoundary = 128, this.upperBoundary = 191, this.codePoint = this.codePoint << 6 | y & 63, this.bytesSeen++, this.bytesSeen === this.bytesNeeded && (g += String.fromCodePoint(this.codePoint), this._reset());
      }
      return g;
    }
    flush() {
      const p = this.bytesNeeded > 0 ? "�" : "";
      return this._reset(), p;
    }
    _reset() {
      this.codePoint = 0, this.bytesNeeded = 0, this.bytesSeen = 0, this.lowerBoundary = 128, this.upperBoundary = 191;
    }
  };
  function N(c, p) {
    const g = c.byteLength;
    if (g <= p) return 0;
    const k = Math.max(p, g - 4);
    let D = g - 1;
    for (; D > k && (c[D] & 192) === 128; ) D--;
    if (D < p) return 0;
    const A = c[D];
    let T;
    if (A <= 127) return 0;
    if (A >= 194 && A <= 223) T = 2;
    else if (A >= 224 && A <= 239) T = 3;
    else if (A >= 240 && A <= 244) T = 4;
    else return 0;
    const y = g - D;
    return y < T ? y : 0;
  }
  function R(c) {
    const p = c.byteLength;
    if (p === 0) return 0;
    const g = c[p - 1];
    if (g <= 127) return 0;
    if ((g & 192) !== 128) return 1;
    const k = Math.max(0, p - 4);
    let D = p - 2;
    for (; D >= k && (c[D] & 192) === 128; ) D--;
    if (D < 0) return 1;
    const A = c[D];
    let T;
    if (A >= 194 && A <= 223) T = 2;
    else if (A >= 224 && A <= 239) T = 3;
    else if (A >= 240 && A <= 244) T = 4;
    else return 1;
    if (p - D !== T) return 1;
    if (T >= 3) {
      const y = c[D + 1];
      if (A === 224 && y < 160 || A === 237 && y > 159 || A === 240 && y < 144 || A === 244 && y > 143) return 1;
    }
    return 0;
  }
  return Ft;
}
var vt, he;
function Di() {
  if (he) return vt;
  he = 1;
  const _ = Ii(), N = Ri();
  vt = class {
    constructor(p = "utf8") {
      switch (this.encoding = R(p), this.encoding) {
        case "utf8":
          this.decoder = new N();
          break;
        case "utf16le":
        case "base64":
          throw new Error("Unsupported encoding: " + this.encoding);
        default:
          this.decoder = new _(this.encoding);
      }
    }
    get remaining() {
      return this.decoder.remaining;
    }
    push(p) {
      return typeof p == "string" ? p : this.decoder.decode(p);
    }
    // For Node.js compatibility
    write(p) {
      return this.push(p);
    }
    end(p) {
      let g = "";
      return p && (g = this.push(p)), g += this.decoder.flush(), g;
    }
  };
  function R(c) {
    switch (c = c.toLowerCase(), c) {
      case "utf8":
      case "utf-8":
        return "utf8";
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return "utf16le";
      case "latin1":
      case "binary":
        return "latin1";
      case "base64":
      case "ascii":
      case "hex":
        return c;
      default:
        throw new Error("Unknown encoding: " + c);
    }
  }
  return vt;
}
var Bt, fe;
function be() {
  if (fe) return Bt;
  fe = 1;
  const { EventEmitter: _ } = ki(), N = new Error("Stream was destroyed"), R = new Error("Premature close"), c = xe(), p = Di(), g = typeof queueMicrotask > "u" ? (l) => mt.process.nextTick(l) : queueMicrotask, k = (1 << 29) - 1, D = 1, A = 2, T = 4, y = 8, J = k ^ D, H = k ^ A, f = 16, b = 32, S = 64, e = 128, n = 256, a = 512, I = 1024, V = 2048, $ = 4096, C = 8192, L = 16384, x = 32768, o = 65536, i = 131072, h = n | a, m = f | o, O = S | f, U = $ | e, M = n | i, Q = k ^ f, X = k ^ S, G = k ^ (S | o), F = k ^ o, E = k ^ n, r = k ^ (e | C), s = k ^ I, d = k ^ h, B = k ^ x, K = k ^ b, rt = k ^ i, lt = k ^ M, Z = 1 << 18, st = 2 << 18, z = 4 << 18, j = 8 << 18, Y = 16 << 18, et = 32 << 18, kt = 64 << 18, ht = 128 << 18, Tt = 256 << 18, at = 512 << 18, xt = 1024 << 18, Ee = k ^ (Z | Tt), Ct = k ^ z, we = k ^ (Z | at), ke = k ^ Y, Te = k ^ j, Mt = k ^ ht, Ie = k ^ st, zt = k ^ xt, ct = f | Z, Gt = k ^ ct, It = L | et, it = T | y | A, tt = it | D, Ht = it | It, Re = Ct & X, bt = ht | x, De = bt & Gt, jt = tt | De, Ae = tt | I | L, Vt = tt | L | e, Ne = tt | I | e, Pe = tt | $ | e | C, Le = tt | f | I | L | o | i, Oe = it | I | L, Ue = b | tt | x | S, Fe = x | D, ve = tt | at | et, Be = j | Y, Yt = j | Z, We = j | Y | tt | Z, Kt = tt | Z | j | xt, qe = z | Z, Ce = Z | Tt, Me = tt | at | Yt | et, ze = Y | it | at | et, Ge = st | tt | ht | z, He = at | et | it, yt = Symbol.asyncIterator || Symbol("asyncIterator");
  class $t {
    constructor(t, { highWaterMark: u = 16384, map: w = null, mapWritable: P, byteLength: q, byteLengthWritable: W } = {}) {
      this.stream = t, this.queue = new c(), this.highWaterMark = u, this.buffered = 0, this.error = null, this.pipeline = null, this.drains = null, this.byteLength = W || q || ie, this.map = P || w, this.afterWrite = Qe.bind(this), this.afterUpdateNextTick = Je.bind(this);
    }
    get ending() {
      return (this.stream._duplexState & at) !== 0;
    }
    get ended() {
      return (this.stream._duplexState & et) !== 0;
    }
    push(t) {
      return (this.stream._duplexState & He) !== 0 ? !1 : (this.map !== null && (t = this.map(t)), this.buffered += this.byteLength(t), this.queue.push(t), this.buffered < this.highWaterMark ? (this.stream._duplexState |= j, !0) : (this.stream._duplexState |= Be, !1));
    }
    shift() {
      const t = this.queue.shift();
      return this.buffered -= this.byteLength(t), this.buffered === 0 && (this.stream._duplexState &= Te), t;
    }
    end(t) {
      typeof t == "function" ? this.stream.once("finish", t) : t != null && this.push(t), this.stream._duplexState = (this.stream._duplexState | at) & Ct;
    }
    autoBatch(t, u) {
      const w = [], P = this.stream;
      for (w.push(t); (P._duplexState & Kt) === Yt; )
        w.push(P._writableState.shift());
      if ((P._duplexState & tt) !== 0) return u(null);
      P._writev(w, u);
    }
    update() {
      const t = this.stream;
      t._duplexState |= st;
      do {
        for (; (t._duplexState & Kt) === j; ) {
          const u = this.shift();
          t._duplexState |= Ce, t._write(u, this.afterWrite);
        }
        (t._duplexState & qe) === 0 && this.updateNonPrimary();
      } while (this.continueUpdate() === !0);
      t._duplexState &= Ie;
    }
    updateNonPrimary() {
      const t = this.stream;
      if ((t._duplexState & Me) === at) {
        t._duplexState = t._duplexState | Z, t._final($e.bind(this));
        return;
      }
      if ((t._duplexState & it) === T) {
        (t._duplexState & bt) === 0 && (t._duplexState |= ct, t._destroy(Qt.bind(this)));
        return;
      }
      (t._duplexState & jt) === D && (t._duplexState = (t._duplexState | ct) & J, t._open(Xt.bind(this)));
    }
    continueUpdate() {
      return (this.stream._duplexState & ht) === 0 ? !1 : (this.stream._duplexState &= Mt, !0);
    }
    updateCallback() {
      (this.stream._duplexState & Ge) === z ? this.update() : this.updateNextTick();
    }
    updateNextTick() {
      (this.stream._duplexState & ht) === 0 && (this.stream._duplexState |= ht, (this.stream._duplexState & st) === 0 && g(this.afterUpdateNextTick));
    }
  }
  class je {
    constructor(t, { highWaterMark: u = 16384, map: w = null, mapReadable: P, byteLength: q, byteLengthReadable: W } = {}) {
      this.stream = t, this.queue = new c(), this.highWaterMark = u === 0 ? 1 : u, this.buffered = 0, this.readAhead = u > 0, this.error = null, this.pipeline = null, this.byteLength = W || q || ie, this.map = P || w, this.pipeTo = null, this.afterRead = Xe.bind(this), this.afterUpdateNextTick = Ze.bind(this);
    }
    get ending() {
      return (this.stream._duplexState & I) !== 0;
    }
    get ended() {
      return (this.stream._duplexState & L) !== 0;
    }
    pipe(t, u) {
      if (this.pipeTo !== null) throw new Error("Can only pipe to one destination");
      if (typeof u != "function" && (u = null), this.stream._duplexState |= a, this.pipeTo = t, this.pipeline = new Ye(this.stream, t, u), u && this.stream.on("error", ne), _t(t))
        t._writableState.pipeline = this.pipeline, u && t.on("error", ne), t.on("finish", this.pipeline.finished.bind(this.pipeline));
      else {
        const w = this.pipeline.done.bind(this.pipeline, t), P = this.pipeline.done.bind(this.pipeline, t, null);
        t.on("error", w), t.on("close", P), t.on("finish", this.pipeline.finished.bind(this.pipeline));
      }
      t.on("drain", Ke.bind(this)), this.stream.emit("piping", t), t.emit("pipe", this.stream);
    }
    push(t) {
      const u = this.stream;
      return t === null ? (this.highWaterMark = 0, u._duplexState = (u._duplexState | I) & G, !1) : this.map !== null && (t = this.map(t), t === null) ? (u._duplexState &= F, this.buffered < this.highWaterMark) : (this.buffered += this.byteLength(t), this.queue.push(t), u._duplexState = (u._duplexState | e) & F, this.buffered < this.highWaterMark);
    }
    shift() {
      const t = this.queue.shift();
      return this.buffered -= this.byteLength(t), this.buffered === 0 && (this.stream._duplexState &= r), t;
    }
    unshift(t) {
      const u = [this.map !== null ? this.map(t) : t];
      for (; this.buffered > 0; ) u.push(this.shift());
      for (let w = 0; w < u.length - 1; w++) {
        const P = u[w];
        this.buffered += this.byteLength(P), this.queue.push(P);
      }
      this.push(u[u.length - 1]);
    }
    read() {
      const t = this.stream;
      if ((t._duplexState & Vt) === e) {
        const u = this.shift();
        return this.pipeTo !== null && this.pipeTo.write(u) === !1 && (t._duplexState &= d), (t._duplexState & V) !== 0 && t.emit("data", u), u;
      }
      return this.readAhead === !1 && (t._duplexState |= i, this.updateNextTick()), null;
    }
    drain() {
      const t = this.stream;
      for (; (t._duplexState & Vt) === e && (t._duplexState & h) !== 0; ) {
        const u = this.shift();
        this.pipeTo !== null && this.pipeTo.write(u) === !1 && (t._duplexState &= d), (t._duplexState & V) !== 0 && t.emit("data", u);
      }
    }
    update() {
      const t = this.stream;
      t._duplexState |= b;
      do {
        for (this.drain(); this.buffered < this.highWaterMark && (t._duplexState & Le) === i; )
          t._duplexState |= m, t._read(this.afterRead), this.drain();
        (t._duplexState & Pe) === U && (t._duplexState |= C, t.emit("readable")), (t._duplexState & O) === 0 && this.updateNonPrimary();
      } while (this.continueUpdate() === !0);
      t._duplexState &= K;
    }
    updateNonPrimary() {
      const t = this.stream;
      if ((t._duplexState & Ne) === I && (t._duplexState = (t._duplexState | L) & s, t.emit("end"), (t._duplexState & Ht) === It && (t._duplexState |= T), this.pipeTo !== null && this.pipeTo.end()), (t._duplexState & it) === T) {
        (t._duplexState & bt) === 0 && (t._duplexState |= ct, t._destroy(Qt.bind(this)));
        return;
      }
      (t._duplexState & jt) === D && (t._duplexState = (t._duplexState | ct) & J, t._open(Xt.bind(this)));
    }
    continueUpdate() {
      return (this.stream._duplexState & x) === 0 ? !1 : (this.stream._duplexState &= B, !0);
    }
    updateCallback() {
      (this.stream._duplexState & Ue) === S ? this.update() : this.updateNextTick();
    }
    updateNextTickIfOpen() {
      (this.stream._duplexState & Fe) === 0 && (this.stream._duplexState |= x, (this.stream._duplexState & b) === 0 && g(this.afterUpdateNextTick));
    }
    updateNextTick() {
      (this.stream._duplexState & x) === 0 && (this.stream._duplexState |= x, (this.stream._duplexState & b) === 0 && g(this.afterUpdateNextTick));
    }
  }
  class Ve {
    constructor(t) {
      this.data = null, this.afterTransform = ei.bind(t), this.afterFinal = null;
    }
  }
  class Ye {
    constructor(t, u, w) {
      this.from = t, this.to = u, this.afterPipe = w, this.error = null, this.pipeToFinished = !1;
    }
    finished() {
      this.pipeToFinished = !0;
    }
    done(t, u) {
      if (u && (this.error = u), t === this.to && (this.to = null, this.from !== null)) {
        ((this.from._duplexState & L) === 0 || !this.pipeToFinished) && this.from.destroy(this.error || new Error("Writable stream closed prematurely"));
        return;
      }
      if (t === this.from && (this.from = null, this.to !== null)) {
        (t._duplexState & L) === 0 && this.to.destroy(this.error || new Error("Readable stream closed before ending"));
        return;
      }
      this.afterPipe !== null && this.afterPipe(this.error), this.to = this.from = this.afterPipe = null;
    }
  }
  function Ke() {
    this.stream._duplexState |= a, this.updateCallback();
  }
  function $e(l) {
    const t = this.stream;
    l && t.destroy(l), (t._duplexState & it) === 0 && (t._duplexState |= et, t.emit("finish")), (t._duplexState & Ht) === It && (t._duplexState |= T), t._duplexState &= we, (t._duplexState & st) === 0 ? this.update() : this.updateNextTick();
  }
  function Qt(l) {
    const t = this.stream;
    !l && this.error !== N && (l = this.error), l && t.emit("error", l), t._duplexState |= y, t.emit("close");
    const u = t._readableState, w = t._writableState;
    if (u !== null && u.pipeline !== null && u.pipeline.done(t, l), w !== null) {
      for (; w.drains !== null && w.drains.length > 0; ) w.drains.shift().resolve(!1);
      w.pipeline !== null && w.pipeline.done(t, l);
    }
  }
  function Qe(l) {
    const t = this.stream;
    l && t.destroy(l), t._duplexState &= Ee, this.drains !== null && ti(this.drains), (t._duplexState & We) === Y && (t._duplexState &= ke, (t._duplexState & kt) === kt && t.emit("drain")), this.updateCallback();
  }
  function Xe(l) {
    l && this.stream.destroy(l), this.stream._duplexState &= Q, this.readAhead === !1 && (this.stream._duplexState & n) === 0 && (this.stream._duplexState &= rt), this.updateCallback();
  }
  function Ze() {
    (this.stream._duplexState & b) === 0 && (this.stream._duplexState &= B, this.update());
  }
  function Je() {
    (this.stream._duplexState & st) === 0 && (this.stream._duplexState &= Mt, this.update());
  }
  function ti(l) {
    for (let t = 0; t < l.length; t++)
      --l[t].writes === 0 && (l.shift().resolve(!0), t--);
  }
  function Xt(l) {
    const t = this.stream;
    l && t.destroy(l), (t._duplexState & T) === 0 && ((t._duplexState & Ae) === 0 && (t._duplexState |= S), (t._duplexState & ve) === 0 && (t._duplexState |= z), t.emit("open")), t._duplexState &= Gt, t._writableState !== null && t._writableState.updateCallback(), t._readableState !== null && t._readableState.updateCallback();
  }
  function ei(l, t) {
    t != null && this.push(t), this._writableState.afterWrite(l);
  }
  function ii(l) {
    this._readableState !== null && (l === "data" && (this._duplexState |= V | M, this._readableState.updateNextTick()), l === "readable" && (this._duplexState |= $, this._readableState.updateNextTick())), this._writableState !== null && l === "drain" && (this._duplexState |= kt, this._writableState.updateNextTick());
  }
  class Rt extends _ {
    constructor(t) {
      super(), this._duplexState = 0, this._readableState = null, this._writableState = null, t && (t.open && (this._open = t.open), t.destroy && (this._destroy = t.destroy), t.predestroy && (this._predestroy = t.predestroy), t.signal && t.signal.addEventListener("abort", pi.bind(this))), this.on("newListener", ii);
    }
    _open(t) {
      t(null);
    }
    _destroy(t) {
      t(null);
    }
    _predestroy() {
    }
    get readable() {
      return this._readableState !== null ? !0 : void 0;
    }
    get writable() {
      return this._writableState !== null ? !0 : void 0;
    }
    get destroyed() {
      return (this._duplexState & y) !== 0;
    }
    get destroying() {
      return (this._duplexState & it) !== 0;
    }
    destroy(t) {
      (this._duplexState & it) === 0 && (t || (t = N), this._duplexState = (this._duplexState | T) & Re, this._readableState !== null && (this._readableState.highWaterMark = 0, this._readableState.error = t), this._writableState !== null && (this._writableState.highWaterMark = 0, this._writableState.error = t), this._duplexState |= A, this._predestroy(), this._duplexState &= H, this._readableState !== null && this._readableState.updateNextTick(), this._writableState !== null && this._writableState.updateNextTick());
    }
  }
  class dt extends Rt {
    constructor(t) {
      super(t), this._duplexState |= D | et | i, this._readableState = new je(this, t), t && (this._readableState.readAhead === !1 && (this._duplexState &= rt), t.read && (this._read = t.read), t.eagerOpen && this._readableState.updateNextTick(), t.encoding && this.setEncoding(t.encoding));
    }
    setEncoding(t) {
      const u = new p(t), w = this._readableState.map || ai;
      return this._readableState.map = P, this;
      function P(q) {
        const W = u.push(q);
        return W === "" && (q.byteLength !== 0 || u.remaining > 0) ? null : w(W);
      }
    }
    _read(t) {
      t(null);
    }
    pipe(t, u) {
      return this._readableState.updateNextTick(), this._readableState.pipe(t, u), t;
    }
    read() {
      return this._readableState.updateNextTick(), this._readableState.read();
    }
    push(t) {
      return this._readableState.updateNextTickIfOpen(), this._readableState.push(t);
    }
    unshift(t) {
      return this._readableState.updateNextTickIfOpen(), this._readableState.unshift(t);
    }
    resume() {
      return this._duplexState |= M, this._readableState.updateNextTick(), this;
    }
    pause() {
      return this._duplexState &= this._readableState.readAhead === !1 ? lt : E, this;
    }
    static _fromAsyncIterator(t, u) {
      let w;
      const P = new dt({
        ...u,
        read(W) {
          t.next().then(q).then(W.bind(null, null)).catch(W);
        },
        predestroy() {
          w = t.return();
        },
        destroy(W) {
          if (!w) return W(null);
          w.then(W.bind(null, null)).catch(W);
        }
      });
      return P;
      function q(W) {
        W.done ? P.push(null) : P.push(W.value);
      }
    }
    static from(t, u) {
      if (ci(t)) return t;
      if (t[yt]) return this._fromAsyncIterator(t[yt](), u);
      Array.isArray(t) || (t = t === void 0 ? [] : [t]);
      let w = 0;
      return new dt({
        ...u,
        read(P) {
          this.push(w === t.length ? null : t[w++]), P(null);
        }
      });
    }
    static isBackpressured(t) {
      return (t._duplexState & Oe) !== 0 || t._readableState.buffered >= t._readableState.highWaterMark;
    }
    static isPaused(t) {
      return (t._duplexState & n) === 0;
    }
    [yt]() {
      const t = this;
      let u = null, w = null, P = null;
      return this.on("error", (v) => {
        u = v;
      }), this.on("readable", q), this.on("close", W), {
        [yt]() {
          return this;
        },
        next() {
          return new Promise(function(v, nt) {
            w = v, P = nt;
            const ut = t.read();
            ut !== null ? ft(ut) : (t._duplexState & y) !== 0 && ft(null);
          });
        },
        return() {
          return pt(null);
        },
        throw(v) {
          return pt(v);
        }
      };
      function q() {
        w !== null && ft(t.read());
      }
      function W() {
        w !== null && ft(null);
      }
      function ft(v) {
        P !== null && (u ? P(u) : v === null && (t._duplexState & L) === 0 ? P(N) : w({ value: v, done: v === null }), P = w = null);
      }
      function pt(v) {
        return t.destroy(v), new Promise((nt, ut) => {
          if (t._duplexState & y) return nt({ value: void 0, done: !0 });
          t.once("close", function() {
            v ? ut(v) : nt({ value: void 0, done: !0 });
          });
        });
      }
    }
  }
  class Zt extends Rt {
    constructor(t) {
      super(t), this._duplexState |= D | L, this._writableState = new $t(this, t), t && (t.writev && (this._writev = t.writev), t.write && (this._write = t.write), t.final && (this._final = t.final), t.eagerOpen && this._writableState.updateNextTick());
    }
    cork() {
      this._duplexState |= xt;
    }
    uncork() {
      this._duplexState &= zt, this._writableState.updateNextTick();
    }
    _writev(t, u) {
      u(null);
    }
    _write(t, u) {
      this._writableState.autoBatch(t, u);
    }
    _final(t) {
      t(null);
    }
    static isBackpressured(t) {
      return (t._duplexState & ze) !== 0;
    }
    static drained(t) {
      if (t.destroyed) return Promise.resolve(!1);
      const u = t._writableState, P = (mi(t) ? Math.min(1, u.queue.length) : u.queue.length) + (t._duplexState & Tt ? 1 : 0);
      return P === 0 ? Promise.resolve(!0) : (u.drains === null && (u.drains = []), new Promise((q) => {
        u.drains.push({ writes: P, resolve: q });
      }));
    }
    write(t) {
      return this._writableState.updateNextTick(), this._writableState.push(t);
    }
    end(t) {
      return this._writableState.updateNextTick(), this._writableState.end(t), this;
    }
  }
  class Dt extends dt {
    // and Writable
    constructor(t) {
      super(t), this._duplexState = D | this._duplexState & i, this._writableState = new $t(this, t), t && (t.writev && (this._writev = t.writev), t.write && (this._write = t.write), t.final && (this._final = t.final));
    }
    cork() {
      this._duplexState |= xt;
    }
    uncork() {
      this._duplexState &= zt, this._writableState.updateNextTick();
    }
    _writev(t, u) {
      u(null);
    }
    _write(t, u) {
      this._writableState.autoBatch(t, u);
    }
    _final(t) {
      t(null);
    }
    write(t) {
      return this._writableState.updateNextTick(), this._writableState.push(t);
    }
    end(t) {
      return this._writableState.updateNextTick(), this._writableState.end(t), this;
    }
  }
  class Jt extends Dt {
    constructor(t) {
      super(t), this._transformState = new Ve(this), t && (t.transform && (this._transform = t.transform), t.flush && (this._flush = t.flush));
    }
    _write(t, u) {
      this._readableState.buffered >= this._readableState.highWaterMark ? this._transformState.data = t : this._transform(t, this._transformState.afterTransform);
    }
    _read(t) {
      if (this._transformState.data !== null) {
        const u = this._transformState.data;
        this._transformState.data = null, t(null), this._transform(u, this._transformState.afterTransform);
      } else
        t(null);
    }
    destroy(t) {
      super.destroy(t), this._transformState.data !== null && (this._transformState.data = null, this._transformState.afterTransform());
    }
    _transform(t, u) {
      u(null, t);
    }
    _flush(t) {
      t(null);
    }
    _final(t) {
      this._transformState.afterFinal = t, this._flush(ri.bind(this));
    }
  }
  class ni extends Jt {
  }
  function ri(l, t) {
    const u = this._transformState.afterFinal;
    if (l) return u(l);
    t != null && this.push(t), this.push(null), u(null);
  }
  function si(...l) {
    return new Promise((t, u) => te(...l, (w) => {
      if (w) return u(w);
      t();
    }));
  }
  function te(l, ...t) {
    const u = Array.isArray(l) ? [...l, ...t] : [l, ...t], w = u.length && typeof u[u.length - 1] == "function" ? u.pop() : null;
    if (u.length < 2) throw new Error("Pipeline requires at least 2 streams");
    let P = u[0], q = null, W = null;
    for (let v = 1; v < u.length; v++)
      q = u[v], _t(P) ? P.pipe(q, pt) : (ft(P, !0, v > 1, pt), P.pipe(q)), P = q;
    if (w) {
      let v = !1;
      const nt = _t(q) || !!(q._writableState && q._writableState.autoDestroy);
      q.on("error", (ut) => {
        W === null && (W = ut);
      }), q.on("finish", () => {
        v = !0, nt || w(W);
      }), nt && q.on("close", () => w(W || (v ? null : R)));
    }
    return q;
    function ft(v, nt, ut, At) {
      v.on("error", At), v.on("close", Si);
      function Si() {
        if (v._readableState && !v._readableState.ended || ut && v._writableState && !v._writableState.ended) return At(R);
      }
    }
    function pt(v) {
      if (!(!v || W)) {
        W = v;
        for (const nt of u)
          nt.destroy(v);
      }
    }
  }
  function ai(l) {
    return l;
  }
  function ee(l) {
    return !!l._readableState || !!l._writableState;
  }
  function _t(l) {
    return typeof l._duplexState == "number" && ee(l);
  }
  function ui(l) {
    return !!l._readableState && l._readableState.ending;
  }
  function oi(l) {
    return !!l._readableState && l._readableState.ended;
  }
  function li(l) {
    return !!l._writableState && l._writableState.ending;
  }
  function hi(l) {
    return !!l._writableState && l._writableState.ended;
  }
  function fi(l, t = {}) {
    const u = l._readableState && l._readableState.error || l._writableState && l._writableState.error;
    return !t.all && u === N ? null : u;
  }
  function ci(l) {
    return _t(l) && l.readable;
  }
  function di(l) {
    return (l._duplexState & D) !== D || (l._duplexState & T) === T || (l._duplexState & bt) !== 0;
  }
  function _i(l) {
    return typeof l == "object" && l !== null && typeof l.byteLength == "number";
  }
  function ie(l) {
    return _i(l) ? l.byteLength : 1024;
  }
  function ne() {
  }
  function pi() {
    this.destroy(new Error("Stream aborted."));
  }
  function mi(l) {
    return l._writev !== Zt.prototype._writev && l._writev !== Dt.prototype._writev;
  }
  return Bt = {
    pipeline: te,
    pipelinePromise: si,
    isStream: ee,
    isStreamx: _t,
    isEnding: ui,
    isEnded: oi,
    isFinishing: li,
    isFinished: hi,
    isDisturbed: di,
    getStreamError: fi,
    Stream: Rt,
    Writable: Zt,
    Readable: dt,
    Duplex: Dt,
    Transform: Jt,
    // Export PassThrough for compatibility with Node.js core's stream module
    PassThrough: ni
  }, Bt;
}
var ot = {}, ce;
function ye() {
  if (ce) return ot;
  ce = 1;
  const _ = St(), N = "0000000000000000000", R = "7777777777777777777", c = 48, p = _.from([117, 115, 116, 97, 114, 0]), g = _.from([c, c]), k = _.from([117, 115, 116, 97, 114, 32]), D = _.from([32, 0]), A = 4095, T = 257, y = 263;
  ot.decodeLongPath = function(i, h) {
    return L(i, 0, i.length, h);
  }, ot.encodePax = function(i) {
    let h = "";
    i.name && (h += x(" path=" + i.name + `
`)), i.linkname && (h += x(" linkpath=" + i.linkname + `
`));
    const m = i.pax;
    if (m)
      for (const O in m)
        h += x(" " + O + "=" + m[O] + `
`);
    return _.from(h);
  }, ot.decodePax = function(i) {
    const h = {};
    for (; i.length; ) {
      let m = 0;
      for (; m < i.length && i[m] !== 32; ) m++;
      const O = parseInt(_.toString(i.subarray(0, m)), 10);
      if (!O) return h;
      const U = _.toString(i.subarray(m + 1, O - 1)), M = U.indexOf("=");
      if (M === -1) return h;
      h[U.slice(0, M)] = U.slice(M + 1), i = i.subarray(O);
    }
    return h;
  }, ot.encode = function(i) {
    const h = _.alloc(512);
    let m = i.name, O = "";
    if (i.typeflag === 5 && m[m.length - 1] !== "/" && (m += "/"), _.byteLength(m) !== m.length) return null;
    for (; _.byteLength(m) > 100; ) {
      const U = m.indexOf("/");
      if (U === -1) return null;
      O += O ? "/" + m.slice(0, U) : m.slice(0, U), m = m.slice(U + 1);
    }
    return _.byteLength(m) > 100 || _.byteLength(O) > 155 || i.linkname && _.byteLength(i.linkname) > 100 ? null : (_.write(h, m), _.write(h, a(i.mode & A, 6), 100), _.write(h, a(i.uid, 6), 108), _.write(h, a(i.gid, 6), 116), V(i.size, h, 124), _.write(h, a(i.mtime.getTime() / 1e3 | 0, 11), 136), h[156] = c + S(i.type), i.linkname && _.write(h, i.linkname, 157), _.copy(p, h, T), _.copy(g, h, y), i.uname && _.write(h, i.uname, 265), i.gname && _.write(h, i.gname, 297), _.write(h, a(i.devmajor || 0, 6), 329), _.write(h, a(i.devminor || 0, 6), 337), O && _.write(h, O, 345), _.write(h, a(n(h), 6), 148), h);
  }, ot.decode = function(i, h, m) {
    let O = i[156] === 0 ? 0 : i[156] - c, U = L(i, 0, 100, h);
    const M = C(i, 100, 8), Q = C(i, 108, 8), X = C(i, 116, 8), G = C(i, 124, 12), F = C(i, 136, 12), E = b(O), r = i[157] === 0 ? null : L(i, 157, 100, h), s = L(i, 265, 32), d = L(i, 297, 32), B = C(i, 329, 8), K = C(i, 337, 8), rt = n(i);
    if (rt === 256) return null;
    if (rt !== C(i, 148, 8)) throw new Error("Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?");
    if (J(i))
      i[345] && (U = L(i, 345, 155, h) + "/" + U);
    else if (!H(i)) {
      if (!m)
        throw new Error("Invalid tar header: unknown format.");
    }
    return O === 0 && U && U[U.length - 1] === "/" && (O = 5), {
      name: U,
      mode: M,
      uid: Q,
      gid: X,
      size: G,
      mtime: new Date(1e3 * F),
      type: E,
      linkname: r,
      uname: s,
      gname: d,
      devmajor: B,
      devminor: K,
      pax: null
    };
  };
  function J(o) {
    return _.equals(p, o.subarray(T, T + 6));
  }
  function H(o) {
    return _.equals(k, o.subarray(T, T + 6)) && _.equals(D, o.subarray(y, y + 2));
  }
  function f(o, i, h) {
    return typeof o != "number" ? h : (o = ~~o, o >= i ? i : o >= 0 || (o += i, o >= 0) ? o : 0);
  }
  function b(o) {
    switch (o) {
      case 0:
        return "file";
      case 1:
        return "link";
      case 2:
        return "symlink";
      case 3:
        return "character-device";
      case 4:
        return "block-device";
      case 5:
        return "directory";
      case 6:
        return "fifo";
      case 7:
        return "contiguous-file";
      case 72:
        return "pax-header";
      case 55:
        return "pax-global-header";
      case 27:
        return "gnu-long-link-path";
      case 28:
      case 30:
        return "gnu-long-path";
    }
    return null;
  }
  function S(o) {
    switch (o) {
      case "file":
        return 0;
      case "link":
        return 1;
      case "symlink":
        return 2;
      case "character-device":
        return 3;
      case "block-device":
        return 4;
      case "directory":
        return 5;
      case "fifo":
        return 6;
      case "contiguous-file":
        return 7;
      case "pax-header":
        return 72;
    }
    return 0;
  }
  function e(o, i, h, m) {
    for (; h < m; h++)
      if (o[h] === i) return h;
    return m;
  }
  function n(o) {
    let i = 256;
    for (let h = 0; h < 148; h++) i += o[h];
    for (let h = 156; h < 512; h++) i += o[h];
    return i;
  }
  function a(o, i) {
    return o = o.toString(8), o.length > i ? R.slice(0, i) + " " : N.slice(0, i - o.length) + o + " ";
  }
  function I(o, i, h) {
    i[h] = 128;
    for (let m = 11; m > 0; m--)
      i[h + m] = o & 255, o = Math.floor(o / 256);
  }
  function V(o, i, h) {
    o.toString(8).length > 11 ? I(o, i, h) : _.write(i, a(o, 11), h);
  }
  function $(o) {
    let i;
    if (o[0] === 128) i = !0;
    else if (o[0] === 255) i = !1;
    else return null;
    const h = [];
    let m;
    for (m = o.length - 1; m > 0; m--) {
      const M = o[m];
      i ? h.push(M) : h.push(255 - M);
    }
    let O = 0;
    const U = h.length;
    for (m = 0; m < U; m++)
      O += h[m] * Math.pow(256, m);
    return i ? O : -1 * O;
  }
  function C(o, i, h) {
    if (o = o.subarray(i, i + h), i = 0, o[i] & 128)
      return $(o);
    {
      for (; i < o.length && o[i] === 32; ) i++;
      const m = f(e(o, 32, i, o.length), o.length, o.length);
      for (; i < m && o[i] === 0; ) i++;
      return m === i ? 0 : parseInt(_.toString(o.subarray(i, m)), 8);
    }
  }
  function L(o, i, h, m) {
    return _.toString(o.subarray(i, e(o, 0, i, i + h)), m);
  }
  function x(o) {
    const i = _.byteLength(o);
    let h = Math.floor(Math.log(i) / Math.log(10)) + 1;
    return i + h >= Math.pow(10, h) && h++, i + h + o;
  }
  return ot;
}
var Wt, de;
function Ai() {
  if (de) return Wt;
  de = 1;
  const { Writable: _, Readable: N, getStreamError: R } = be(), c = xe(), p = St(), g = ye(), k = p.alloc(0);
  class D {
    constructor() {
      this.buffered = 0, this.shifted = 0, this.queue = new c(), this._offset = 0;
    }
    push(f) {
      this.buffered += f.byteLength, this.queue.push(f);
    }
    shiftFirst(f) {
      return this._buffered === 0 ? null : this._next(f);
    }
    shift(f) {
      if (f > this.buffered) return null;
      if (f === 0) return k;
      let b = this._next(f);
      if (f === b.byteLength) return b;
      const S = [b];
      for (; (f -= b.byteLength) > 0; )
        b = this._next(f), S.push(b);
      return p.concat(S);
    }
    _next(f) {
      const b = this.queue.peek(), S = b.byteLength - this._offset;
      if (f >= S) {
        const e = this._offset ? b.subarray(this._offset, b.byteLength) : b;
        return this.queue.shift(), this._offset = 0, this.buffered -= S, this.shifted += S, e;
      }
      return this.buffered -= f, this.shifted += f, b.subarray(this._offset, this._offset += f);
    }
  }
  class A extends N {
    constructor(f, b, S) {
      super(), this.header = b, this.offset = S, this._parent = f;
    }
    _read(f) {
      this.header.size === 0 && this.push(null), this._parent._stream === this && this._parent._update(), f(null);
    }
    _predestroy() {
      this._parent.destroy(R(this));
    }
    _detach() {
      this._parent._stream === this && (this._parent._stream = null, this._parent._missing = J(this.header.size), this._parent._update());
    }
    _destroy(f) {
      this._detach(), f(null);
    }
  }
  class T extends _ {
    constructor(f) {
      super(f), f || (f = {}), this._buffer = new D(), this._offset = 0, this._header = null, this._stream = null, this._missing = 0, this._longHeader = !1, this._callback = y, this._locked = !1, this._finished = !1, this._pax = null, this._paxGlobal = null, this._gnuLongPath = null, this._gnuLongLinkPath = null, this._filenameEncoding = f.filenameEncoding || "utf-8", this._allowUnknownFormat = !!f.allowUnknownFormat, this._unlockBound = this._unlock.bind(this);
    }
    _unlock(f) {
      if (this._locked = !1, f) {
        this.destroy(f), this._continueWrite(f);
        return;
      }
      this._update();
    }
    _consumeHeader() {
      if (this._locked) return !1;
      this._offset = this._buffer.shifted;
      try {
        this._header = g.decode(this._buffer.shift(512), this._filenameEncoding, this._allowUnknownFormat);
      } catch (f) {
        return this._continueWrite(f), !1;
      }
      if (!this._header) return !0;
      switch (this._header.type) {
        case "gnu-long-path":
        case "gnu-long-link-path":
        case "pax-global-header":
        case "pax-header":
          return this._longHeader = !0, this._missing = this._header.size, !0;
      }
      return this._locked = !0, this._applyLongHeaders(), this._header.size === 0 || this._header.type === "directory" ? (this.emit("entry", this._header, this._createStream(), this._unlockBound), !0) : (this._stream = this._createStream(), this._missing = this._header.size, this.emit("entry", this._header, this._stream, this._unlockBound), !0);
    }
    _applyLongHeaders() {
      this._gnuLongPath && (this._header.name = this._gnuLongPath, this._gnuLongPath = null), this._gnuLongLinkPath && (this._header.linkname = this._gnuLongLinkPath, this._gnuLongLinkPath = null), this._pax && (this._pax.path && (this._header.name = this._pax.path), this._pax.linkpath && (this._header.linkname = this._pax.linkpath), this._pax.size && (this._header.size = parseInt(this._pax.size, 10)), this._header.pax = this._pax, this._pax = null);
    }
    _decodeLongHeader(f) {
      switch (this._header.type) {
        case "gnu-long-path":
          this._gnuLongPath = g.decodeLongPath(f, this._filenameEncoding);
          break;
        case "gnu-long-link-path":
          this._gnuLongLinkPath = g.decodeLongPath(f, this._filenameEncoding);
          break;
        case "pax-global-header":
          this._paxGlobal = g.decodePax(f);
          break;
        case "pax-header":
          this._pax = this._paxGlobal === null ? g.decodePax(f) : Object.assign({}, this._paxGlobal, g.decodePax(f));
          break;
      }
    }
    _consumeLongHeader() {
      this._longHeader = !1, this._missing = J(this._header.size);
      const f = this._buffer.shift(this._header.size);
      try {
        this._decodeLongHeader(f);
      } catch (b) {
        return this._continueWrite(b), !1;
      }
      return !0;
    }
    _consumeStream() {
      const f = this._buffer.shiftFirst(this._missing);
      if (f === null) return !1;
      this._missing -= f.byteLength;
      const b = this._stream.push(f);
      return this._missing === 0 ? (this._stream.push(null), b && this._stream._detach(), b && this._locked === !1) : b;
    }
    _createStream() {
      return new A(this, this._header, this._offset);
    }
    _update() {
      for (; this._buffer.buffered > 0 && !this.destroying; ) {
        if (this._missing > 0) {
          if (this._stream !== null) {
            if (this._consumeStream() === !1) return;
            continue;
          }
          if (this._longHeader === !0) {
            if (this._missing > this._buffer.buffered) break;
            if (this._consumeLongHeader() === !1) return !1;
            continue;
          }
          const f = this._buffer.shiftFirst(this._missing);
          f !== null && (this._missing -= f.byteLength);
          continue;
        }
        if (this._buffer.buffered < 512) break;
        if (this._stream !== null || this._consumeHeader() === !1) return;
      }
      this._continueWrite(null);
    }
    _continueWrite(f) {
      const b = this._callback;
      this._callback = y, b(f);
    }
    _write(f, b) {
      this._callback = b, this._buffer.push(f), this._update();
    }
    _final(f) {
      this._finished = this._missing === 0 && this._buffer.buffered === 0, f(this._finished ? null : new Error("Unexpected end of data"));
    }
    _predestroy() {
      this._continueWrite(null);
    }
    _destroy(f) {
      this._stream && this._stream.destroy(R(this)), f(null);
    }
    [Symbol.asyncIterator]() {
      let f = null, b = null, S = null, e = null, n = null;
      const a = this;
      return this.on("entry", $), this.on("error", (x) => {
        f = x;
      }), this.on("close", C), {
        [Symbol.asyncIterator]() {
          return this;
        },
        next() {
          return new Promise(V);
        },
        return() {
          return L(null);
        },
        throw(x) {
          return L(x);
        }
      };
      function I(x) {
        if (!n) return;
        const o = n;
        n = null, o(x);
      }
      function V(x, o) {
        if (f)
          return o(f);
        if (e) {
          x({ value: e, done: !1 }), e = null;
          return;
        }
        b = x, S = o, I(null), a._finished && b && (b({ value: void 0, done: !0 }), b = S = null);
      }
      function $(x, o, i) {
        n = i, o.on("error", y), b ? (b({ value: o, done: !1 }), b = S = null) : e = o;
      }
      function C() {
        I(f), b && (f ? S(f) : b({ value: void 0, done: !0 }), b = S = null);
      }
      function L(x) {
        return a.destroy(x), I(x), new Promise((o, i) => {
          if (a.destroyed) return o({ value: void 0, done: !0 });
          a.once("close", function() {
            x ? i(x) : o({ value: void 0, done: !0 });
          });
        });
      }
    }
  }
  Wt = function(f) {
    return new T(f);
  };
  function y() {
  }
  function J(H) {
    return H &= 511, H && 512 - H;
  }
  return Wt;
}
var wt = { exports: {} }, _e;
function Ni() {
  if (_e) return wt.exports;
  _e = 1;
  const _ = {
    // just for envs without fs
    S_IFMT: 61440,
    S_IFDIR: 16384,
    S_IFCHR: 8192,
    S_IFBLK: 24576,
    S_IFIFO: 4096,
    S_IFLNK: 40960
  };
  try {
    wt.exports = require("fs").constants || _;
  } catch {
    wt.exports = _;
  }
  return wt.exports;
}
var qt, pe;
function Pi() {
  if (pe) return qt;
  pe = 1;
  const { Readable: _, Writable: N, getStreamError: R } = be(), c = St(), p = Ni(), g = ye(), k = 493, D = 420, A = c.alloc(1024);
  class T extends N {
    constructor(e, n, a) {
      super({ mapWritable: b, eagerOpen: !0 }), this.written = 0, this.header = n, this._callback = a, this._linkname = null, this._isLinkname = n.type === "symlink" && !n.linkname, this._isVoid = n.type !== "file" && n.type !== "contiguous-file", this._finished = !1, this._pack = e, this._openCallback = null, this._pack._stream === null ? this._pack._stream = this : this._pack._pending.push(this);
    }
    _open(e) {
      this._openCallback = e, this._pack._stream === this && this._continueOpen();
    }
    _continuePack(e) {
      if (this._callback === null) return;
      const n = this._callback;
      this._callback = null, n(e);
    }
    _continueOpen() {
      this._pack._stream === null && (this._pack._stream = this);
      const e = this._openCallback;
      if (this._openCallback = null, e !== null) {
        if (this._pack.destroying) return e(new Error("pack stream destroyed"));
        if (this._pack._finalized) return e(new Error("pack stream is already finalized"));
        this._pack._stream = this, this._isLinkname || this._pack._encode(this.header), this._isVoid && (this._finish(), this._continuePack(null)), e(null);
      }
    }
    _write(e, n) {
      if (this._isLinkname)
        return this._linkname = this._linkname ? c.concat([this._linkname, e]) : e, n(null);
      if (this._isVoid)
        return e.byteLength > 0 ? n(new Error("No body allowed for this entry")) : n();
      if (this.written += e.byteLength, this._pack.push(e)) return n();
      this._pack._drain = n;
    }
    _finish() {
      this._finished || (this._finished = !0, this._isLinkname && (this.header.linkname = this._linkname ? c.toString(this._linkname, "utf-8") : "", this._pack._encode(this.header)), f(this._pack, this.header.size), this._pack._done(this));
    }
    _final(e) {
      if (this.written !== this.header.size)
        return e(new Error("Size mismatch"));
      this._finish(), e(null);
    }
    _getError() {
      return R(this) || new Error("tar entry destroyed");
    }
    _predestroy() {
      this._pack.destroy(this._getError());
    }
    _destroy(e) {
      this._pack._done(this), this._continuePack(this._finished ? null : this._getError()), e();
    }
  }
  class y extends _ {
    constructor(e) {
      super(e), this._drain = H, this._finalized = !1, this._finalizing = !1, this._pending = [], this._stream = null;
    }
    entry(e, n, a) {
      if (this._finalized || this.destroying) throw new Error("already finalized or destroyed");
      typeof n == "function" && (a = n, n = null), a || (a = H), (!e.size || e.type === "symlink") && (e.size = 0), e.type || (e.type = J(e.mode)), e.mode || (e.mode = e.type === "directory" ? k : D), e.uid || (e.uid = 0), e.gid || (e.gid = 0), e.mtime || (e.mtime = /* @__PURE__ */ new Date()), typeof n == "string" && (n = c.from(n));
      const I = new T(this, e, a);
      return c.isBuffer(n) ? (e.size = n.byteLength, I.write(n), I.end(), I) : (I._isVoid, I);
    }
    finalize() {
      if (this._stream || this._pending.length > 0) {
        this._finalizing = !0;
        return;
      }
      this._finalized || (this._finalized = !0, this.push(A), this.push(null));
    }
    _done(e) {
      e === this._stream && (this._stream = null, this._finalizing && this.finalize(), this._pending.length && this._pending.shift()._continueOpen());
    }
    _encode(e) {
      if (!e.pax) {
        const n = g.encode(e);
        if (n) {
          this.push(n);
          return;
        }
      }
      this._encodePax(e);
    }
    _encodePax(e) {
      const n = g.encodePax({
        name: e.name,
        linkname: e.linkname,
        pax: e.pax
      }), a = {
        name: "PaxHeader",
        mode: e.mode,
        uid: e.uid,
        gid: e.gid,
        size: n.byteLength,
        mtime: e.mtime,
        type: "pax-header",
        linkname: e.linkname && "PaxHeader",
        uname: e.uname,
        gname: e.gname,
        devmajor: e.devmajor,
        devminor: e.devminor
      };
      this.push(g.encode(a)), this.push(n), f(this, n.byteLength), a.size = e.size, a.type = e.type, this.push(g.encode(a));
    }
    _doDrain() {
      const e = this._drain;
      this._drain = H, e();
    }
    _predestroy() {
      const e = R(this);
      for (this._stream && this._stream.destroy(e); this._pending.length; ) {
        const n = this._pending.shift();
        n.destroy(e), n._continueOpen();
      }
      this._doDrain();
    }
    _read(e) {
      this._doDrain(), e();
    }
  }
  qt = function(e) {
    return new y(e);
  };
  function J(S) {
    switch (S & p.S_IFMT) {
      case p.S_IFBLK:
        return "block-device";
      case p.S_IFCHR:
        return "character-device";
      case p.S_IFDIR:
        return "directory";
      case p.S_IFIFO:
        return "fifo";
      case p.S_IFLNK:
        return "symlink";
    }
    return "file";
  }
  function H() {
  }
  function f(S, e) {
    e &= 511, e && S.push(A.subarray(0, 512 - e));
  }
  function b(S) {
    return c.isBuffer(S) ? S : c.from(S);
  }
  return qt;
}
var me;
function Li() {
  return me || (me = 1, Et.extract = Ai(), Et.pack = Pi()), Et;
}
var Se;
function Oi() {
  if (Se) return gt;
  Se = 1;
  const _ = Li(), N = yi(), R = gi, c = Ei, p = (mt.Bare ? mt.Bare.platform : process.platform) === "win32";
  gt.pack = function(e, n) {
    e || (e = "."), n || (n = {});
    const a = n.fs || R, I = n.ignore || n.filter || y, V = n.mapStream || J, $ = f(a, n.dereference ? a.stat : a.lstat, e, I, n.entries, n.sort), C = n.strict !== !1, L = typeof n.umask == "number" ? ~n.umask : ~D(), x = n.pack || _.pack(), o = n.finish || y;
    let i = n.map || y, h = typeof n.dmode == "number" ? n.dmode : 0, m = typeof n.fmode == "number" ? n.fmode : 0;
    n.strip && (i = b(i, n.strip)), n.readable && (h |= parseInt(555, 8), m |= parseInt(444, 8)), n.writable && (h |= parseInt(333, 8), m |= parseInt(222, 8)), M();
    function O(Q, X) {
      a.readlink(c.join(e, Q), function(G, F) {
        if (G) return x.destroy(G);
        X.linkname = H(F), x.entry(X, M);
      });
    }
    function U(Q, X, G) {
      if (x.destroyed) return;
      if (Q) return x.destroy(Q);
      if (!X)
        return n.finalize !== !1 && x.finalize(), o(x);
      if (G.isSocket()) return M();
      let F = {
        name: H(X),
        mode: (G.mode | (G.isDirectory() ? h : m)) & L,
        mtime: G.mtime,
        size: G.size,
        type: "file",
        uid: G.uid,
        gid: G.gid
      };
      if (G.isDirectory())
        return F.size = 0, F.type = "directory", F = i(F) || F, x.entry(F, M);
      if (G.isSymbolicLink())
        return F.size = 0, F.type = "symlink", F = i(F) || F, O(X, F);
      if (F = i(F) || F, !G.isFile())
        return C ? x.destroy(new Error("unsupported type for " + X)) : M();
      const E = x.entry(F, M), r = V(a.createReadStream(c.join(e, X), { start: 0, end: F.size > 0 ? F.size - 1 : F.size }), F);
      r.on("error", function(s) {
        E.destroy(s);
      }), N(r, E);
    }
    function M(Q) {
      if (Q) return x.destroy(Q);
      $(U);
    }
    return x;
  };
  function g(S) {
    return S.length ? S[S.length - 1] : null;
  }
  function k() {
    return !mt.Bare && process.getuid ? process.getuid() : -1;
  }
  function D() {
    return !mt.Bare && process.umask ? process.umask() : 0;
  }
  gt.extract = function(e, n) {
    e || (e = "."), n || (n = {}), e = c.resolve(e);
    const a = n.fs || R, I = n.ignore || n.filter || y, V = n.mapStream || J, $ = n.chown !== !1 && !p && k() === 0, C = n.extract || _.extract(), L = [], x = /* @__PURE__ */ new Date(), o = typeof n.umask == "number" ? ~n.umask : ~D(), i = n.strict !== !1, h = n.validateSymlinks !== !1;
    let m = n.map || y, O = typeof n.dmode == "number" ? n.dmode : 0, U = typeof n.fmode == "number" ? n.fmode : 0;
    return n.strip && (m = b(m, n.strip)), n.readable && (O |= parseInt(555, 8), U |= parseInt(444, 8)), n.writable && (O |= parseInt(333, 8), U |= parseInt(222, 8)), C.on("entry", M), n.finish && C.on("finish", n.finish), C;
    function M(E, r, s) {
      E = m(E) || E, E.name = H(E.name);
      const d = c.join(e, c.join("/", E.name));
      if (I(d, E))
        return r.resume(), s();
      const B = c.join(d, ".") === c.join(e, ".") ? e : c.dirname(d);
      T(a, B, c.join(e, "."), function(z, j) {
        if (z) return s(z);
        if (!j) return s(new Error(B + " is not a valid path"));
        if (E.type === "directory")
          return L.push([d, E.mtime]), F(d, {
            uid: E.uid,
            gid: E.gid,
            mode: E.mode
          }, K);
        F(B, {
          uid: E.uid,
          gid: E.gid,
          // normally, the folders with rights and owner should be part of the TAR file
          // if this is not the case, create folder for same user as file and with
          // standard permissions of 0o755 (rwxr-xr-x)
          mode: 493
        }, function(Y) {
          if (Y) return s(Y);
          switch (E.type) {
            case "file":
              return st();
            case "link":
              return lt();
            case "symlink":
              return rt();
          }
          if (i) return s(new Error("unsupported type for " + d + " (" + E.type + ")"));
          r.resume(), s();
        });
      });
      function K(z) {
        if (z) return s(z);
        X(d, E, function(j) {
          if (j) return s(j);
          if (p) return s();
          G(d, E, s);
        });
      }
      function rt() {
        if (p) return s();
        a.unlink(d, function() {
          const z = c.resolve(c.dirname(d), E.linkname);
          if (!Z(z) && h) return s(new Error(d + " is not a valid symlink"));
          A(a, z, c.join(e, "."), function(j, Y) {
            if (j) return s(j);
            if (!Y && h) return s(new Error(d + " is not a valid symlink"));
            a.symlink(E.linkname, d, K);
          });
        });
      }
      function lt() {
        if (p) return s();
        a.unlink(d, function() {
          const z = c.join(e, c.join("/", E.linkname));
          a.realpath(z, function(j, Y) {
            if (j || !Z(Y)) return s(new Error(d + " is not a valid hardlink"));
            a.link(Y, d, function(et) {
              if (et && et.code === "EPERM" && n.hardlinkAsFilesFallback)
                return r = a.createReadStream(Y), st();
              K(et);
            });
          });
        });
      }
      function Z(z) {
        return z === e || z.startsWith(e + c.sep);
      }
      function st() {
        const z = a.createWriteStream(d), j = V(r, E);
        z.on("error", function(Y) {
          j.destroy(Y);
        }), N(j, z, function(Y) {
          if (Y) return s(Y);
          z.on("close", K);
        });
      }
    }
    function Q(E, r) {
      let s;
      for (; (s = g(L)) && E.slice(0, s[0].length) !== s[0]; ) L.pop();
      if (!s) return r();
      a.utimes(s[0], x, s[1], r);
    }
    function X(E, r, s) {
      if (n.utimes === !1) return s();
      if (r.type === "directory") return a.utimes(E, x, r.mtime, s);
      if (r.type === "symlink") return Q(E, s);
      a.utimes(E, x, r.mtime, function(d) {
        if (d) return s(d);
        Q(E, s);
      });
    }
    function G(E, r, s) {
      const d = r.type === "symlink", B = d ? a.lchmod : a.chmod, K = d ? a.lchown : a.chown;
      if (!B) return s();
      const rt = (r.mode | (r.type === "directory" ? O : U)) & o;
      K && $ ? K.call(a, E, r.uid, r.gid, lt) : lt(null);
      function lt(Z) {
        if (Z) return s(Z);
        if (!B) return s();
        B.call(a, E, rt, s);
      }
    }
    function F(E, r, s) {
      a.stat(E, function(d) {
        if (!d) return s(null);
        if (d.code !== "ENOENT") return s(d);
        a.mkdir(E, { mode: r.mode, recursive: !0 }, function(B, K) {
          if (B) return s(B);
          G(E, r, s);
        });
      });
    }
  };
  function A(S, e, n, a) {
    if (e === n) return a(null, !0);
    if (!e.startsWith(n + c.sep)) return a(null, !1);
    S.lstat(e, function(I, V) {
      if (I && I.code !== "ENOENT" && I.code !== "EPERM") return a(I);
      if (I || !V.isSymbolicLink()) return A(S, c.join(e, ".."), n, a);
      a(null, !1);
    });
  }
  function T(S, e, n, a) {
    if (e === n) return a(null, !0);
    S.lstat(e, function(I, V) {
      if (I && I.code !== "ENOENT" && I.code !== "EPERM") return a(I);
      if (I || V.isDirectory()) return T(S, c.join(e, ".."), n, a);
      a(null, !1);
    });
  }
  function y() {
  }
  function J(S) {
    return S;
  }
  function H(S) {
    return p ? S.replace(/\\/g, "/").replace(/[:?<>|]/g, "_") : S;
  }
  function f(S, e, n, a, I, V) {
    I || (I = ["."]);
    const $ = I.slice(0);
    return function(L) {
      if (!$.length) return L(null);
      const x = $.shift(), o = c.join(n, x);
      e.call(S, o, function(i, h) {
        if (i) return L(I.indexOf(x) === -1 && i.code === "ENOENT" ? null : i);
        if (!h.isDirectory()) return L(null, x, h);
        S.readdir(o, function(m, O) {
          if (m) return L(m);
          V && O.sort();
          for (let U = 0; U < O.length; U++)
            a(c.join(n, x, O[U])) || $.push(c.join(x, O[U]));
          L(null, x, h);
        });
      });
    };
  }
  function b(S, e) {
    return function(n) {
      n.name = n.name.split("/").slice(e).join("/");
      const a = n.linkname;
      return a && (n.type === "link" || c.isAbsolute(a)) && (n.linkname = a.split("/").slice(e).join("/")), S(n);
    };
  }
  return gt;
}
var ge = Oi();
const Ui = /* @__PURE__ */ xi(ge), ji = /* @__PURE__ */ wi({
  __proto__: null,
  default: Ui
}, [ge]);
export {
  ji as i
};
