import { a as A, b as R } from "./main-Cwyr03mT.js";
var c, d;
function F() {
  if (d) return c;
  d = 1;
  var l = A(), y = R(), f;
  try {
    f = require("fs");
  } catch {
  }
  var t = function() {
  }, h = typeof process > "u" ? !1 : /^v?\.0/.test(process.version), s = function(r) {
    return typeof r == "function";
  }, m = function(r) {
    return !h || !f ? !1 : (r instanceof (f.ReadStream || t) || r instanceof (f.WriteStream || t)) && s(r.close);
  }, q = function(r) {
    return r.setHeader && s(r.abort);
  }, w = function(r, i, o, e) {
    e = l(e);
    var u = !1;
    r.on("close", function() {
      u = !0;
    }), y(r, { readable: i, writable: o }, function(n) {
      if (n) return e(n);
      u = !0, e();
    });
    var a = !1;
    return function(n) {
      if (!u && !a) {
        if (a = !0, m(r)) return r.close(t);
        if (q(r)) return r.abort();
        if (s(r.destroy)) return r.destroy();
        e(n || new Error("stream was destroyed"));
      }
    };
  }, p = function(r) {
    r();
  }, g = function(r, i) {
    return r.pipe(i);
  }, E = function() {
    var r = Array.prototype.slice.call(arguments), i = s(r[r.length - 1] || t) && r.pop() || t;
    if (Array.isArray(r[0]) && (r = r[0]), r.length < 2) throw new Error("pump requires two streams per minimum");
    var o, e = r.map(function(u, a) {
      var n = a < r.length - 1, S = a > 0;
      return w(u, n, S, function(v) {
        o || (o = v), v && e.forEach(p), !n && (e.forEach(p), i(o));
      });
    });
    return r.reduce(g);
  };
  return c = E, c;
}
export {
  F as r
};
