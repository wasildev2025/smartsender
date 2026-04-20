import { g as i, r as n } from "./main-Cwyr03mT.js";
function a(r, s) {
  for (var o = 0; o < s.length; o++) {
    const e = s[o];
    if (typeof e != "string" && !Array.isArray(e)) {
      for (const t in e)
        if (t !== "default" && !(t in r)) {
          const p = Object.getOwnPropertyDescriptor(e, t);
          p && Object.defineProperty(r, t, p.get ? p : {
            enumerable: !0,
            get: () => e[t]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(r, Symbol.toStringTag, { value: "Module" }));
}
var c = n();
const f = /* @__PURE__ */ i(c), y = /* @__PURE__ */ a({
  __proto__: null,
  default: f
}, [c]);
export {
  y as t
};
