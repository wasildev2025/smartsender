import { Y as q, s as Ne } from "./esm-Cvf0Qn1s.js";
function tt(a, t, e, n) {
  e.assert.notStrictEqual(a, t, n);
}
function ue(a, t) {
  t.assert.strictEqual(typeof a, "string");
}
function Tt(a) {
  return Object.keys(a);
}
function F(a) {
  return !!a && !!a.then && typeof a.then == "function";
}
function xt(a) {
  const e = a.replace(/\s{2,}/g, " ").split(/\s+(?![^[]*]|[^<]*>)/), n = /\.*[\][<>]/g, i = e.shift();
  if (!i)
    throw new Error(`No command found in: ${a}`);
  const r = {
    cmd: i.replace(n, ""),
    demanded: [],
    optional: []
  };
  return e.forEach((o, l) => {
    let u = !1;
    o = o.replace(/\s/g, ""), /\.+[\]>]/.test(o) && l === e.length - 1 && (u = !0), /^\[/.test(o) ? r.optional.push({
      cmd: o.replace(n, "").split("|"),
      variadic: u
    }) : r.demanded.push({
      cmd: o.replace(n, "").split("|"),
      variadic: u
    });
  }), r;
}
const Le = ["first", "second", "third", "fourth", "fifth", "sixth"];
function _(a, t, e) {
  function n() {
    return typeof a == "object" ? [{ demanded: [], optional: [] }, a, t] : [
      xt(`cmd ${a}`),
      t,
      e
    ];
  }
  try {
    let i = 0;
    const [r, o, l] = n(), u = [].slice.call(o);
    for (; u.length && u[u.length - 1] === void 0; )
      u.pop();
    const d = l || u.length;
    if (d < r.demanded.length)
      throw new q(`Not enough arguments provided. Expected ${r.demanded.length} but received ${u.length}.`);
    const c = r.demanded.length + r.optional.length;
    if (d > c)
      throw new q(`Too many arguments provided. Expected max ${c} but received ${d}.`);
    r.demanded.forEach((h) => {
      const f = u.shift(), p = de(f);
      h.cmd.filter((g) => g === p || g === "*").length === 0 && pe(p, h.cmd, i), i += 1;
    }), r.optional.forEach((h) => {
      if (u.length === 0)
        return;
      const f = u.shift(), p = de(f);
      h.cmd.filter((g) => g === p || g === "*").length === 0 && pe(p, h.cmd, i), i += 1;
    });
  } catch (i) {
    console.warn(i.stack);
  }
}
function de(a) {
  return Array.isArray(a) ? "array" : a === null ? "null" : typeof a;
}
function pe(a, t, e) {
  throw new q(`Invalid ${Le[e] || "manyith"} argument. Expected ${t.join(" or ")} but received ${a}.`);
}
class Ve {
  constructor(t) {
    this.globalMiddleware = [], this.frozens = [], this.yargs = t;
  }
  addMiddleware(t, e, n = !0, i = !1) {
    if (_("<array|function> [boolean] [boolean] [boolean]", [t, e, n], arguments.length), Array.isArray(t)) {
      for (let r = 0; r < t.length; r++) {
        if (typeof t[r] != "function")
          throw Error("middleware must be a function");
        const o = t[r];
        o.applyBeforeValidation = e, o.global = n;
      }
      Array.prototype.push.apply(this.globalMiddleware, t);
    } else if (typeof t == "function") {
      const r = t;
      r.applyBeforeValidation = e, r.global = n, r.mutates = i, this.globalMiddleware.push(t);
    }
    return this.yargs;
  }
  addCoerceMiddleware(t, e) {
    const n = this.yargs.getAliases();
    return this.globalMiddleware = this.globalMiddleware.filter((i) => {
      const r = [...n[e] || [], e];
      return i.option ? !r.includes(i.option) : !0;
    }), t.option = e, this.addMiddleware(t, !0, !0, !0);
  }
  getMiddleware() {
    return this.globalMiddleware;
  }
  freeze() {
    this.frozens.push([...this.globalMiddleware]);
  }
  unfreeze() {
    const t = this.frozens.pop();
    t !== void 0 && (this.globalMiddleware = t);
  }
  reset() {
    this.globalMiddleware = this.globalMiddleware.filter((t) => t.global);
  }
}
function Te(a) {
  return a ? a.map((t) => (t.applyBeforeValidation = !1, t)) : [];
}
function $t(a, t, e, n) {
  return e.reduce((i, r) => {
    if (r.applyBeforeValidation !== n)
      return i;
    if (r.mutates) {
      if (r.applied)
        return i;
      r.applied = !0;
    }
    if (F(i))
      return i.then((o) => Promise.all([o, r(o, t)])).then(([o, l]) => Object.assign(o, l));
    {
      const o = r(i, t);
      return F(o) ? o.then((l) => Object.assign(i, l)) : Object.assign(i, o);
    }
  }, a);
}
function Dt(a, t, e = (n) => {
  throw n;
}) {
  try {
    const n = Re(a) ? a() : a;
    return F(n) ? n.then((i) => t(i)) : t(n);
  } catch (n) {
    return e(n);
  }
}
function Re(a) {
  return typeof a == "function";
}
function qe(a) {
  if (typeof require > "u")
    return null;
  for (let t = 0, e = Object.keys(require.cache), n; t < e.length; t++)
    if (n = require.cache[e[t]], n.exports === a)
      return n;
  return null;
}
const Ot = /(^\*)|(^\$0)/;
class Ke {
  constructor(t, e, n, i) {
    this.requireCache = /* @__PURE__ */ new Set(), this.handlers = {}, this.aliasMap = {}, this.frozens = [], this.shim = i, this.usage = t, this.globalMiddleware = n, this.validation = e;
  }
  addDirectory(t, e, n, i) {
    i = i || {}, typeof i.recurse != "boolean" && (i.recurse = !1), Array.isArray(i.extensions) || (i.extensions = ["js"]);
    const r = typeof i.visit == "function" ? i.visit : (o) => o;
    i.visit = (o, l, u) => {
      const d = r(o, l, u);
      if (d) {
        if (this.requireCache.has(l))
          return d;
        this.requireCache.add(l), this.addHandler(d);
      }
      return d;
    }, this.shim.requireDirectory({ require: e, filename: n }, t, i);
  }
  addHandler(t, e, n, i, r, o) {
    let l = [];
    const u = Te(r);
    if (i = i || (() => {
    }), Array.isArray(t))
      if (Je(t))
        [t, ...l] = t;
      else
        for (const d of t)
          this.addHandler(d);
    else if (Xe(t)) {
      let d = Array.isArray(t.command) || typeof t.command == "string" ? t.command : this.moduleName(t);
      t.aliases && (d = [].concat(d).concat(t.aliases)), this.addHandler(d, this.extractDesc(t), t.builder, t.handler, t.middlewares, t.deprecated);
      return;
    } else if (ge(n)) {
      this.addHandler([t].concat(l), e, n.builder, n.handler, n.middlewares, n.deprecated);
      return;
    }
    if (typeof t == "string") {
      const d = xt(t);
      l = l.map((f) => xt(f).cmd);
      let c = !1;
      const h = [d.cmd].concat(l).filter((f) => Ot.test(f) ? (c = !0, !1) : !0);
      h.length === 0 && c && h.push("$0"), c && (d.cmd = h[0], l = h.slice(1), t = t.replace(Ot, d.cmd)), l.forEach((f) => {
        this.aliasMap[f] = d.cmd;
      }), e !== !1 && this.usage.command(t, e, c, l, o), this.handlers[d.cmd] = {
        original: t,
        description: e,
        handler: i,
        builder: n || {},
        middlewares: u,
        deprecated: o,
        demanded: d.demanded,
        optional: d.optional
      }, c && (this.defaultCommand = this.handlers[d.cmd]);
    }
  }
  getCommandHandlers() {
    return this.handlers;
  }
  getCommands() {
    return Object.keys(this.handlers).concat(Object.keys(this.aliasMap));
  }
  hasDefaultCommand() {
    return !!this.defaultCommand;
  }
  runCommand(t, e, n, i, r, o) {
    const l = this.handlers[t] || this.handlers[this.aliasMap[t]] || this.defaultCommand, u = e.getInternalMethods().getContext(), d = u.commands.slice(), c = !t;
    t && (u.commands.push(t), u.fullCommands.push(l.original));
    const h = this.applyBuilderUpdateUsageAndParse(c, l, e, n.aliases, d, i, r, o);
    return F(h) ? h.then((f) => this.applyMiddlewareAndGetResult(c, l, f.innerArgv, u, r, f.aliases, e)) : this.applyMiddlewareAndGetResult(c, l, h.innerArgv, u, r, h.aliases, e);
  }
  applyBuilderUpdateUsageAndParse(t, e, n, i, r, o, l, u) {
    const d = e.builder;
    let c = n;
    if (ie(d)) {
      n.getInternalMethods().getUsageInstance().freeze();
      const h = d(n.getInternalMethods().reset(i), u);
      if (F(h))
        return h.then((f) => (c = pn(f) ? f : n, this.parseAndUpdateUsage(t, e, c, r, o, l)));
    } else Ze(d) && (n.getInternalMethods().getUsageInstance().freeze(), c = n.getInternalMethods().reset(i), Object.keys(e.builder).forEach((h) => {
      c.option(h, d[h]);
    }));
    return this.parseAndUpdateUsage(t, e, c, r, o, l);
  }
  parseAndUpdateUsage(t, e, n, i, r, o) {
    t && n.getInternalMethods().getUsageInstance().unfreeze(!0), this.shouldUpdateUsage(n) && n.getInternalMethods().getUsageInstance().usage(this.usageFromParentCommandsCommandHandler(i, e), e.description);
    const l = n.getInternalMethods().runYargsParserAndExecuteCommands(null, void 0, !0, r, o);
    return F(l) ? l.then((u) => ({
      aliases: n.parsed.aliases,
      innerArgv: u
    })) : {
      aliases: n.parsed.aliases,
      innerArgv: l
    };
  }
  shouldUpdateUsage(t) {
    return !t.getInternalMethods().getUsageInstance().getUsageDisabled() && t.getInternalMethods().getUsageInstance().getUsage().length === 0;
  }
  usageFromParentCommandsCommandHandler(t, e) {
    const n = Ot.test(e.original) ? e.original.replace(Ot, "").trim() : e.original, i = t.filter((r) => !Ot.test(r));
    return i.push(n), `$0 ${i.join(" ")}`;
  }
  handleValidationAndGetResult(t, e, n, i, r, o, l, u) {
    if (!o.getInternalMethods().getHasOutput()) {
      const d = o.getInternalMethods().runValidation(r, u, o.parsed.error, t);
      n = Dt(n, (c) => (d(c), c));
    }
    if (e.handler && !o.getInternalMethods().getHasOutput()) {
      o.getInternalMethods().setHasOutput();
      const d = !!o.getOptions().configuration["populate--"];
      o.getInternalMethods().postProcess(n, d, !1, !1), n = $t(n, o, l, !1), n = Dt(n, (c) => {
        const h = e.handler(c);
        return F(h) ? h.then(() => c) : c;
      }), t || o.getInternalMethods().getUsageInstance().cacheHelpMessage(), F(n) && !o.getInternalMethods().hasParseCallback() && n.catch((c) => {
        try {
          o.getInternalMethods().getUsageInstance().fail(null, c);
        } catch {
        }
      });
    }
    return t || (i.commands.pop(), i.fullCommands.pop()), n;
  }
  applyMiddlewareAndGetResult(t, e, n, i, r, o, l) {
    let u = {};
    if (r)
      return n;
    l.getInternalMethods().getHasOutput() || (u = this.populatePositionals(e, n, i, l));
    const d = this.globalMiddleware.getMiddleware().slice(0).concat(e.middlewares), c = $t(n, l, d, !0);
    return F(c) ? c.then((h) => this.handleValidationAndGetResult(t, e, h, i, o, l, d, u)) : this.handleValidationAndGetResult(t, e, c, i, o, l, d, u);
  }
  populatePositionals(t, e, n, i) {
    e._ = e._.slice(n.commands.length);
    const r = t.demanded.slice(0), o = t.optional.slice(0), l = {};
    for (this.validation.positionalCount(r.length, e._.length); r.length; ) {
      const u = r.shift();
      this.populatePositional(u, e, l);
    }
    for (; o.length; ) {
      const u = o.shift();
      this.populatePositional(u, e, l);
    }
    return e._ = n.commands.concat(e._.map((u) => "" + u)), this.postProcessPositionals(e, l, this.cmdToParseOptions(t.original), i), l;
  }
  populatePositional(t, e, n) {
    const i = t.cmd[0];
    t.variadic ? n[i] = e._.splice(0).map(String) : e._.length && (n[i] = [String(e._.shift())]);
  }
  cmdToParseOptions(t) {
    const e = {
      array: [],
      default: {},
      alias: {},
      demand: {}
    }, n = xt(t);
    return n.demanded.forEach((i) => {
      const [r, ...o] = i.cmd;
      i.variadic && (e.array.push(r), e.default[r] = []), e.alias[r] = o, e.demand[r] = !0;
    }), n.optional.forEach((i) => {
      const [r, ...o] = i.cmd;
      i.variadic && (e.array.push(r), e.default[r] = []), e.alias[r] = o;
    }), e;
  }
  postProcessPositionals(t, e, n, i) {
    const r = Object.assign({}, i.getOptions());
    r.default = Object.assign(n.default, r.default);
    for (const d of Object.keys(n.alias))
      r.alias[d] = (r.alias[d] || []).concat(n.alias[d]);
    r.array = r.array.concat(n.array), r.config = {};
    const o = [];
    if (Object.keys(e).forEach((d) => {
      e[d].map((c) => {
        r.configuration["unknown-options-as-args"] && (r.key[d] = !0), o.push(`--${d}`), o.push(c);
      });
    }), !o.length)
      return;
    const l = Object.assign({}, r.configuration, {
      "populate--": !1
    }), u = this.shim.Parser.detailed(o, Object.assign({}, r, {
      configuration: l
    }));
    if (u.error)
      i.getInternalMethods().getUsageInstance().fail(u.error.message, u.error);
    else {
      const d = Object.keys(e);
      Object.keys(e).forEach((c) => {
        d.push(...u.aliases[c]);
      }), Object.keys(u.argv).forEach((c) => {
        d.includes(c) && (e[c] || (e[c] = u.argv[c]), !this.isInConfigs(i, c) && !this.isDefaulted(i, c) && Object.prototype.hasOwnProperty.call(t, c) && Object.prototype.hasOwnProperty.call(u.argv, c) && (Array.isArray(t[c]) || Array.isArray(u.argv[c])) ? t[c] = [].concat(t[c], u.argv[c]) : t[c] = u.argv[c]);
      });
    }
  }
  isDefaulted(t, e) {
    const { default: n } = t.getOptions();
    return Object.prototype.hasOwnProperty.call(n, e) || Object.prototype.hasOwnProperty.call(n, this.shim.Parser.camelCase(e));
  }
  isInConfigs(t, e) {
    const { configObjects: n } = t.getOptions();
    return n.some((i) => Object.prototype.hasOwnProperty.call(i, e)) || n.some((i) => Object.prototype.hasOwnProperty.call(i, this.shim.Parser.camelCase(e)));
  }
  runDefaultBuilderOn(t) {
    if (!this.defaultCommand)
      return;
    if (this.shouldUpdateUsage(t)) {
      const n = Ot.test(this.defaultCommand.original) ? this.defaultCommand.original : this.defaultCommand.original.replace(/^[^[\]<>]*/, "$0 ");
      t.getInternalMethods().getUsageInstance().usage(n, this.defaultCommand.description);
    }
    const e = this.defaultCommand.builder;
    if (ie(e))
      return e(t, !0);
    ge(e) || Object.keys(e).forEach((n) => {
      t.option(n, e[n]);
    });
  }
  moduleName(t) {
    const e = qe(t);
    if (!e)
      throw new Error(`No command name given for module: ${this.shim.inspect(t)}`);
    return this.commandFromFilename(e.filename);
  }
  commandFromFilename(t) {
    return this.shim.path.basename(t, this.shim.path.extname(t));
  }
  extractDesc({ describe: t, description: e, desc: n }) {
    for (const i of [t, e, n]) {
      if (typeof i == "string" || i === !1)
        return i;
      tt(i, !0, this.shim);
    }
    return !1;
  }
  freeze() {
    this.frozens.push({
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    });
  }
  unfreeze() {
    const t = this.frozens.pop();
    tt(t, void 0, this.shim), {
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    } = t;
  }
  reset() {
    return this.handlers = {}, this.aliasMap = {}, this.defaultCommand = void 0, this.requireCache = /* @__PURE__ */ new Set(), this;
  }
}
function Be(a, t, e, n) {
  return new Ke(a, t, e, n);
}
function ge(a) {
  return typeof a == "object" && !!a.builder && typeof a.handler == "function";
}
function Je(a) {
  return a.every((t) => typeof t == "string");
}
function ie(a) {
  return typeof a == "function";
}
function Ze(a) {
  return typeof a == "object";
}
function Xe(a) {
  return typeof a == "object" && !Array.isArray(a);
}
function zt(a = {}, t = () => !0) {
  const e = {};
  return Tt(a).forEach((n) => {
    t(n, a[n]) && (e[n] = a[n]);
  }), e;
}
function It(a) {
  typeof process > "u" || [process.stdout, process.stderr].forEach((t) => {
    const e = t;
    e._handle && e.isTTY && typeof e._handle.setBlocking == "function" && e._handle.setBlocking(a);
  });
}
function Qe(a) {
  return typeof a == "boolean";
}
function ke(a, t) {
  const e = t.y18n.__, n = {}, i = [];
  n.failFn = function(m) {
    i.push(m);
  };
  let r = null, o = null, l = !0;
  n.showHelpOnFail = function(m = !0, C) {
    const [A, z] = typeof m == "string" ? [!0, m] : [m, C];
    return a.getInternalMethods().isGlobalContext() && (o = z), r = z, l = A, n;
  };
  let u = !1;
  n.fail = function(m, C) {
    const A = a.getInternalMethods().getLoggerInstance();
    if (i.length)
      for (let z = i.length - 1; z >= 0; --z) {
        const N = i[z];
        if (Qe(N)) {
          if (C)
            throw C;
          if (m)
            throw Error(m);
        } else
          N(m, C, n);
      }
    else {
      if (a.getExitProcess() && It(!0), !u) {
        u = !0, l && (a.showHelp("error"), A.error()), (m || C) && A.error(m || C);
        const z = r || o;
        z && ((m || C) && A.error(""), A.error(z));
      }
      if (C = C || new q(m), a.getExitProcess())
        return a.exit(1);
      if (a.getInternalMethods().hasParseCallback())
        return a.exit(1, C);
      throw C;
    }
  };
  let d = [], c = !1;
  n.usage = (j, m) => j === null ? (c = !0, d = [], n) : (c = !1, d.push([j, m || ""]), n), n.getUsage = () => d, n.getUsageDisabled = () => c, n.getPositionalGroupName = () => e("Positionals:");
  let h = [];
  n.example = (j, m) => {
    h.push([j, m || ""]);
  };
  let f = [];
  n.command = function(m, C, A, z, N = !1) {
    A && (f = f.map((x) => (x[2] = !1, x))), f.push([m, C || "", A, z, N]);
  }, n.getCommands = () => f;
  let p = {};
  n.describe = function(m, C) {
    Array.isArray(m) ? m.forEach((A) => {
      n.describe(A, C);
    }) : typeof m == "object" ? Object.keys(m).forEach((A) => {
      n.describe(A, m[A]);
    }) : p[m] = C;
  }, n.getDescriptions = () => p;
  let O = [];
  n.epilog = (j) => {
    O.push(j);
  };
  let g = !1, S;
  n.wrap = (j) => {
    g = !0, S = j;
  }, n.getWrap = () => t.getEnv("YARGS_DISABLE_WRAP") ? null : (g || (S = Fe(), g = !0), S);
  const D = "__yargsString__:";
  n.deferY18nLookup = (j) => D + j, n.help = function() {
    if ($)
      return $;
    T();
    const m = a.customScriptName ? a.$0 : t.path.basename(a.$0), C = a.getDemandedOptions(), A = a.getDemandedCommands(), z = a.getDeprecatedOptions(), N = a.getGroups(), x = a.getOptions();
    let L = [];
    L = L.concat(Object.keys(p)), L = L.concat(Object.keys(C)), L = L.concat(Object.keys(A)), L = L.concat(Object.keys(x.default)), L = L.filter(Mt), L = Object.keys(L.reduce((M, H) => (H !== "_" && (M[H] = !0), M), {}));
    const yt = n.getWrap(), v = t.cliui({
      width: yt,
      wrap: !!yt
    });
    if (!c) {
      if (d.length)
        d.forEach((M) => {
          v.div({ text: `${M[0].replace(/\$0/g, m)}` }), M[1] && v.div({ text: `${M[1]}`, padding: [1, 0, 0, 0] });
        }), v.div();
      else if (f.length) {
        let M = null;
        A._ ? M = `${m} <${e("command")}>
` : M = `${m} [${e("command")}]
`, v.div(`${M}`);
      }
    }
    if (f.length > 1 || f.length === 1 && !f[0][2]) {
      v.div(e("Commands:"));
      const M = a.getInternalMethods().getContext(), H = M.commands.length ? `${M.commands.join(" ")} ` : "";
      a.getInternalMethods().getParserConfiguration()["sort-commands"] === !0 && (f = f.sort((E, R) => E[0].localeCompare(R[0])));
      const V = m ? `${m} ` : "";
      f.forEach((E) => {
        const R = `${V}${H}${E[0].replace(/^\$0 ?/, "")}`;
        v.span({
          text: R,
          padding: [0, 2, 0, 2],
          width: I(f, yt, `${m}${H}`) + 4
        }, { text: E[1] });
        const Y = [];
        E[2] && Y.push(`[${e("default")}]`), E[3] && E[3].length && Y.push(`[${e("aliases:")} ${E[3].join(", ")}]`), E[4] && (typeof E[4] == "string" ? Y.push(`[${e("deprecated: %s", E[4])}]`) : Y.push(`[${e("deprecated")}]`)), Y.length ? v.div({
          text: Y.join(" "),
          padding: [0, 0, 0, 2],
          align: "right"
        }) : v.div();
      }), v.div();
    }
    const Rt = (Object.keys(x.alias) || []).concat(Object.keys(a.parsed.newAliases) || []);
    L = L.filter((M) => !a.parsed.newAliases[M] && Rt.every((H) => (x.alias[H] || []).indexOf(M) === -1));
    const qt = e("Options:");
    N[qt] || (N[qt] = []), at(L, x.alias, N, qt);
    const Pt = (M) => /^--/.test(Ht(M)), Kt = Object.keys(N).filter((M) => N[M].length > 0).map((M) => {
      const H = N[M].filter(Mt).map((V) => {
        if (Rt.includes(V))
          return V;
        for (let E = 0, R; (R = Rt[E]) !== void 0; E++)
          if ((x.alias[R] || []).includes(V))
            return R;
        return V;
      });
      return { groupName: M, normalizedKeys: H };
    }).filter(({ normalizedKeys: M }) => M.length > 0).map(({ groupName: M, normalizedKeys: H }) => {
      const V = H.reduce((E, R) => (E[R] = [R].concat(x.alias[R] || []).map((Y) => M === n.getPositionalGroupName() ? Y : (/^[0-9]$/.test(Y) ? x.boolean.includes(R) ? "-" : "--" : Y.length > 1 ? "--" : "-") + Y).sort((Y, st) => Pt(Y) === Pt(st) ? 0 : Pt(Y) ? 1 : -1).join(", "), E), {});
      return { groupName: M, normalizedKeys: H, switches: V };
    });
    if (Kt.filter(({ groupName: M }) => M !== n.getPositionalGroupName()).some(({ normalizedKeys: M, switches: H }) => !M.every((V) => Pt(H[V]))) && Kt.filter(({ groupName: M }) => M !== n.getPositionalGroupName()).forEach(({ normalizedKeys: M, switches: H }) => {
      M.forEach((V) => {
        Pt(H[V]) && (H[V] = tn(H[V], 4));
      });
    }), Kt.forEach(({ groupName: M, normalizedKeys: H, switches: V }) => {
      v.div(M), H.forEach((E) => {
        const R = V[E];
        let Y = p[E] || "", st = null;
        Y.includes(D) && (Y = e(Y.substring(D.length))), x.boolean.includes(E) && (st = `[${e("boolean")}]`), x.count.includes(E) && (st = `[${e("count")}]`), x.string.includes(E) && (st = `[${e("string")}]`), x.normalize.includes(E) && (st = `[${e("string")}]`), x.array.includes(E) && (st = `[${e("array")}]`), x.number.includes(E) && (st = `[${e("number")}]`);
        const Ye = (ce) => typeof ce == "string" ? `[${e("deprecated: %s", ce)}]` : `[${e("deprecated")}]`, fe = [
          E in z ? Ye(z[E]) : null,
          st,
          E in C ? `[${e("required")}]` : null,
          x.choices && x.choices[E] ? `[${e("choices:")} ${n.stringifiedValues(x.choices[E])}]` : null,
          ht(x.default[E], x.defaultDescription[E])
        ].filter(Boolean).join(" ");
        v.span({
          text: Ht(R),
          padding: [0, 2, 0, 2 + me(R)],
          width: I(V, yt) + 4
        }, Y);
        const Ge = a.getInternalMethods().getUsageConfiguration()["hide-types"] === !0;
        fe && !Ge ? v.div({ text: fe, padding: [0, 0, 0, 2], align: "right" }) : v.div();
      }), v.div();
    }), h.length && (v.div(e("Examples:")), h.forEach((M) => {
      M[0] = M[0].replace(/\$0/g, m);
    }), h.forEach((M) => {
      M[1] === "" ? v.div({
        text: M[0],
        padding: [0, 2, 0, 2]
      }) : v.div({
        text: M[0],
        padding: [0, 2, 0, 2],
        width: I(h, yt) + 4
      }, {
        text: M[1]
      });
    }), v.div()), O.length > 0) {
      const M = O.map((H) => H.replace(/\$0/g, m)).join(`
`);
      v.div(`${M}
`);
    }
    return v.toString().replace(/\s*$/, "");
  };
  function I(j, m, C) {
    let A = 0;
    return Array.isArray(j) || (j = Object.values(j).map((z) => [z])), j.forEach((z) => {
      A = Math.max(t.stringWidth(C ? `${C} ${Ht(z[0])}` : Ht(z[0])) + me(z[0]), A);
    }), m && (A = Math.min(A, parseInt((m * 0.5).toString(), 10))), A;
  }
  function T() {
    const j = a.getDemandedOptions(), m = a.getOptions();
    (Object.keys(m.alias) || []).forEach((C) => {
      m.alias[C].forEach((A) => {
        p[A] && n.describe(C, p[A]), A in j && a.demandOption(C, j[A]), m.boolean.includes(A) && a.boolean(C), m.count.includes(A) && a.count(C), m.string.includes(A) && a.string(C), m.normalize.includes(A) && a.normalize(C), m.array.includes(A) && a.array(C), m.number.includes(A) && a.number(C);
      });
    });
  }
  let $;
  n.cacheHelpMessage = function() {
    $ = this.help();
  }, n.clearCachedHelpMessage = function() {
    $ = void 0;
  }, n.hasCachedHelpMessage = function() {
    return !!$;
  };
  function at(j, m, C, A) {
    let z = [], N = null;
    return Object.keys(C).forEach((x) => {
      z = z.concat(C[x]);
    }), j.forEach((x) => {
      N = [x].concat(m[x]), N.some((L) => z.indexOf(L) !== -1) || C[A].push(x);
    }), z;
  }
  function Mt(j) {
    return a.getOptions().hiddenOptions.indexOf(j) < 0 || a.parsed.argv[a.getOptions().showHiddenOpt];
  }
  n.showHelp = (j) => {
    const m = a.getInternalMethods().getLoggerInstance();
    j || (j = "error"), (typeof j == "function" ? j : m[j])(n.help());
  }, n.functionDescription = (j) => ["(", j.name ? t.Parser.decamelize(j.name, "-") : e("generated-value"), ")"].join(""), n.stringifiedValues = function(m, C) {
    let A = "";
    const z = C || ", ", N = [].concat(m);
    return !m || !N.length || N.forEach((x) => {
      A.length && (A += z), A += JSON.stringify(x);
    }), A;
  };
  function ht(j, m) {
    let C = `[${e("default:")} `;
    if (j === void 0 && !m)
      return null;
    if (m)
      C += m;
    else
      switch (typeof j) {
        case "string":
          C += `"${j}"`;
          break;
        case "object":
          C += JSON.stringify(j);
          break;
        default:
          C += j;
      }
    return `${C}]`;
  }
  function Fe() {
    return t.process.stdColumns ? Math.min(80, t.process.stdColumns) : 80;
  }
  let he = null;
  n.version = (j) => {
    he = j;
  }, n.showVersion = (j) => {
    const m = a.getInternalMethods().getLoggerInstance();
    j || (j = "error"), (typeof j == "function" ? j : m[j])(he);
  }, n.reset = function(m) {
    return r = null, u = !1, d = [], c = !1, O = [], h = [], f = [], p = zt(p, (C) => !m[C]), n;
  };
  const le = [];
  return n.freeze = function() {
    le.push({
      failMessage: r,
      failureOutput: u,
      usages: d,
      usageDisabled: c,
      epilogs: O,
      examples: h,
      commands: f,
      descriptions: p
    });
  }, n.unfreeze = function(m = !1) {
    const C = le.pop();
    C && (m ? (p = { ...C.descriptions, ...p }, f = [...C.commands, ...f], d = [...C.usages, ...d], h = [...C.examples, ...h], O = [...C.epilogs, ...O]) : {
      failMessage: r,
      failureOutput: u,
      usages: d,
      usageDisabled: c,
      epilogs: O,
      examples: h,
      commands: f,
      descriptions: p
    } = C);
  }, n;
}
function ae(a) {
  return typeof a == "object";
}
function tn(a, t) {
  return ae(a) ? { text: a.text, indentation: a.indentation + t } : { text: a, indentation: t };
}
function me(a) {
  return ae(a) ? a.indentation : 0;
}
function Ht(a) {
  return ae(a) ? a.text : a;
}
const en = `###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc
#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.
#
_{{app_name}}_yargs_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    type_list=$({{app_path}} --get-yargs-completions "\${args[@]}")

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o bashdefault -o default -F _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`, nn = `#compdef {{app_name}}
###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc
#    or {{app_path}} {{completion_command}} >> ~/.zprofile on OSX.
#
_{{app_name}}_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "\${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;
class sn {
  constructor(t, e, n, i) {
    var r, o, l;
    this.yargs = t, this.usage = e, this.command = n, this.shim = i, this.completionKey = "get-yargs-completions", this.aliases = null, this.customCompletionFunction = null, this.indexAfterLastReset = 0, this.zshShell = (l = ((r = this.shim.getEnv("SHELL")) === null || r === void 0 ? void 0 : r.includes("zsh")) || ((o = this.shim.getEnv("ZSH_NAME")) === null || o === void 0 ? void 0 : o.includes("zsh"))) !== null && l !== void 0 ? l : !1;
  }
  defaultCompletion(t, e, n, i) {
    const r = this.command.getCommandHandlers();
    for (let l = 0, u = t.length; l < u; ++l)
      if (r[t[l]] && r[t[l]].builder) {
        const d = r[t[l]].builder;
        if (ie(d)) {
          this.indexAfterLastReset = l + 1;
          const c = this.yargs.getInternalMethods().reset();
          return d(c, !0), c.argv;
        }
      }
    const o = [];
    this.commandCompletions(o, t, n), this.optionCompletions(o, t, e, n), this.choicesFromOptionsCompletions(o, t, e, n), this.choicesFromPositionalsCompletions(o, t, e, n), i(null, o);
  }
  commandCompletions(t, e, n) {
    const i = this.yargs.getInternalMethods().getContext().commands;
    !n.match(/^-/) && i[i.length - 1] !== n && !this.previousArgHasChoices(e) && this.usage.getCommands().forEach((r) => {
      const o = xt(r[0]).cmd;
      if (e.indexOf(o) === -1)
        if (!this.zshShell)
          t.push(o);
        else {
          const l = r[1] || "";
          t.push(o.replace(/:/g, "\\:") + ":" + l);
        }
    });
  }
  optionCompletions(t, e, n, i) {
    if ((i.match(/^-/) || i === "" && t.length === 0) && !this.previousArgHasChoices(e)) {
      const r = this.yargs.getOptions(), o = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
      Object.keys(r.key).forEach((l) => {
        const u = !!r.configuration["boolean-negation"] && r.boolean.includes(l);
        !o.includes(l) && !r.hiddenOptions.includes(l) && !this.argsContainKey(e, l, u) && this.completeOptionKey(l, t, i, u && !!r.default[l]);
      });
    }
  }
  choicesFromOptionsCompletions(t, e, n, i) {
    if (this.previousArgHasChoices(e)) {
      const r = this.getPreviousArgChoices(e);
      r && r.length > 0 && t.push(...r.map((o) => o.replace(/:/g, "\\:")));
    }
  }
  choicesFromPositionalsCompletions(t, e, n, i) {
    if (i === "" && t.length > 0 && this.previousArgHasChoices(e))
      return;
    const r = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [], o = Math.max(this.indexAfterLastReset, this.yargs.getInternalMethods().getContext().commands.length + 1), l = r[n._.length - o - 1];
    if (!l)
      return;
    const u = this.yargs.getOptions().choices[l] || [];
    for (const d of u)
      d.startsWith(i) && t.push(d.replace(/:/g, "\\:"));
  }
  getPreviousArgChoices(t) {
    if (t.length < 1)
      return;
    let e = t[t.length - 1], n = "";
    if (!e.startsWith("-") && t.length > 1 && (n = e, e = t[t.length - 2]), !e.startsWith("-"))
      return;
    const i = e.replace(/^-+/, ""), r = this.yargs.getOptions(), o = [
      i,
      ...this.yargs.getAliases()[i] || []
    ];
    let l;
    for (const u of o)
      if (Object.prototype.hasOwnProperty.call(r.key, u) && Array.isArray(r.choices[u])) {
        l = r.choices[u];
        break;
      }
    if (l)
      return l.filter((u) => !n || u.startsWith(n));
  }
  previousArgHasChoices(t) {
    const e = this.getPreviousArgChoices(t);
    return e !== void 0 && e.length > 0;
  }
  argsContainKey(t, e, n) {
    const i = (r) => t.indexOf((/^[^0-9]$/.test(r) ? "-" : "--") + r) !== -1;
    if (i(e) || n && i(`no-${e}`))
      return !0;
    if (this.aliases) {
      for (const r of this.aliases[e])
        if (i(r))
          return !0;
    }
    return !1;
  }
  completeOptionKey(t, e, n, i) {
    var r, o, l, u;
    let d = t;
    if (this.zshShell) {
      const p = this.usage.getDescriptions(), O = (o = (r = this === null || this === void 0 ? void 0 : this.aliases) === null || r === void 0 ? void 0 : r[t]) === null || o === void 0 ? void 0 : o.find((D) => {
        const I = p[D];
        return typeof I == "string" && I.length > 0;
      }), g = O ? p[O] : void 0, S = (u = (l = p[t]) !== null && l !== void 0 ? l : g) !== null && u !== void 0 ? u : "";
      d = `${t.replace(/:/g, "\\:")}:${S.replace("__yargsString__:", "").replace(/(\r\n|\n|\r)/gm, " ")}`;
    }
    const c = (p) => /^--/.test(p), h = (p) => /^[^0-9]$/.test(p), f = !c(n) && h(t) ? "-" : "--";
    e.push(f + d), i && e.push(f + "no-" + d);
  }
  customCompletion(t, e, n, i) {
    if (tt(this.customCompletionFunction, null, this.shim), on(this.customCompletionFunction)) {
      const r = this.customCompletionFunction(n, e);
      return F(r) ? r.then((o) => {
        this.shim.process.nextTick(() => {
          i(null, o);
        });
      }).catch((o) => {
        this.shim.process.nextTick(() => {
          i(o, void 0);
        });
      }) : i(null, r);
    } else return an(this.customCompletionFunction) ? this.customCompletionFunction(n, e, (r = i) => this.defaultCompletion(t, e, n, r), (r) => {
      i(null, r);
    }) : this.customCompletionFunction(n, e, (r) => {
      i(null, r);
    });
  }
  getCompletion(t, e) {
    const n = t.length ? t[t.length - 1] : "", i = this.yargs.parse(t, !0), r = this.customCompletionFunction ? (o) => this.customCompletion(t, o, n, e) : (o) => this.defaultCompletion(t, o, n, e);
    return F(i) ? i.then(r) : r(i);
  }
  generateCompletionScript(t, e) {
    let n = this.zshShell ? nn : en;
    const i = this.shim.path.basename(t);
    return t.match(/\.js$/) && (t = `./${t}`), n = n.replace(/{{app_name}}/g, i), n = n.replace(/{{completion_command}}/g, e), n.replace(/{{app_path}}/g, t);
  }
  registerFunction(t) {
    this.customCompletionFunction = t;
  }
  setParsed(t) {
    this.aliases = t.aliases;
  }
}
function rn(a, t, e, n) {
  return new sn(a, t, e, n);
}
function on(a) {
  return a.length < 3;
}
function an(a) {
  return a.length > 3;
}
function hn(a, t) {
  if (a.length === 0)
    return t.length;
  if (t.length === 0)
    return a.length;
  const e = [];
  let n;
  for (n = 0; n <= t.length; n++)
    e[n] = [n];
  let i;
  for (i = 0; i <= a.length; i++)
    e[0][i] = i;
  for (n = 1; n <= t.length; n++)
    for (i = 1; i <= a.length; i++)
      t.charAt(n - 1) === a.charAt(i - 1) ? e[n][i] = e[n - 1][i - 1] : n > 1 && i > 1 && t.charAt(n - 2) === a.charAt(i - 1) && t.charAt(n - 1) === a.charAt(i - 2) ? e[n][i] = e[n - 2][i - 2] + 1 : e[n][i] = Math.min(e[n - 1][i - 1] + 1, Math.min(e[n][i - 1] + 1, e[n - 1][i] + 1));
  return e[t.length][a.length];
}
const be = ["$0", "--", "_"];
function ln(a, t, e) {
  const n = e.y18n.__, i = e.y18n.__n, r = {};
  r.nonOptionCount = function(h) {
    const f = a.getDemandedCommands(), O = h._.length + (h["--"] ? h["--"].length : 0) - a.getInternalMethods().getContext().commands.length;
    f._ && (O < f._.min || O > f._.max) && (O < f._.min ? f._.minMsg !== void 0 ? t.fail(f._.minMsg ? f._.minMsg.replace(/\$0/g, O.toString()).replace(/\$1/, f._.min.toString()) : null) : t.fail(i("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", O, O.toString(), f._.min.toString())) : O > f._.max && (f._.maxMsg !== void 0 ? t.fail(f._.maxMsg ? f._.maxMsg.replace(/\$0/g, O.toString()).replace(/\$1/, f._.max.toString()) : null) : t.fail(i("Too many non-option arguments: got %s, maximum of %s", "Too many non-option arguments: got %s, maximum of %s", O, O.toString(), f._.max.toString()))));
  }, r.positionalCount = function(h, f) {
    f < h && t.fail(i("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", f, f + "", h + ""));
  }, r.requiredArguments = function(h, f) {
    let p = null;
    for (const O of Object.keys(f))
      (!Object.prototype.hasOwnProperty.call(h, O) || typeof h[O] > "u") && (p = p || {}, p[O] = f[O]);
    if (p) {
      const O = [];
      for (const S of Object.keys(p)) {
        const D = p[S];
        D && O.indexOf(D) < 0 && O.push(D);
      }
      const g = O.length ? `
${O.join(`
`)}` : "";
      t.fail(i("Missing required argument: %s", "Missing required arguments: %s", Object.keys(p).length, Object.keys(p).join(", ") + g));
    }
  }, r.unknownArguments = function(h, f, p, O, g = !0) {
    var S;
    const D = a.getInternalMethods().getCommandInstance().getCommands(), I = [], T = a.getInternalMethods().getContext();
    if (Object.keys(h).forEach(($) => {
      !be.includes($) && !Object.prototype.hasOwnProperty.call(p, $) && !Object.prototype.hasOwnProperty.call(a.getInternalMethods().getParseContext(), $) && !r.isValidAndSomeAliasIsNotNew($, f) && I.push($);
    }), g && (T.commands.length > 0 || D.length > 0 || O) && h._.slice(T.commands.length).forEach(($) => {
      D.includes("" + $) || I.push("" + $);
    }), g) {
      const at = ((S = a.getDemandedCommands()._) === null || S === void 0 ? void 0 : S.max) || 0, Mt = T.commands.length + at;
      Mt < h._.length && h._.slice(Mt).forEach((ht) => {
        ht = String(ht), !T.commands.includes(ht) && !I.includes(ht) && I.push(ht);
      });
    }
    I.length && t.fail(i("Unknown argument: %s", "Unknown arguments: %s", I.length, I.map(($) => $.trim() ? $ : `"${$}"`).join(", ")));
  }, r.unknownCommands = function(h) {
    const f = a.getInternalMethods().getCommandInstance().getCommands(), p = [], O = a.getInternalMethods().getContext();
    return (O.commands.length > 0 || f.length > 0) && h._.slice(O.commands.length).forEach((g) => {
      f.includes("" + g) || p.push("" + g);
    }), p.length > 0 ? (t.fail(i("Unknown command: %s", "Unknown commands: %s", p.length, p.join(", "))), !0) : !1;
  }, r.isValidAndSomeAliasIsNotNew = function(h, f) {
    if (!Object.prototype.hasOwnProperty.call(f, h))
      return !1;
    const p = a.parsed.newAliases;
    return [h, ...f[h]].some((O) => !Object.prototype.hasOwnProperty.call(p, O) || !p[h]);
  }, r.limitedChoices = function(h) {
    const f = a.getOptions(), p = {};
    if (!Object.keys(f.choices).length)
      return;
    Object.keys(h).forEach((S) => {
      be.indexOf(S) === -1 && Object.prototype.hasOwnProperty.call(f.choices, S) && [].concat(h[S]).forEach((D) => {
        f.choices[S].indexOf(D) === -1 && D !== void 0 && (p[S] = (p[S] || []).concat(D));
      });
    });
    const O = Object.keys(p);
    if (!O.length)
      return;
    let g = n("Invalid values:");
    O.forEach((S) => {
      g += `
  ${n("Argument: %s, Given: %s, Choices: %s", S, t.stringifiedValues(p[S]), t.stringifiedValues(f.choices[S]))}`;
    }), t.fail(g);
  };
  let o = {};
  r.implies = function(h, f) {
    _("<string|object> [array|number|string]", [h, f], arguments.length), typeof h == "object" ? Object.keys(h).forEach((p) => {
      r.implies(p, h[p]);
    }) : (a.global(h), o[h] || (o[h] = []), Array.isArray(f) ? f.forEach((p) => r.implies(h, p)) : (tt(f, void 0, e), o[h].push(f)));
  }, r.getImplied = function() {
    return o;
  };
  function l(c, h) {
    const f = Number(h);
    return h = isNaN(f) ? h : f, typeof h == "number" ? h = c._.length >= h : h.match(/^--no-.+/) ? (h = h.match(/^--no-(.+)/)[1], h = !Object.prototype.hasOwnProperty.call(c, h)) : h = Object.prototype.hasOwnProperty.call(c, h), h;
  }
  r.implications = function(h) {
    const f = [];
    if (Object.keys(o).forEach((p) => {
      const O = p;
      (o[p] || []).forEach((g) => {
        let S = O;
        const D = g;
        S = l(h, S), g = l(h, g), S && !g && f.push(` ${O} -> ${D}`);
      });
    }), f.length) {
      let p = `${n("Implications failed:")}
`;
      f.forEach((O) => {
        p += O;
      }), t.fail(p);
    }
  };
  let u = {};
  r.conflicts = function(h, f) {
    _("<string|object> [array|string]", [h, f], arguments.length), typeof h == "object" ? Object.keys(h).forEach((p) => {
      r.conflicts(p, h[p]);
    }) : (a.global(h), u[h] || (u[h] = []), Array.isArray(f) ? f.forEach((p) => r.conflicts(h, p)) : u[h].push(f));
  }, r.getConflicting = () => u, r.conflicting = function(h) {
    Object.keys(h).forEach((f) => {
      u[f] && u[f].forEach((p) => {
        p && h[f] !== void 0 && h[p] !== void 0 && t.fail(n("Arguments %s and %s are mutually exclusive", f, p));
      });
    }), a.getInternalMethods().getParserConfiguration()["strip-dashed"] && Object.keys(u).forEach((f) => {
      u[f].forEach((p) => {
        p && h[e.Parser.camelCase(f)] !== void 0 && h[e.Parser.camelCase(p)] !== void 0 && t.fail(n("Arguments %s and %s are mutually exclusive", f, p));
      });
    });
  }, r.recommendCommands = function(h, f) {
    f = f.sort((S, D) => D.length - S.length);
    let O = null, g = 1 / 0;
    for (let S = 0, D; (D = f[S]) !== void 0; S++) {
      const I = hn(h, D);
      I <= 3 && I < g && (g = I, O = D);
    }
    O && t.fail(n("Did you mean %s?", O));
  }, r.reset = function(h) {
    return o = zt(o, (f) => !h[f]), u = zt(u, (f) => !h[f]), r;
  };
  const d = [];
  return r.freeze = function() {
    d.push({
      implied: o,
      conflicting: u
    });
  }, r.unfreeze = function() {
    const h = d.pop();
    tt(h, void 0, e), { implied: o, conflicting: u } = h;
  }, r;
}
let re = [], Et;
function oe(a, t, e, n) {
  Et = n;
  let i = {};
  if (Object.prototype.hasOwnProperty.call(a, "extends")) {
    if (typeof a.extends != "string")
      return i;
    const r = /\.json|\..*rc$/.test(a.extends);
    let o = null;
    if (r)
      o = cn(t, a.extends);
    else
      try {
        o = require.resolve(a.extends);
      } catch {
        return a;
      }
    fn(o), re.push(o), i = r ? JSON.parse(Et.readFileSync(o, "utf8")) : require(a.extends), delete a.extends, i = oe(i, Et.path.dirname(o), e, Et);
  }
  return re = [], e ? ve(i, a) : Object.assign({}, i, a);
}
function fn(a) {
  if (re.indexOf(a) > -1)
    throw new q(`Circular extended configurations: '${a}'.`);
}
function cn(a, t) {
  return Et.path.resolve(a, t);
}
function ve(a, t) {
  const e = {};
  function n(i) {
    return i && typeof i == "object" && !Array.isArray(i);
  }
  Object.assign(e, a);
  for (const i of Object.keys(t))
    n(t[i]) && n(e[i]) ? e[i] = ve(a[i], t[i]) : e[i] = t[i];
  return e;
}
var b = function(a, t, e, n, i) {
  if (n === "m") throw new TypeError("Private method is not writable");
  if (n === "a" && !i) throw new TypeError("Private accessor was defined without a setter");
  if (typeof t == "function" ? a !== t || !i : !t.has(a)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return n === "a" ? i.call(a, e) : i ? i.value = e : t.set(a, e), e;
}, s = function(a, t, e, n) {
  if (e === "a" && !n) throw new TypeError("Private accessor was defined without a getter");
  if (typeof t == "function" ? a !== t || !n : !t.has(a)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e === "m" ? n : e === "a" ? n.call(a) : n ? n.value : t.get(a);
}, U, lt, At, Z, K, Wt, it, ft, Ut, X, vt, Q, et, B, k, Ft, wt, G, w, Yt, Gt, J, ct, Ct, ut, rt, Nt, y, dt, pt, gt, P, Lt, nt, W;
function un(a) {
  return (t = [], e = a.process.cwd(), n) => {
    const i = new dn(t, e, n, a);
    return Object.defineProperty(i, "argv", {
      get: () => i.parse(),
      enumerable: !0
    }), i.help(), i.version(), i;
  };
}
const _e = Symbol("copyDoubleDash"), Oe = Symbol("copyDoubleDash"), Bt = Symbol("deleteFromParserHintObject"), we = Symbol("emitWarning"), Ce = Symbol("freeze"), je = Symbol("getDollarZero"), mt = Symbol("getParserConfiguration"), Me = Symbol("getUsageConfiguration"), Jt = Symbol("guessLocale"), ye = Symbol("guessVersion"), Pe = Symbol("parsePositionalNumbers"), Zt = Symbol("pkgUp"), ot = Symbol("populateParserHintArray"), jt = Symbol("populateParserHintSingleValueDictionary"), Xt = Symbol("populateParserHintArrayDictionary"), Qt = Symbol("populateParserHintDictionary"), kt = Symbol("sanitizeKey"), te = Symbol("setKey"), ee = Symbol("unfreeze"), Ae = Symbol("validateAsync"), Se = Symbol("getCommandInstance"), Ie = Symbol("getContext"), Ee = Symbol("getHasOutput"), xe = Symbol("getLoggerInstance"), $e = Symbol("getParseContext"), De = Symbol("getUsageInstance"), ze = Symbol("getValidationInstance"), Vt = Symbol("hasParseCallback"), He = Symbol("isGlobalContext"), bt = Symbol("postProcess"), We = Symbol("rebase"), ne = Symbol("reset"), St = Symbol("runYargsParserAndExecuteCommands"), se = Symbol("runValidation"), Ue = Symbol("setHasOutput"), _t = Symbol("kTrackManuallySetKeys");
class dn {
  constructor(t = [], e, n, i) {
    this.customScriptName = !1, this.parsed = !1, U.set(this, void 0), lt.set(this, void 0), At.set(this, { commands: [], fullCommands: [] }), Z.set(this, null), K.set(this, null), Wt.set(this, "show-hidden"), it.set(this, null), ft.set(this, !0), Ut.set(this, {}), X.set(this, !0), vt.set(this, []), Q.set(this, void 0), et.set(this, {}), B.set(this, !1), k.set(this, null), Ft.set(this, !0), wt.set(this, void 0), G.set(this, ""), w.set(this, void 0), Yt.set(this, void 0), Gt.set(this, {}), J.set(this, null), ct.set(this, null), Ct.set(this, {}), ut.set(this, {}), rt.set(this, void 0), Nt.set(this, !1), y.set(this, void 0), dt.set(this, !1), pt.set(this, !1), gt.set(this, !1), P.set(this, void 0), Lt.set(this, {}), nt.set(this, null), W.set(this, void 0), b(this, y, i, "f"), b(this, rt, t, "f"), b(this, lt, e, "f"), b(this, Yt, n, "f"), b(this, Q, new Ve(this), "f"), this.$0 = this[je](), this[ne](), b(this, U, s(this, U, "f"), "f"), b(this, P, s(this, P, "f"), "f"), b(this, W, s(this, W, "f"), "f"), b(this, w, s(this, w, "f"), "f"), s(this, w, "f").showHiddenOpt = s(this, Wt, "f"), b(this, wt, this[Oe](), "f");
  }
  addHelpOpt(t, e) {
    const n = "help";
    return _("[string|boolean] [string]", [t, e], arguments.length), s(this, k, "f") && (this[Bt](s(this, k, "f")), b(this, k, null, "f")), t === !1 && e === void 0 ? this : (b(this, k, typeof t == "string" ? t : n, "f"), this.boolean(s(this, k, "f")), this.describe(s(this, k, "f"), e || s(this, P, "f").deferY18nLookup("Show help")), this);
  }
  help(t, e) {
    return this.addHelpOpt(t, e);
  }
  addShowHiddenOpt(t, e) {
    if (_("[string|boolean] [string]", [t, e], arguments.length), t === !1 && e === void 0)
      return this;
    const n = typeof t == "string" ? t : s(this, Wt, "f");
    return this.boolean(n), this.describe(n, e || s(this, P, "f").deferY18nLookup("Show hidden options")), s(this, w, "f").showHiddenOpt = n, this;
  }
  showHidden(t, e) {
    return this.addShowHiddenOpt(t, e);
  }
  alias(t, e) {
    return _("<object|string|array> [string|array]", [t, e], arguments.length), this[Xt](this.alias.bind(this), "alias", t, e), this;
  }
  array(t) {
    return _("<array|string>", [t], arguments.length), this[ot]("array", t), this[_t](t), this;
  }
  boolean(t) {
    return _("<array|string>", [t], arguments.length), this[ot]("boolean", t), this[_t](t), this;
  }
  check(t, e) {
    return _("<function> [boolean]", [t, e], arguments.length), this.middleware((n, i) => Dt(() => t(n, i.getOptions()), (r) => (r ? (typeof r == "string" || r instanceof Error) && s(this, P, "f").fail(r.toString(), r) : s(this, P, "f").fail(s(this, y, "f").y18n.__("Argument check failed: %s", t.toString())), n), (r) => (s(this, P, "f").fail(r.message ? r.message : r.toString(), r), n)), !1, e), this;
  }
  choices(t, e) {
    return _("<object|string|array> [string|array]", [t, e], arguments.length), this[Xt](this.choices.bind(this), "choices", t, e), this;
  }
  coerce(t, e) {
    if (_("<object|string|array> [function]", [t, e], arguments.length), Array.isArray(t)) {
      if (!e)
        throw new q("coerce callback must be provided");
      for (const n of t)
        this.coerce(n, e);
      return this;
    } else if (typeof t == "object") {
      for (const n of Object.keys(t))
        this.coerce(n, t[n]);
      return this;
    }
    if (!e)
      throw new q("coerce callback must be provided");
    return s(this, w, "f").key[t] = !0, s(this, Q, "f").addCoerceMiddleware((n, i) => {
      let r;
      return Object.prototype.hasOwnProperty.call(n, t) ? Dt(() => (r = i.getAliases(), e(n[t])), (l) => {
        n[t] = l;
        const u = i.getInternalMethods().getParserConfiguration()["strip-aliased"];
        if (r[t] && u !== !0)
          for (const d of r[t])
            n[d] = l;
        return n;
      }, (l) => {
        throw new q(l.message);
      }) : n;
    }, t), this;
  }
  conflicts(t, e) {
    return _("<string|object> [string|array]", [t, e], arguments.length), s(this, W, "f").conflicts(t, e), this;
  }
  config(t = "config", e, n) {
    return _("[object|string] [string|function] [function]", [t, e, n], arguments.length), typeof t == "object" && !Array.isArray(t) ? (t = oe(t, s(this, lt, "f"), this[mt]()["deep-merge-config"] || !1, s(this, y, "f")), s(this, w, "f").configObjects = (s(this, w, "f").configObjects || []).concat(t), this) : (typeof e == "function" && (n = e, e = void 0), this.describe(t, e || s(this, P, "f").deferY18nLookup("Path to JSON config file")), (Array.isArray(t) ? t : [t]).forEach((i) => {
      s(this, w, "f").config[i] = n || !0;
    }), this);
  }
  completion(t, e, n) {
    return _("[string] [string|boolean|function] [function]", [t, e, n], arguments.length), typeof e == "function" && (n = e, e = void 0), b(this, K, t || s(this, K, "f") || "completion", "f"), !e && e !== !1 && (e = "generate completion script"), this.command(s(this, K, "f"), e), n && s(this, Z, "f").registerFunction(n), this;
  }
  command(t, e, n, i, r, o) {
    return _("<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]", [t, e, n, i, r, o], arguments.length), s(this, U, "f").addHandler(t, e, n, i, r, o), this;
  }
  commands(t, e, n, i, r, o) {
    return this.command(t, e, n, i, r, o);
  }
  commandDir(t, e) {
    _("<string> [object]", [t, e], arguments.length);
    const n = s(this, Yt, "f") || s(this, y, "f").require;
    return s(this, U, "f").addDirectory(t, n, s(this, y, "f").getCallerFile(), e), this;
  }
  count(t) {
    return _("<array|string>", [t], arguments.length), this[ot]("count", t), this[_t](t), this;
  }
  default(t, e, n) {
    return _("<object|string|array> [*] [string]", [t, e, n], arguments.length), n && (ue(t, s(this, y, "f")), s(this, w, "f").defaultDescription[t] = n), typeof e == "function" && (ue(t, s(this, y, "f")), s(this, w, "f").defaultDescription[t] || (s(this, w, "f").defaultDescription[t] = s(this, P, "f").functionDescription(e)), e = e.call()), this[jt](this.default.bind(this), "default", t, e), this;
  }
  defaults(t, e, n) {
    return this.default(t, e, n);
  }
  demandCommand(t = 1, e, n, i) {
    return _("[number] [number|string] [string|null|undefined] [string|null|undefined]", [t, e, n, i], arguments.length), typeof e != "number" && (n = e, e = 1 / 0), this.global("_", !1), s(this, w, "f").demandedCommands._ = {
      min: t,
      max: e,
      minMsg: n,
      maxMsg: i
    }, this;
  }
  demand(t, e, n) {
    return Array.isArray(e) ? (e.forEach((i) => {
      tt(n, !0, s(this, y, "f")), this.demandOption(i, n);
    }), e = 1 / 0) : typeof e != "number" && (n = e, e = 1 / 0), typeof t == "number" ? (tt(n, !0, s(this, y, "f")), this.demandCommand(t, e, n, n)) : Array.isArray(t) ? t.forEach((i) => {
      tt(n, !0, s(this, y, "f")), this.demandOption(i, n);
    }) : typeof n == "string" ? this.demandOption(t, n) : (n === !0 || typeof n > "u") && this.demandOption(t), this;
  }
  demandOption(t, e) {
    return _("<object|string|array> [string]", [t, e], arguments.length), this[jt](this.demandOption.bind(this), "demandedOptions", t, e), this;
  }
  deprecateOption(t, e) {
    return _("<string> [string|boolean]", [t, e], arguments.length), s(this, w, "f").deprecatedOptions[t] = e, this;
  }
  describe(t, e) {
    return _("<object|string|array> [string]", [t, e], arguments.length), this[te](t, !0), s(this, P, "f").describe(t, e), this;
  }
  detectLocale(t) {
    return _("<boolean>", [t], arguments.length), b(this, ft, t, "f"), this;
  }
  env(t) {
    return _("[string|boolean]", [t], arguments.length), t === !1 ? delete s(this, w, "f").envPrefix : s(this, w, "f").envPrefix = t || "", this;
  }
  epilogue(t) {
    return _("<string>", [t], arguments.length), s(this, P, "f").epilog(t), this;
  }
  epilog(t) {
    return this.epilogue(t);
  }
  example(t, e) {
    return _("<string|array> [string]", [t, e], arguments.length), Array.isArray(t) ? t.forEach((n) => this.example(...n)) : s(this, P, "f").example(t, e), this;
  }
  exit(t, e) {
    b(this, B, !0, "f"), b(this, it, e, "f"), s(this, X, "f") && s(this, y, "f").process.exit(t);
  }
  exitProcess(t = !0) {
    return _("[boolean]", [t], arguments.length), b(this, X, t, "f"), this;
  }
  fail(t) {
    if (_("<function|boolean>", [t], arguments.length), typeof t == "boolean" && t !== !1)
      throw new q("Invalid first argument. Expected function or boolean 'false'");
    return s(this, P, "f").failFn(t), this;
  }
  getAliases() {
    return this.parsed ? this.parsed.aliases : {};
  }
  async getCompletion(t, e) {
    return _("<array> [function]", [t, e], arguments.length), e ? s(this, Z, "f").getCompletion(t, e) : new Promise((n, i) => {
      s(this, Z, "f").getCompletion(t, (r, o) => {
        r ? i(r) : n(o);
      });
    });
  }
  getDemandedOptions() {
    return _([], 0), s(this, w, "f").demandedOptions;
  }
  getDemandedCommands() {
    return _([], 0), s(this, w, "f").demandedCommands;
  }
  getDeprecatedOptions() {
    return _([], 0), s(this, w, "f").deprecatedOptions;
  }
  getDetectLocale() {
    return s(this, ft, "f");
  }
  getExitProcess() {
    return s(this, X, "f");
  }
  getGroups() {
    return Object.assign({}, s(this, et, "f"), s(this, ut, "f"));
  }
  getHelp() {
    if (b(this, B, !0, "f"), !s(this, P, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const e = this[St](s(this, rt, "f"), void 0, void 0, 0, !0);
        if (F(e))
          return e.then(() => s(this, P, "f").help());
      }
      const t = s(this, U, "f").runDefaultBuilderOn(this);
      if (F(t))
        return t.then(() => s(this, P, "f").help());
    }
    return Promise.resolve(s(this, P, "f").help());
  }
  getOptions() {
    return s(this, w, "f");
  }
  getStrict() {
    return s(this, dt, "f");
  }
  getStrictCommands() {
    return s(this, pt, "f");
  }
  getStrictOptions() {
    return s(this, gt, "f");
  }
  global(t, e) {
    return _("<string|array> [boolean]", [t, e], arguments.length), t = [].concat(t), e !== !1 ? s(this, w, "f").local = s(this, w, "f").local.filter((n) => t.indexOf(n) === -1) : t.forEach((n) => {
      s(this, w, "f").local.includes(n) || s(this, w, "f").local.push(n);
    }), this;
  }
  group(t, e) {
    _("<string|array> <string>", [t, e], arguments.length);
    const n = s(this, ut, "f")[e] || s(this, et, "f")[e];
    s(this, ut, "f")[e] && delete s(this, ut, "f")[e];
    const i = {};
    return s(this, et, "f")[e] = (n || []).concat(t).filter((r) => i[r] ? !1 : i[r] = !0), this;
  }
  hide(t) {
    return _("<string>", [t], arguments.length), s(this, w, "f").hiddenOptions.push(t), this;
  }
  implies(t, e) {
    return _("<string|object> [number|string|array]", [t, e], arguments.length), s(this, W, "f").implies(t, e), this;
  }
  locale(t) {
    return _("[string]", [t], arguments.length), t === void 0 ? (this[Jt](), s(this, y, "f").y18n.getLocale()) : (b(this, ft, !1, "f"), s(this, y, "f").y18n.setLocale(t), this);
  }
  middleware(t, e, n) {
    return s(this, Q, "f").addMiddleware(t, !!e, n);
  }
  nargs(t, e) {
    return _("<string|object|array> [number]", [t, e], arguments.length), this[jt](this.nargs.bind(this), "narg", t, e), this;
  }
  normalize(t) {
    return _("<array|string>", [t], arguments.length), this[ot]("normalize", t), this;
  }
  number(t) {
    return _("<array|string>", [t], arguments.length), this[ot]("number", t), this[_t](t), this;
  }
  option(t, e) {
    if (_("<string|object> [object]", [t, e], arguments.length), typeof t == "object")
      Object.keys(t).forEach((n) => {
        this.options(n, t[n]);
      });
    else {
      typeof e != "object" && (e = {}), this[_t](t), s(this, nt, "f") && (t === "version" || (e == null ? void 0 : e.alias) === "version") && this[we]([
        '"version" is a reserved word.',
        "Please do one of the following:",
        '- Disable version with `yargs.version(false)` if using "version" as an option',
        "- Use the built-in `yargs.version` method instead (if applicable)",
        "- Use a different option key",
        "https://yargs.js.org/docs/#api-reference-version"
      ].join(`
`), void 0, "versionWarning"), s(this, w, "f").key[t] = !0, e.alias && this.alias(t, e.alias);
      const n = e.deprecate || e.deprecated;
      n && this.deprecateOption(t, n);
      const i = e.demand || e.required || e.require;
      i && this.demand(t, i), e.demandOption && this.demandOption(t, typeof e.demandOption == "string" ? e.demandOption : void 0), e.conflicts && this.conflicts(t, e.conflicts), "default" in e && this.default(t, e.default), e.implies !== void 0 && this.implies(t, e.implies), e.nargs !== void 0 && this.nargs(t, e.nargs), e.config && this.config(t, e.configParser), e.normalize && this.normalize(t), e.choices && this.choices(t, e.choices), e.coerce && this.coerce(t, e.coerce), e.group && this.group(t, e.group), (e.boolean || e.type === "boolean") && (this.boolean(t), e.alias && this.boolean(e.alias)), (e.array || e.type === "array") && (this.array(t), e.alias && this.array(e.alias)), (e.number || e.type === "number") && (this.number(t), e.alias && this.number(e.alias)), (e.string || e.type === "string") && (this.string(t), e.alias && this.string(e.alias)), (e.count || e.type === "count") && this.count(t), typeof e.global == "boolean" && this.global(t, e.global), e.defaultDescription && (s(this, w, "f").defaultDescription[t] = e.defaultDescription), e.skipValidation && this.skipValidation(t);
      const r = e.describe || e.description || e.desc, o = s(this, P, "f").getDescriptions();
      (!Object.prototype.hasOwnProperty.call(o, t) || typeof r == "string") && this.describe(t, r), e.hidden && this.hide(t), e.requiresArg && this.requiresArg(t);
    }
    return this;
  }
  options(t, e) {
    return this.option(t, e);
  }
  parse(t, e, n) {
    _("[string|array] [function|boolean|object] [function]", [t, e, n], arguments.length), this[Ce](), typeof t > "u" && (t = s(this, rt, "f")), typeof e == "object" && (b(this, ct, e, "f"), e = n), typeof e == "function" && (b(this, J, e, "f"), e = !1), e || b(this, rt, t, "f"), s(this, J, "f") && b(this, X, !1, "f");
    const i = this[St](t, !!e), r = this.parsed;
    return s(this, Z, "f").setParsed(this.parsed), F(i) ? i.then((o) => (s(this, J, "f") && s(this, J, "f").call(this, s(this, it, "f"), o, s(this, G, "f")), o)).catch((o) => {
      throw s(this, J, "f") && s(this, J, "f")(o, this.parsed.argv, s(this, G, "f")), o;
    }).finally(() => {
      this[ee](), this.parsed = r;
    }) : (s(this, J, "f") && s(this, J, "f").call(this, s(this, it, "f"), i, s(this, G, "f")), this[ee](), this.parsed = r, i);
  }
  parseAsync(t, e, n) {
    const i = this.parse(t, e, n);
    return F(i) ? i : Promise.resolve(i);
  }
  parseSync(t, e, n) {
    const i = this.parse(t, e, n);
    if (F(i))
      throw new q(".parseSync() must not be used with asynchronous builders, handlers, or middleware");
    return i;
  }
  parserConfiguration(t) {
    return _("<object>", [t], arguments.length), b(this, Gt, t, "f"), this;
  }
  pkgConf(t, e) {
    _("<string> [string]", [t, e], arguments.length);
    let n = null;
    const i = this[Zt](e || s(this, lt, "f"));
    return i[t] && typeof i[t] == "object" && (n = oe(i[t], e || s(this, lt, "f"), this[mt]()["deep-merge-config"] || !1, s(this, y, "f")), s(this, w, "f").configObjects = (s(this, w, "f").configObjects || []).concat(n)), this;
  }
  positional(t, e) {
    _("<string> <object>", [t, e], arguments.length);
    const n = [
      "default",
      "defaultDescription",
      "implies",
      "normalize",
      "choices",
      "conflicts",
      "coerce",
      "type",
      "describe",
      "desc",
      "description",
      "alias"
    ];
    e = zt(e, (o, l) => o === "type" && !["string", "number", "boolean"].includes(l) ? !1 : n.includes(o));
    const i = s(this, At, "f").fullCommands[s(this, At, "f").fullCommands.length - 1], r = i ? s(this, U, "f").cmdToParseOptions(i) : {
      array: [],
      alias: {},
      default: {},
      demand: {}
    };
    return Tt(r).forEach((o) => {
      const l = r[o];
      Array.isArray(l) ? l.indexOf(t) !== -1 && (e[o] = !0) : l[t] && !(o in e) && (e[o] = l[t]);
    }), this.group(t, s(this, P, "f").getPositionalGroupName()), this.option(t, e);
  }
  recommendCommands(t = !0) {
    return _("[boolean]", [t], arguments.length), b(this, Nt, t, "f"), this;
  }
  required(t, e, n) {
    return this.demand(t, e, n);
  }
  require(t, e, n) {
    return this.demand(t, e, n);
  }
  requiresArg(t) {
    return _("<array|string|object> [number]", [t], arguments.length), typeof t == "string" && s(this, w, "f").narg[t] ? this : (this[jt](this.requiresArg.bind(this), "narg", t, NaN), this);
  }
  showCompletionScript(t, e) {
    return _("[string] [string]", [t, e], arguments.length), t = t || this.$0, s(this, wt, "f").log(s(this, Z, "f").generateCompletionScript(t, e || s(this, K, "f") || "completion")), this;
  }
  showHelp(t) {
    if (_("[string|function]", [t], arguments.length), b(this, B, !0, "f"), !s(this, P, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const n = this[St](s(this, rt, "f"), void 0, void 0, 0, !0);
        if (F(n))
          return n.then(() => {
            s(this, P, "f").showHelp(t);
          }), this;
      }
      const e = s(this, U, "f").runDefaultBuilderOn(this);
      if (F(e))
        return e.then(() => {
          s(this, P, "f").showHelp(t);
        }), this;
    }
    return s(this, P, "f").showHelp(t), this;
  }
  scriptName(t) {
    return this.customScriptName = !0, this.$0 = t, this;
  }
  showHelpOnFail(t, e) {
    return _("[boolean|string] [string]", [t, e], arguments.length), s(this, P, "f").showHelpOnFail(t, e), this;
  }
  showVersion(t) {
    return _("[string|function]", [t], arguments.length), s(this, P, "f").showVersion(t), this;
  }
  skipValidation(t) {
    return _("<array|string>", [t], arguments.length), this[ot]("skipValidation", t), this;
  }
  strict(t) {
    return _("[boolean]", [t], arguments.length), b(this, dt, t !== !1, "f"), this;
  }
  strictCommands(t) {
    return _("[boolean]", [t], arguments.length), b(this, pt, t !== !1, "f"), this;
  }
  strictOptions(t) {
    return _("[boolean]", [t], arguments.length), b(this, gt, t !== !1, "f"), this;
  }
  string(t) {
    return _("<array|string>", [t], arguments.length), this[ot]("string", t), this[_t](t), this;
  }
  terminalWidth() {
    return _([], 0), s(this, y, "f").process.stdColumns;
  }
  updateLocale(t) {
    return this.updateStrings(t);
  }
  updateStrings(t) {
    return _("<object>", [t], arguments.length), b(this, ft, !1, "f"), s(this, y, "f").y18n.updateLocale(t), this;
  }
  usage(t, e, n, i) {
    if (_("<string|null|undefined> [string|boolean] [function|object] [function]", [t, e, n, i], arguments.length), e !== void 0) {
      if (tt(t, null, s(this, y, "f")), (t || "").match(/^\$0( |$)/))
        return this.command(t, e, n, i);
      throw new q(".usage() description must start with $0 if being used as alias for .command()");
    } else
      return s(this, P, "f").usage(t), this;
  }
  usageConfiguration(t) {
    return _("<object>", [t], arguments.length), b(this, Lt, t, "f"), this;
  }
  version(t, e, n) {
    const i = "version";
    if (_("[boolean|string] [string] [string]", [t, e, n], arguments.length), s(this, nt, "f") && (this[Bt](s(this, nt, "f")), s(this, P, "f").version(void 0), b(this, nt, null, "f")), arguments.length === 0)
      n = this[ye](), t = i;
    else if (arguments.length === 1) {
      if (t === !1)
        return this;
      n = t, t = i;
    } else arguments.length === 2 && (n = e, e = void 0);
    return b(this, nt, typeof t == "string" ? t : i, "f"), e = e || s(this, P, "f").deferY18nLookup("Show version number"), s(this, P, "f").version(n || void 0), this.boolean(s(this, nt, "f")), this.describe(s(this, nt, "f"), e), this;
  }
  wrap(t) {
    return _("<number|null|undefined>", [t], arguments.length), s(this, P, "f").wrap(t), this;
  }
  [(U = /* @__PURE__ */ new WeakMap(), lt = /* @__PURE__ */ new WeakMap(), At = /* @__PURE__ */ new WeakMap(), Z = /* @__PURE__ */ new WeakMap(), K = /* @__PURE__ */ new WeakMap(), Wt = /* @__PURE__ */ new WeakMap(), it = /* @__PURE__ */ new WeakMap(), ft = /* @__PURE__ */ new WeakMap(), Ut = /* @__PURE__ */ new WeakMap(), X = /* @__PURE__ */ new WeakMap(), vt = /* @__PURE__ */ new WeakMap(), Q = /* @__PURE__ */ new WeakMap(), et = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new WeakMap(), Ft = /* @__PURE__ */ new WeakMap(), wt = /* @__PURE__ */ new WeakMap(), G = /* @__PURE__ */ new WeakMap(), w = /* @__PURE__ */ new WeakMap(), Yt = /* @__PURE__ */ new WeakMap(), Gt = /* @__PURE__ */ new WeakMap(), J = /* @__PURE__ */ new WeakMap(), ct = /* @__PURE__ */ new WeakMap(), Ct = /* @__PURE__ */ new WeakMap(), ut = /* @__PURE__ */ new WeakMap(), rt = /* @__PURE__ */ new WeakMap(), Nt = /* @__PURE__ */ new WeakMap(), y = /* @__PURE__ */ new WeakMap(), dt = /* @__PURE__ */ new WeakMap(), pt = /* @__PURE__ */ new WeakMap(), gt = /* @__PURE__ */ new WeakMap(), P = /* @__PURE__ */ new WeakMap(), Lt = /* @__PURE__ */ new WeakMap(), nt = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new WeakMap(), _e)](t) {
    if (!t._ || !t["--"])
      return t;
    t._.push.apply(t._, t["--"]);
    try {
      delete t["--"];
    } catch {
    }
    return t;
  }
  [Oe]() {
    return {
      log: (...t) => {
        this[Vt]() || console.log(...t), b(this, B, !0, "f"), s(this, G, "f").length && b(this, G, s(this, G, "f") + `
`, "f"), b(this, G, s(this, G, "f") + t.join(" "), "f");
      },
      error: (...t) => {
        this[Vt]() || console.error(...t), b(this, B, !0, "f"), s(this, G, "f").length && b(this, G, s(this, G, "f") + `
`, "f"), b(this, G, s(this, G, "f") + t.join(" "), "f");
      }
    };
  }
  [Bt](t) {
    Tt(s(this, w, "f")).forEach((e) => {
      if (/* @__PURE__ */ ((i) => i === "configObjects")(e))
        return;
      const n = s(this, w, "f")[e];
      Array.isArray(n) ? n.includes(t) && n.splice(n.indexOf(t), 1) : typeof n == "object" && delete n[t];
    }), delete s(this, P, "f").getDescriptions()[t];
  }
  [we](t, e, n) {
    s(this, Ut, "f")[n] || (s(this, y, "f").process.emitWarning(t, e), s(this, Ut, "f")[n] = !0);
  }
  [Ce]() {
    s(this, vt, "f").push({
      options: s(this, w, "f"),
      configObjects: s(this, w, "f").configObjects.slice(0),
      exitProcess: s(this, X, "f"),
      groups: s(this, et, "f"),
      strict: s(this, dt, "f"),
      strictCommands: s(this, pt, "f"),
      strictOptions: s(this, gt, "f"),
      completionCommand: s(this, K, "f"),
      output: s(this, G, "f"),
      exitError: s(this, it, "f"),
      hasOutput: s(this, B, "f"),
      parsed: this.parsed,
      parseFn: s(this, J, "f"),
      parseContext: s(this, ct, "f")
    }), s(this, P, "f").freeze(), s(this, W, "f").freeze(), s(this, U, "f").freeze(), s(this, Q, "f").freeze();
  }
  [je]() {
    let t = "", e;
    return /\b(node|iojs|electron)(\.exe)?$/.test(s(this, y, "f").process.argv()[0]) ? e = s(this, y, "f").process.argv().slice(1, 2) : e = s(this, y, "f").process.argv().slice(0, 1), t = e.map((n) => {
      const i = this[We](s(this, lt, "f"), n);
      return n.match(/^(\/|([a-zA-Z]:)?\\)/) && i.length < n.length ? i : n;
    }).join(" ").trim(), s(this, y, "f").getEnv("_") && s(this, y, "f").getProcessArgvBin() === s(this, y, "f").getEnv("_") && (t = s(this, y, "f").getEnv("_").replace(`${s(this, y, "f").path.dirname(s(this, y, "f").process.execPath())}/`, "")), t;
  }
  [mt]() {
    return s(this, Gt, "f");
  }
  [Me]() {
    return s(this, Lt, "f");
  }
  [Jt]() {
    if (!s(this, ft, "f"))
      return;
    const t = s(this, y, "f").getEnv("LC_ALL") || s(this, y, "f").getEnv("LC_MESSAGES") || s(this, y, "f").getEnv("LANG") || s(this, y, "f").getEnv("LANGUAGE") || "en_US";
    this.locale(t.replace(/[.:].*/, ""));
  }
  [ye]() {
    return this[Zt]().version || "unknown";
  }
  [Pe](t) {
    const e = t["--"] ? t["--"] : t._;
    for (let n = 0, i; (i = e[n]) !== void 0; n++)
      s(this, y, "f").Parser.looksLikeNumber(i) && Number.isSafeInteger(Math.floor(parseFloat(`${i}`))) && (e[n] = Number(i));
    return t;
  }
  [Zt](t) {
    const e = t || "*";
    if (s(this, Ct, "f")[e])
      return s(this, Ct, "f")[e];
    let n = {};
    try {
      let i = t || s(this, y, "f").mainFilename;
      !t && s(this, y, "f").path.extname(i) && (i = s(this, y, "f").path.dirname(i));
      const r = s(this, y, "f").findUp(i, (o, l) => {
        if (l.includes("package.json"))
          return "package.json";
      });
      tt(r, void 0, s(this, y, "f")), n = JSON.parse(s(this, y, "f").readFileSync(r, "utf8"));
    } catch {
    }
    return s(this, Ct, "f")[e] = n || {}, s(this, Ct, "f")[e];
  }
  [ot](t, e) {
    e = [].concat(e), e.forEach((n) => {
      n = this[kt](n), s(this, w, "f")[t].push(n);
    });
  }
  [jt](t, e, n, i) {
    this[Qt](t, e, n, i, (r, o, l) => {
      s(this, w, "f")[r][o] = l;
    });
  }
  [Xt](t, e, n, i) {
    this[Qt](t, e, n, i, (r, o, l) => {
      s(this, w, "f")[r][o] = (s(this, w, "f")[r][o] || []).concat(l);
    });
  }
  [Qt](t, e, n, i, r) {
    if (Array.isArray(n))
      n.forEach((o) => {
        t(o, i);
      });
    else if (/* @__PURE__ */ ((o) => typeof o == "object")(n))
      for (const o of Tt(n))
        t(o, n[o]);
    else
      r(e, this[kt](n), i);
  }
  [kt](t) {
    return t === "__proto__" ? "___proto___" : t;
  }
  [te](t, e) {
    return this[jt](this[te].bind(this), "key", t, e), this;
  }
  [ee]() {
    var t, e, n, i, r, o, l, u, d, c, h, f;
    const p = s(this, vt, "f").pop();
    tt(p, void 0, s(this, y, "f"));
    let O;
    t = this, e = this, n = this, i = this, r = this, o = this, l = this, u = this, d = this, c = this, h = this, f = this, {
      options: { set value(g) {
        b(t, w, g, "f");
      } }.value,
      configObjects: O,
      exitProcess: { set value(g) {
        b(e, X, g, "f");
      } }.value,
      groups: { set value(g) {
        b(n, et, g, "f");
      } }.value,
      output: { set value(g) {
        b(i, G, g, "f");
      } }.value,
      exitError: { set value(g) {
        b(r, it, g, "f");
      } }.value,
      hasOutput: { set value(g) {
        b(o, B, g, "f");
      } }.value,
      parsed: this.parsed,
      strict: { set value(g) {
        b(l, dt, g, "f");
      } }.value,
      strictCommands: { set value(g) {
        b(u, pt, g, "f");
      } }.value,
      strictOptions: { set value(g) {
        b(d, gt, g, "f");
      } }.value,
      completionCommand: { set value(g) {
        b(c, K, g, "f");
      } }.value,
      parseFn: { set value(g) {
        b(h, J, g, "f");
      } }.value,
      parseContext: { set value(g) {
        b(f, ct, g, "f");
      } }.value
    } = p, s(this, w, "f").configObjects = O, s(this, P, "f").unfreeze(), s(this, W, "f").unfreeze(), s(this, U, "f").unfreeze(), s(this, Q, "f").unfreeze();
  }
  [Ae](t, e) {
    return Dt(e, (n) => (t(n), n));
  }
  getInternalMethods() {
    return {
      getCommandInstance: this[Se].bind(this),
      getContext: this[Ie].bind(this),
      getHasOutput: this[Ee].bind(this),
      getLoggerInstance: this[xe].bind(this),
      getParseContext: this[$e].bind(this),
      getParserConfiguration: this[mt].bind(this),
      getUsageConfiguration: this[Me].bind(this),
      getUsageInstance: this[De].bind(this),
      getValidationInstance: this[ze].bind(this),
      hasParseCallback: this[Vt].bind(this),
      isGlobalContext: this[He].bind(this),
      postProcess: this[bt].bind(this),
      reset: this[ne].bind(this),
      runValidation: this[se].bind(this),
      runYargsParserAndExecuteCommands: this[St].bind(this),
      setHasOutput: this[Ue].bind(this)
    };
  }
  [Se]() {
    return s(this, U, "f");
  }
  [Ie]() {
    return s(this, At, "f");
  }
  [Ee]() {
    return s(this, B, "f");
  }
  [xe]() {
    return s(this, wt, "f");
  }
  [$e]() {
    return s(this, ct, "f") || {};
  }
  [De]() {
    return s(this, P, "f");
  }
  [ze]() {
    return s(this, W, "f");
  }
  [Vt]() {
    return !!s(this, J, "f");
  }
  [He]() {
    return s(this, Ft, "f");
  }
  [bt](t, e, n, i) {
    return n || F(t) || (e || (t = this[_e](t)), (this[mt]()["parse-positional-numbers"] || this[mt]()["parse-positional-numbers"] === void 0) && (t = this[Pe](t)), i && (t = $t(t, this, s(this, Q, "f").getMiddleware(), !1))), t;
  }
  [ne](t = {}) {
    b(this, w, s(this, w, "f") || {}, "f");
    const e = {};
    e.local = s(this, w, "f").local || [], e.configObjects = s(this, w, "f").configObjects || [];
    const n = {};
    e.local.forEach((o) => {
      n[o] = !0, (t[o] || []).forEach((l) => {
        n[l] = !0;
      });
    }), Object.assign(s(this, ut, "f"), Object.keys(s(this, et, "f")).reduce((o, l) => {
      const u = s(this, et, "f")[l].filter((d) => !(d in n));
      return u.length > 0 && (o[l] = u), o;
    }, {})), b(this, et, {}, "f");
    const i = [
      "array",
      "boolean",
      "string",
      "skipValidation",
      "count",
      "normalize",
      "number",
      "hiddenOptions"
    ], r = [
      "narg",
      "key",
      "alias",
      "default",
      "defaultDescription",
      "config",
      "choices",
      "demandedOptions",
      "demandedCommands",
      "deprecatedOptions"
    ];
    return i.forEach((o) => {
      e[o] = (s(this, w, "f")[o] || []).filter((l) => !n[l]);
    }), r.forEach((o) => {
      e[o] = zt(s(this, w, "f")[o], (l) => !n[l]);
    }), e.envPrefix = s(this, w, "f").envPrefix, b(this, w, e, "f"), b(this, P, s(this, P, "f") ? s(this, P, "f").reset(n) : ke(this, s(this, y, "f")), "f"), b(this, W, s(this, W, "f") ? s(this, W, "f").reset(n) : ln(this, s(this, P, "f"), s(this, y, "f")), "f"), b(this, U, s(this, U, "f") ? s(this, U, "f").reset() : Be(s(this, P, "f"), s(this, W, "f"), s(this, Q, "f"), s(this, y, "f")), "f"), s(this, Z, "f") || b(this, Z, rn(this, s(this, P, "f"), s(this, U, "f"), s(this, y, "f")), "f"), s(this, Q, "f").reset(), b(this, K, null, "f"), b(this, G, "", "f"), b(this, it, null, "f"), b(this, B, !1, "f"), this.parsed = !1, this;
  }
  [We](t, e) {
    return s(this, y, "f").path.relative(t, e);
  }
  [St](t, e, n, i = 0, r = !1) {
    let o = !!n || r;
    t = t || s(this, rt, "f"), s(this, w, "f").__ = s(this, y, "f").y18n.__, s(this, w, "f").configuration = this[mt]();
    const l = !!s(this, w, "f").configuration["populate--"], u = Object.assign({}, s(this, w, "f").configuration, {
      "populate--": !0
    }), d = s(this, y, "f").Parser.detailed(t, Object.assign({}, s(this, w, "f"), {
      configuration: { "parse-positional-numbers": !1, ...u }
    })), c = Object.assign(d.argv, s(this, ct, "f"));
    let h;
    const f = d.aliases;
    let p = !1, O = !1;
    Object.keys(c).forEach((g) => {
      g === s(this, k, "f") && c[g] ? p = !0 : g === s(this, nt, "f") && c[g] && (O = !0);
    }), c.$0 = this.$0, this.parsed = d, i === 0 && s(this, P, "f").clearCachedHelpMessage();
    try {
      if (this[Jt](), e)
        return this[bt](c, l, !!n, !1);
      s(this, k, "f") && [s(this, k, "f")].concat(f[s(this, k, "f")] || []).filter((T) => T.length > 1).includes("" + c._[c._.length - 1]) && (c._.pop(), p = !0), b(this, Ft, !1, "f");
      const g = s(this, U, "f").getCommands(), S = s(this, Z, "f").completionKey in c, D = p || S || r;
      if (c._.length) {
        if (g.length) {
          let I;
          for (let T = i || 0, $; c._[T] !== void 0; T++)
            if ($ = String(c._[T]), g.includes($) && $ !== s(this, K, "f")) {
              const at = s(this, U, "f").runCommand($, this, d, T + 1, r, p || O || r);
              return this[bt](at, l, !!n, !1);
            } else if (!I && $ !== s(this, K, "f")) {
              I = $;
              break;
            }
          !s(this, U, "f").hasDefaultCommand() && s(this, Nt, "f") && I && !D && s(this, W, "f").recommendCommands(I, g);
        }
        s(this, K, "f") && c._.includes(s(this, K, "f")) && !S && (s(this, X, "f") && It(!0), this.showCompletionScript(), this.exit(0));
      }
      if (s(this, U, "f").hasDefaultCommand() && !D) {
        const I = s(this, U, "f").runCommand(null, this, d, 0, r, p || O || r);
        return this[bt](I, l, !!n, !1);
      }
      if (S) {
        s(this, X, "f") && It(!0), t = [].concat(t);
        const I = t.slice(t.indexOf(`--${s(this, Z, "f").completionKey}`) + 1);
        return s(this, Z, "f").getCompletion(I, (T, $) => {
          if (T)
            throw new q(T.message);
          ($ || []).forEach((at) => {
            s(this, wt, "f").log(at);
          }), this.exit(0);
        }), this[bt](c, !l, !!n, !1);
      }
      if (s(this, B, "f") || (p ? (s(this, X, "f") && It(!0), o = !0, this.showHelp("log"), this.exit(0)) : O && (s(this, X, "f") && It(!0), o = !0, s(this, P, "f").showVersion("log"), this.exit(0))), !o && s(this, w, "f").skipValidation.length > 0 && (o = Object.keys(c).some((I) => s(this, w, "f").skipValidation.indexOf(I) >= 0 && c[I] === !0)), !o) {
        if (d.error)
          throw new q(d.error.message);
        if (!S) {
          const I = this[se](f, {}, d.error);
          n || (h = $t(c, this, s(this, Q, "f").getMiddleware(), !0)), h = this[Ae](I, h ?? c), F(h) && !n && (h = h.then(() => $t(c, this, s(this, Q, "f").getMiddleware(), !1)));
        }
      }
    } catch (g) {
      if (g instanceof q)
        s(this, P, "f").fail(g.message, g);
      else
        throw g;
    }
    return this[bt](h ?? c, l, !!n, !0);
  }
  [se](t, e, n, i) {
    const r = { ...this.getDemandedOptions() };
    return (o) => {
      if (n)
        throw new q(n.message);
      s(this, W, "f").nonOptionCount(o), s(this, W, "f").requiredArguments(o, r);
      let l = !1;
      s(this, pt, "f") && (l = s(this, W, "f").unknownCommands(o)), s(this, dt, "f") && !l ? s(this, W, "f").unknownArguments(o, t, e, !!i) : s(this, gt, "f") && s(this, W, "f").unknownArguments(o, t, {}, !1, !1), s(this, W, "f").limitedChoices(o), s(this, W, "f").implications(o), s(this, W, "f").conflicting(o);
    };
  }
  [Ue]() {
    b(this, B, !0, "f");
  }
  [_t](t) {
    if (typeof t == "string")
      s(this, w, "f").key[t] = !0;
    else
      for (const e of t)
        s(this, w, "f").key[e] = !0;
  }
}
function pn(a) {
  return !!a && typeof a.getInternalMethods == "function";
}
const bn = un(Ne);
export {
  bn as default
};
