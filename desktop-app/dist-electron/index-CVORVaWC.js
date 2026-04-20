import { c as ve, d as ye, g as Ee } from "./main-Cwyr03mT.js";
import ne from "fs";
import ge from "buffer";
import { r as we } from "./index-BCOBbaYR.js";
import K from "stream";
import xe from "path";
import ae from "util";
import Se from "zlib";
import he from "events";
function ze(h, L) {
  for (var x = 0; x < L.length; x++) {
    const f = L[x];
    if (typeof f != "string" && !Array.isArray(f)) {
      for (const d in f)
        if (d !== "default" && !(d in h)) {
          const y = Object.getOwnPropertyDescriptor(f, d);
          y && Object.defineProperty(h, d, y.get ? y : {
            enumerable: !0,
            get: () => f[d]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(h, Symbol.toStringTag, { value: "Module" }));
}
var X = { exports: {} }, re, fe;
function Ce() {
  if (fe) return re;
  fe = 1;
  const { PassThrough: h } = K;
  return re = (L) => {
    L = { ...L };
    const { array: x } = L;
    let { encoding: f } = L;
    const d = f === "buffer";
    let y = !1;
    x ? y = !(f || d) : f = f || "utf8", d && (f = null);
    const F = new h({ objectMode: y });
    f && F.setEncoding(f);
    let N = 0;
    const E = [];
    return F.on("data", (_) => {
      E.push(_), y ? N = E.length : N += _.length;
    }), F.getBufferedValue = () => x ? E : d ? Buffer.concat(E, N) : E.join(""), F.getBufferedLength = () => N, F;
  }, re;
}
var oe;
function Fe() {
  if (oe) return X.exports;
  oe = 1;
  const { constants: h } = ge, L = we(), x = Ce();
  class f extends Error {
    constructor() {
      super("maxBuffer exceeded"), this.name = "MaxBufferError";
    }
  }
  async function d(y, F) {
    if (!y)
      return Promise.reject(new Error("Expected a stream"));
    F = {
      maxBuffer: 1 / 0,
      ...F
    };
    const { maxBuffer: N } = F;
    let E;
    return await new Promise((_, q) => {
      const R = (l) => {
        l && E.getBufferedLength() <= h.MAX_LENGTH && (l.bufferedData = E.getBufferedValue()), q(l);
      };
      E = L(y, x(F), (l) => {
        if (l) {
          R(l);
          return;
        }
        _();
      }), E.on("data", () => {
        E.getBufferedLength() > N && R(new f());
      });
    }), E.getBufferedValue();
  }
  return X.exports = d, X.exports.default = d, X.exports.buffer = (y, F) => d(y, { ...F, encoding: "buffer" }), X.exports.array = (y, F) => d(y, { ...F, array: !0 }), X.exports.MaxBufferError = f, X.exports;
}
var W = {}, V = {}, te, ue;
function Ie() {
  if (ue) return te;
  ue = 1, te = h;
  function h() {
    this.pending = 0, this.max = 1 / 0, this.listeners = [], this.waiting = [], this.error = null;
  }
  h.prototype.go = function(f) {
    this.pending < this.max ? x(this, f) : this.waiting.push(f);
  }, h.prototype.wait = function(f) {
    this.pending === 0 ? f(this.error) : this.listeners.push(f);
  }, h.prototype.hold = function() {
    return L(this);
  };
  function L(f) {
    f.pending += 1;
    var d = !1;
    return y;
    function y(N) {
      if (d) throw new Error("callback called twice");
      if (d = !0, f.error = f.error || N, f.pending -= 1, f.waiting.length > 0 && f.pending < f.max)
        x(f, f.waiting.shift());
      else if (f.pending === 0) {
        var E = f.listeners;
        f.listeners = [], E.forEach(F);
      }
    }
    function F(N) {
      N(f.error);
    }
  }
  function x(f, d) {
    d(L(f));
  }
  return te;
}
var de;
function Le() {
  if (de) return V;
  de = 1;
  var h = ne, L = ae, x = K, f = x.Readable, d = x.Writable, y = x.PassThrough, F = Ie(), N = he.EventEmitter;
  V.createFromBuffer = l, V.createFromFd = S, V.BufferSlicer = R, V.FdSlicer = E, L.inherits(E, N);
  function E(i, n) {
    n = n || {}, N.call(this), this.fd = i, this.pend = new F(), this.pend.max = 1, this.refCount = 0, this.autoClose = !!n.autoClose;
  }
  E.prototype.read = function(i, n, s, o, z) {
    var c = this;
    c.pend.go(function(C) {
      h.read(c.fd, i, n, s, o, function(I, $, G) {
        C(), z(I, $, G);
      });
    });
  }, E.prototype.write = function(i, n, s, o, z) {
    var c = this;
    c.pend.go(function(C) {
      h.write(c.fd, i, n, s, o, function(I, $, G) {
        C(), z(I, $, G);
      });
    });
  }, E.prototype.createReadStream = function(i) {
    return new _(this, i);
  }, E.prototype.createWriteStream = function(i) {
    return new q(this, i);
  }, E.prototype.ref = function() {
    this.refCount += 1;
  }, E.prototype.unref = function() {
    var i = this;
    if (i.refCount -= 1, i.refCount > 0) return;
    if (i.refCount < 0) throw new Error("invalid unref");
    i.autoClose && h.close(i.fd, n);
    function n(s) {
      s ? i.emit("error", s) : i.emit("close");
    }
  }, L.inherits(_, f);
  function _(i, n) {
    n = n || {}, f.call(this, n), this.context = i, this.context.ref(), this.start = n.start || 0, this.endOffset = n.end, this.pos = this.start, this.destroyed = !1;
  }
  _.prototype._read = function(i) {
    var n = this;
    if (!n.destroyed) {
      var s = Math.min(n._readableState.highWaterMark, i);
      if (n.endOffset != null && (s = Math.min(s, n.endOffset - n.pos)), s <= 0) {
        n.destroyed = !0, n.push(null), n.context.unref();
        return;
      }
      n.context.pend.go(function(o) {
        if (n.destroyed) return o();
        var z = new Buffer(s);
        h.read(n.context.fd, z, 0, s, n.pos, function(c, C) {
          c ? n.destroy(c) : C === 0 ? (n.destroyed = !0, n.push(null), n.context.unref()) : (n.pos += C, n.push(z.slice(0, C))), o();
        });
      });
    }
  }, _.prototype.destroy = function(i) {
    this.destroyed || (i = i || new Error("stream destroyed"), this.destroyed = !0, this.emit("error", i), this.context.unref());
  }, L.inherits(q, d);
  function q(i, n) {
    n = n || {}, d.call(this, n), this.context = i, this.context.ref(), this.start = n.start || 0, this.endOffset = n.end == null ? 1 / 0 : +n.end, this.bytesWritten = 0, this.pos = this.start, this.destroyed = !1, this.on("finish", this.destroy.bind(this));
  }
  q.prototype._write = function(i, n, s) {
    var o = this;
    if (!o.destroyed) {
      if (o.pos + i.length > o.endOffset) {
        var z = new Error("maximum file length exceeded");
        z.code = "ETOOBIG", o.destroy(), s(z);
        return;
      }
      o.context.pend.go(function(c) {
        if (o.destroyed) return c();
        h.write(o.context.fd, i, 0, i.length, o.pos, function(C, I) {
          C ? (o.destroy(), c(), s(C)) : (o.bytesWritten += I, o.pos += I, o.emit("progress"), c(), s());
        });
      });
    }
  }, q.prototype.destroy = function() {
    this.destroyed || (this.destroyed = !0, this.context.unref());
  }, L.inherits(R, N);
  function R(i, n) {
    N.call(this), n = n || {}, this.refCount = 0, this.buffer = i, this.maxChunkSize = n.maxChunkSize || Number.MAX_SAFE_INTEGER;
  }
  R.prototype.read = function(i, n, s, o, z) {
    var c = o + s, C = c - this.buffer.length, I = C > 0 ? C : s;
    this.buffer.copy(i, n, o, c), setImmediate(function() {
      z(null, I);
    });
  }, R.prototype.write = function(i, n, s, o, z) {
    i.copy(this.buffer, o, n, n + s), setImmediate(function() {
      z(null, s, i);
    });
  }, R.prototype.createReadStream = function(i) {
    i = i || {};
    var n = new y(i);
    n.destroyed = !1, n.start = i.start || 0, n.endOffset = i.end, n.pos = n.endOffset || this.buffer.length;
    for (var s = this.buffer.slice(n.start, n.pos), o = 0; ; ) {
      var z = o + this.maxChunkSize;
      if (z >= s.length) {
        o < s.length && n.write(s.slice(o, s.length));
        break;
      }
      n.write(s.slice(o, z)), o = z;
    }
    return n.end(), n.destroy = function() {
      n.destroyed = !0;
    }, n;
  }, R.prototype.createWriteStream = function(i) {
    var n = this;
    i = i || {};
    var s = new d(i);
    return s.start = i.start || 0, s.endOffset = i.end == null ? this.buffer.length : +i.end, s.bytesWritten = 0, s.pos = s.start, s.destroyed = !1, s._write = function(o, z, c) {
      if (!s.destroyed) {
        var C = s.pos + o.length;
        if (C > s.endOffset) {
          var I = new Error("maximum file length exceeded");
          I.code = "ETOOBIG", s.destroyed = !0, c(I);
          return;
        }
        o.copy(n.buffer, s.pos, 0, o.length), s.bytesWritten += o.length, s.pos = C, s.emit("progress"), c();
      }
    }, s.destroy = function() {
      s.destroyed = !0;
    }, s;
  }, R.prototype.ref = function() {
    this.refCount += 1;
  }, R.prototype.unref = function() {
    if (this.refCount -= 1, this.refCount < 0)
      throw new Error("invalid unref");
  };
  function l(i, n) {
    return new R(i, n);
  }
  function S(i, n) {
    return new E(i, n);
  }
  return V;
}
var le;
function Ne() {
  if (le) return W;
  le = 1;
  var h = ne, L = Se, x = Le(), f = ve(), d = ae, y = he.EventEmitter, F = K.Transform, N = K.PassThrough, E = K.Writable;
  W.open = _, W.fromFd = q, W.fromBuffer = R, W.fromRandomAccessReader = l, W.dosDateTimeToDate = o, W.validateFileName = z, W.ZipFile = S, W.Entry = s, W.RandomAccessReader = I;
  function _(r, e, a) {
    typeof e == "function" && (a = e, e = null), e == null && (e = {}), e.autoClose == null && (e.autoClose = !0), e.lazyEntries == null && (e.lazyEntries = !1), e.decodeStrings == null && (e.decodeStrings = !0), e.validateEntrySizes == null && (e.validateEntrySizes = !0), e.strictFileNames == null && (e.strictFileNames = !1), a == null && (a = k), h.open(r, "r", function(t, m) {
      if (t) return a(t);
      q(m, e, function(u, p) {
        u && h.close(m, k), a(u, p);
      });
    });
  }
  function q(r, e, a) {
    typeof e == "function" && (a = e, e = null), e == null && (e = {}), e.autoClose == null && (e.autoClose = !1), e.lazyEntries == null && (e.lazyEntries = !1), e.decodeStrings == null && (e.decodeStrings = !0), e.validateEntrySizes == null && (e.validateEntrySizes = !0), e.strictFileNames == null && (e.strictFileNames = !1), a == null && (a = k), h.fstat(r, function(t, m) {
      if (t) return a(t);
      var u = x.createFromFd(r, { autoClose: !0 });
      l(u, m.size, e, a);
    });
  }
  function R(r, e, a) {
    typeof e == "function" && (a = e, e = null), e == null && (e = {}), e.autoClose = !1, e.lazyEntries == null && (e.lazyEntries = !1), e.decodeStrings == null && (e.decodeStrings = !0), e.validateEntrySizes == null && (e.validateEntrySizes = !0), e.strictFileNames == null && (e.strictFileNames = !1);
    var t = x.createFromBuffer(r, { maxChunkSize: 65536 });
    l(t, r.length, e, a);
  }
  function l(r, e, a, t) {
    typeof a == "function" && (t = a, a = null), a == null && (a = {}), a.autoClose == null && (a.autoClose = !0), a.lazyEntries == null && (a.lazyEntries = !1), a.decodeStrings == null && (a.decodeStrings = !0);
    var m = !!a.decodeStrings;
    if (a.validateEntrySizes == null && (a.validateEntrySizes = !0), a.strictFileNames == null && (a.strictFileNames = !1), t == null && (t = k), typeof e != "number") throw new Error("expected totalSize parameter to be a number");
    if (e > Number.MAX_SAFE_INTEGER)
      throw new Error("zip file too large. only file sizes up to 2^52 are supported due to JavaScript's Number type being an IEEE 754 double.");
    r.ref();
    var u = 22, p = 65535, w = Math.min(u + p, e), g = j(w), U = e - g.length;
    c(r, g, 0, w, U, function(v) {
      if (v) return t(v);
      for (var A = w - u; A >= 0; A -= 1)
        if (g.readUInt32LE(A) === 101010256) {
          var b = g.slice(A), D = b.readUInt16LE(4);
          if (D !== 0)
            return t(new Error("multi-disk zip files are not supported: found disk number: " + D));
          var Z = b.readUInt16LE(10), B = b.readUInt32LE(16), O = b.readUInt16LE(20), M = b.length - u;
          if (O !== M)
            return t(new Error("invalid comment length. expected: " + M + ". found: " + O));
          var P = m ? Y(b, 22, b.length, !1) : b.slice(22);
          if (!(Z === 65535 || B === 4294967295))
            return t(null, new S(r, B, e, Z, P, a.autoClose, a.lazyEntries, m, a.validateEntrySizes, a.strictFileNames));
          var T = j(20), ee = U + A - T.length;
          c(r, T, 0, T.length, ee, function(J) {
            if (J) return t(J);
            if (T.readUInt32LE(0) !== 117853008)
              return t(new Error("invalid zip64 end of central directory locator signature"));
            var pe = H(T, 8), Q = j(56);
            c(r, Q, 0, Q.length, pe, function(se) {
              return se ? t(se) : Q.readUInt32LE(0) !== 101075792 ? t(new Error("invalid zip64 end of central directory record signature")) : (Z = H(Q, 32), B = H(Q, 48), t(null, new S(r, B, e, Z, P, a.autoClose, a.lazyEntries, m, a.validateEntrySizes, a.strictFileNames)));
            });
          });
          return;
        }
      t(new Error("end of central directory record signature not found"));
    });
  }
  d.inherits(S, y);
  function S(r, e, a, t, m, u, p, w, g, U) {
    var v = this;
    y.call(v), v.reader = r, v.reader.on("error", function(A) {
      n(v, A);
    }), v.reader.once("close", function() {
      v.emit("close");
    }), v.readEntryCursor = e, v.fileSize = a, v.entryCount = t, v.comment = m, v.entriesRead = 0, v.autoClose = !!u, v.lazyEntries = !!p, v.decodeStrings = !!w, v.validateEntrySizes = !!g, v.strictFileNames = !!U, v.isOpen = !0, v.emittedError = !1, v.lazyEntries || v._readEntry();
  }
  S.prototype.close = function() {
    this.isOpen && (this.isOpen = !1, this.reader.unref());
  };
  function i(r, e) {
    r.autoClose && r.close(), n(r, e);
  }
  function n(r, e) {
    r.emittedError || (r.emittedError = !0, r.emit("error", e));
  }
  S.prototype.readEntry = function() {
    if (!this.lazyEntries) throw new Error("readEntry() called without lazyEntries:true");
    this._readEntry();
  }, S.prototype._readEntry = function() {
    var r = this;
    if (r.entryCount === r.entriesRead) {
      setImmediate(function() {
        r.autoClose && r.close(), !r.emittedError && r.emit("end");
      });
      return;
    }
    if (!r.emittedError) {
      var e = j(46);
      c(r.reader, e, 0, e.length, r.readEntryCursor, function(a) {
        if (a) return i(r, a);
        if (!r.emittedError) {
          var t = new s(), m = e.readUInt32LE(0);
          if (m !== 33639248) return i(r, new Error("invalid central directory file header signature: 0x" + m.toString(16)));
          if (t.versionMadeBy = e.readUInt16LE(4), t.versionNeededToExtract = e.readUInt16LE(6), t.generalPurposeBitFlag = e.readUInt16LE(8), t.compressionMethod = e.readUInt16LE(10), t.lastModFileTime = e.readUInt16LE(12), t.lastModFileDate = e.readUInt16LE(14), t.crc32 = e.readUInt32LE(16), t.compressedSize = e.readUInt32LE(20), t.uncompressedSize = e.readUInt32LE(24), t.fileNameLength = e.readUInt16LE(28), t.extraFieldLength = e.readUInt16LE(30), t.fileCommentLength = e.readUInt16LE(32), t.internalFileAttributes = e.readUInt16LE(36), t.externalFileAttributes = e.readUInt32LE(38), t.relativeOffsetOfLocalHeader = e.readUInt32LE(42), t.generalPurposeBitFlag & 64) return i(r, new Error("strong encryption is not supported"));
          r.readEntryCursor += 46, e = j(t.fileNameLength + t.extraFieldLength + t.fileCommentLength), c(r.reader, e, 0, e.length, r.readEntryCursor, function(u) {
            if (u) return i(r, u);
            if (!r.emittedError) {
              var p = (t.generalPurposeBitFlag & 2048) !== 0;
              t.fileName = r.decodeStrings ? Y(e, 0, t.fileNameLength, p) : e.slice(0, t.fileNameLength);
              var w = t.fileNameLength + t.extraFieldLength, g = e.slice(t.fileNameLength, w);
              t.extraFields = [];
              for (var U = 0; U < g.length - 3; ) {
                var v = g.readUInt16LE(U + 0), A = g.readUInt16LE(U + 2), b = U + 4, D = b + A;
                if (D > g.length) return i(r, new Error("extra field length exceeds extra field buffer size"));
                var Z = j(A);
                g.copy(Z, 0, b, D), t.extraFields.push({
                  id: v,
                  data: Z
                }), U = D;
              }
              if (t.fileComment = r.decodeStrings ? Y(e, w, w + t.fileCommentLength, p) : e.slice(w, w + t.fileCommentLength), t.comment = t.fileComment, r.readEntryCursor += e.length, r.entriesRead += 1, t.uncompressedSize === 4294967295 || t.compressedSize === 4294967295 || t.relativeOffsetOfLocalHeader === 4294967295) {
                for (var B = null, U = 0; U < t.extraFields.length; U++) {
                  var O = t.extraFields[U];
                  if (O.id === 1) {
                    B = O.data;
                    break;
                  }
                }
                if (B == null)
                  return i(r, new Error("expected zip64 extended information extra field"));
                var M = 0;
                if (t.uncompressedSize === 4294967295) {
                  if (M + 8 > B.length)
                    return i(r, new Error("zip64 extended information extra field does not include uncompressed size"));
                  t.uncompressedSize = H(B, M), M += 8;
                }
                if (t.compressedSize === 4294967295) {
                  if (M + 8 > B.length)
                    return i(r, new Error("zip64 extended information extra field does not include compressed size"));
                  t.compressedSize = H(B, M), M += 8;
                }
                if (t.relativeOffsetOfLocalHeader === 4294967295) {
                  if (M + 8 > B.length)
                    return i(r, new Error("zip64 extended information extra field does not include relative header offset"));
                  t.relativeOffsetOfLocalHeader = H(B, M), M += 8;
                }
              }
              if (r.decodeStrings)
                for (var U = 0; U < t.extraFields.length; U++) {
                  var O = t.extraFields[U];
                  if (O.id === 28789) {
                    if (O.data.length < 6 || O.data.readUInt8(0) !== 1)
                      continue;
                    var P = O.data.readUInt32LE(1);
                    if (f.unsigned(e.slice(0, t.fileNameLength)) !== P)
                      continue;
                    t.fileName = Y(O.data, 5, O.data.length, !0);
                    break;
                  }
                }
              if (r.validateEntrySizes && t.compressionMethod === 0) {
                var T = t.uncompressedSize;
                if (t.isEncrypted() && (T += 12), t.compressedSize !== T) {
                  var ee = "compressed/uncompressed size mismatch for stored file: " + t.compressedSize + " != " + t.uncompressedSize;
                  return i(r, new Error(ee));
                }
              }
              if (r.decodeStrings) {
                r.strictFileNames || (t.fileName = t.fileName.replace(/\\/g, "/"));
                var J = z(t.fileName, r.validateFileNameOptions);
                if (J != null) return i(r, new Error(J));
              }
              r.emit("entry", t), r.lazyEntries || r._readEntry();
            }
          });
        }
      });
    }
  }, S.prototype.openReadStream = function(r, e, a) {
    var t = this, m = 0, u = r.compressedSize;
    if (a == null)
      a = e, e = {};
    else {
      if (e.decrypt != null) {
        if (!r.isEncrypted())
          throw new Error("options.decrypt can only be specified for encrypted entries");
        if (e.decrypt !== !1) throw new Error("invalid options.decrypt value: " + e.decrypt);
        if (r.isCompressed() && e.decompress !== !1)
          throw new Error("entry is encrypted and compressed, and options.decompress !== false");
      }
      if (e.decompress != null) {
        if (!r.isCompressed())
          throw new Error("options.decompress can only be specified for compressed entries");
        if (!(e.decompress === !1 || e.decompress === !0))
          throw new Error("invalid options.decompress value: " + e.decompress);
      }
      if (e.start != null || e.end != null) {
        if (r.isCompressed() && e.decompress !== !1)
          throw new Error("start/end range not allowed for compressed entry without options.decompress === false");
        if (r.isEncrypted() && e.decrypt !== !1)
          throw new Error("start/end range not allowed for encrypted entry without options.decrypt === false");
      }
      if (e.start != null) {
        if (m = e.start, m < 0) throw new Error("options.start < 0");
        if (m > r.compressedSize) throw new Error("options.start > entry.compressedSize");
      }
      if (e.end != null) {
        if (u = e.end, u < 0) throw new Error("options.end < 0");
        if (u > r.compressedSize) throw new Error("options.end > entry.compressedSize");
        if (u < m) throw new Error("options.end < options.start");
      }
    }
    if (!t.isOpen) return a(new Error("closed"));
    if (r.isEncrypted() && e.decrypt !== !1)
      return a(new Error("entry is encrypted, and options.decrypt !== false"));
    t.reader.ref();
    var p = j(30);
    c(t.reader, p, 0, p.length, r.relativeOffsetOfLocalHeader, function(w) {
      try {
        if (w) return a(w);
        var g = p.readUInt32LE(0);
        if (g !== 67324752)
          return a(new Error("invalid local file header signature: 0x" + g.toString(16)));
        var U = p.readUInt16LE(26), v = p.readUInt16LE(28), A = r.relativeOffsetOfLocalHeader + p.length + U + v, b;
        if (r.compressionMethod === 0)
          b = !1;
        else if (r.compressionMethod === 8)
          b = e.decompress != null ? e.decompress : !0;
        else
          return a(new Error("unsupported compression method: " + r.compressionMethod));
        var D = A, Z = D + r.compressedSize;
        if (r.compressedSize !== 0 && Z > t.fileSize)
          return a(new Error("file data overflows file bounds: " + D + " + " + r.compressedSize + " > " + t.fileSize));
        var B = t.reader.createReadStream({
          start: D + m,
          end: D + u
        }), O = B;
        if (b) {
          var M = !1, P = L.createInflateRaw();
          B.on("error", function(T) {
            setImmediate(function() {
              M || P.emit("error", T);
            });
          }), B.pipe(P), t.validateEntrySizes ? (O = new C(r.uncompressedSize), P.on("error", function(T) {
            setImmediate(function() {
              M || O.emit("error", T);
            });
          }), P.pipe(O)) : O = P, O.destroy = function() {
            M = !0, P !== O && P.unpipe(O), B.unpipe(P), B.destroy();
          };
        }
        a(null, O);
      } finally {
        t.reader.unref();
      }
    });
  };
  function s() {
  }
  s.prototype.getLastModDate = function() {
    return o(this.lastModFileDate, this.lastModFileTime);
  }, s.prototype.isEncrypted = function() {
    return (this.generalPurposeBitFlag & 1) !== 0;
  }, s.prototype.isCompressed = function() {
    return this.compressionMethod === 8;
  };
  function o(r, e) {
    var a = r & 31, t = (r >> 5 & 15) - 1, m = (r >> 9 & 127) + 1980, u = 0, p = (e & 31) * 2, w = e >> 5 & 63, g = e >> 11 & 31;
    return new Date(m, t, a, g, w, p, u);
  }
  function z(r) {
    return r.indexOf("\\") !== -1 ? "invalid characters in fileName: " + r : /^[a-zA-Z]:/.test(r) || /^\//.test(r) ? "absolute path: " + r : r.split("/").indexOf("..") !== -1 ? "invalid relative path: " + r : null;
  }
  function c(r, e, a, t, m, u) {
    if (t === 0)
      return setImmediate(function() {
        u(null, j(0));
      });
    r.read(e, a, t, m, function(p, w) {
      if (p) return u(p);
      if (w < t)
        return u(new Error("unexpected EOF"));
      u();
    });
  }
  d.inherits(C, F);
  function C(r) {
    F.call(this), this.actualByteCount = 0, this.expectedByteCount = r;
  }
  C.prototype._transform = function(r, e, a) {
    if (this.actualByteCount += r.length, this.actualByteCount > this.expectedByteCount) {
      var t = "too many bytes in the stream. expected " + this.expectedByteCount + ". got at least " + this.actualByteCount;
      return a(new Error(t));
    }
    a(null, r);
  }, C.prototype._flush = function(r) {
    if (this.actualByteCount < this.expectedByteCount) {
      var e = "not enough bytes in the stream. expected " + this.expectedByteCount + ". got only " + this.actualByteCount;
      return r(new Error(e));
    }
    r();
  }, d.inherits(I, y);
  function I() {
    y.call(this), this.refCount = 0;
  }
  I.prototype.ref = function() {
    this.refCount += 1;
  }, I.prototype.unref = function() {
    var r = this;
    if (r.refCount -= 1, r.refCount > 0) return;
    if (r.refCount < 0) throw new Error("invalid unref");
    r.close(e);
    function e(a) {
      if (a) return r.emit("error", a);
      r.emit("close");
    }
  }, I.prototype.createReadStream = function(r) {
    var e = r.start, a = r.end;
    if (e === a) {
      var t = new N();
      return setImmediate(function() {
        t.end();
      }), t;
    }
    var m = this._readStreamForRange(e, a), u = !1, p = new $(this);
    m.on("error", function(g) {
      setImmediate(function() {
        u || p.emit("error", g);
      });
    }), p.destroy = function() {
      m.unpipe(p), p.unref(), m.destroy();
    };
    var w = new C(a - e);
    return p.on("error", function(g) {
      setImmediate(function() {
        u || w.emit("error", g);
      });
    }), w.destroy = function() {
      u = !0, p.unpipe(w), p.destroy();
    }, m.pipe(p).pipe(w);
  }, I.prototype._readStreamForRange = function(r, e) {
    throw new Error("not implemented");
  }, I.prototype.read = function(r, e, a, t, m) {
    var u = this.createReadStream({ start: t, end: t + a }), p = new E(), w = 0;
    p._write = function(g, U, v) {
      g.copy(r, e + w, 0, g.length), w += g.length, v();
    }, p.on("finish", m), u.on("error", function(g) {
      m(g);
    }), u.pipe(p);
  }, I.prototype.close = function(r) {
    setImmediate(r);
  }, d.inherits($, N);
  function $(r) {
    N.call(this), this.context = r, this.context.ref(), this.unreffedYet = !1;
  }
  $.prototype._flush = function(r) {
    this.unref(), r();
  }, $.prototype.unref = function(r) {
    this.unreffedYet || (this.unreffedYet = !0, this.context.unref());
  };
  var G = "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";
  function Y(r, e, a, t) {
    if (t)
      return r.toString("utf8", e, a);
    for (var m = "", u = e; u < a; u++)
      m += G[r[u]];
    return m;
  }
  function H(r, e) {
    var a = r.readUInt32LE(e), t = r.readUInt32LE(e + 4);
    return t * 4294967296 + a;
  }
  var j;
  typeof Buffer.allocUnsafe == "function" ? j = function(r) {
    return Buffer.allocUnsafe(r);
  } : j = function(r) {
    return new Buffer(r);
  };
  function k(r) {
    if (r) throw r;
  }
  return W;
}
var ie, ce;
function Ue() {
  if (ce) return ie;
  ce = 1;
  const h = ye()("extract-zip"), { createWriteStream: L, promises: x } = ne, f = Fe(), d = xe, { promisify: y } = ae, F = K, N = Ne(), E = y(N.open), _ = y(F.pipeline);
  class q {
    constructor(l, S) {
      this.zipPath = l, this.opts = S;
    }
    async extract() {
      return h("opening", this.zipPath, "with opts", this.opts), this.zipfile = await E(this.zipPath, { lazyEntries: !0 }), this.canceled = !1, new Promise((l, S) => {
        this.zipfile.on("error", (i) => {
          this.canceled = !0, S(i);
        }), this.zipfile.readEntry(), this.zipfile.on("close", () => {
          this.canceled || (h("zip extraction complete"), l());
        }), this.zipfile.on("entry", async (i) => {
          if (this.canceled) {
            h("skipping entry", i.fileName, { cancelled: this.canceled });
            return;
          }
          if (h("zipfile entry", i.fileName), i.fileName.startsWith("__MACOSX/")) {
            this.zipfile.readEntry();
            return;
          }
          const n = d.dirname(d.join(this.opts.dir, i.fileName));
          try {
            await x.mkdir(n, { recursive: !0 });
            const s = await x.realpath(n);
            if (d.relative(this.opts.dir, s).split(d.sep).includes(".."))
              throw new Error(`Out of bound path "${s}" found while processing file ${i.fileName}`);
            await this.extractEntry(i), h("finished processing", i.fileName), this.zipfile.readEntry();
          } catch (s) {
            this.canceled = !0, this.zipfile.close(), S(s);
          }
        });
      });
    }
    async extractEntry(l) {
      if (this.canceled) {
        h("skipping entry extraction", l.fileName, { cancelled: this.canceled });
        return;
      }
      this.opts.onEntry && this.opts.onEntry(l, this.zipfile);
      const S = d.join(this.opts.dir, l.fileName), i = l.externalFileAttributes >> 16 & 65535, n = 61440, s = 16384, z = (i & n) === 40960;
      let c = (i & n) === s;
      !c && l.fileName.endsWith("/") && (c = !0);
      const C = l.versionMadeBy >> 8;
      c || (c = C === 0 && l.externalFileAttributes === 16), h("extracting entry", { filename: l.fileName, isDir: c, isSymlink: z });
      const I = this.getExtractedMode(i, c) & 511, $ = c ? S : d.dirname(S), G = { recursive: !0 };
      if (c && (G.mode = I), h("mkdir", { dir: $, ...G }), await x.mkdir($, G), c) return;
      h("opening read stream", S);
      const Y = await y(this.zipfile.openReadStream.bind(this.zipfile))(l);
      if (z) {
        const H = await f(Y);
        h("creating symlink", H, S), await x.symlink(H, S);
      } else
        await _(Y, L(S, { mode: I }));
    }
    getExtractedMode(l, S) {
      let i = l;
      return i === 0 && (S ? (this.opts.defaultDirMode && (i = parseInt(this.opts.defaultDirMode, 10)), i || (i = 493)) : (this.opts.defaultFileMode && (i = parseInt(this.opts.defaultFileMode, 10)), i || (i = 420))), i;
    }
  }
  return ie = async function(R, l) {
    if (h("creating target directory", l.dir), !d.isAbsolute(l.dir))
      throw new Error("Target directory is expected to be absolute");
    return await x.mkdir(l.dir, { recursive: !0 }), l.dir = await x.realpath(l.dir), new q(R, l).extract();
  }, ie;
}
var me = Ue();
const Oe = /* @__PURE__ */ Ee(me), $e = /* @__PURE__ */ ze({
  __proto__: null,
  default: Oe
}, [me]);
export {
  $e as i
};
