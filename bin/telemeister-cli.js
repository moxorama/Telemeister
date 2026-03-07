#!/usr/bin/env node

// dist/cli/state-manager.js
import * as fs2 from "fs";
import * as path2 from "path";
import { fileURLToPath } from "url";

// node_modules/ejs/lib/esm/ejs.js
import fs from "node:fs";
import path from "node:path";

// node_modules/ejs/lib/esm/utils.js
var utils = {};
var regExpChars = /[|\\{}()[\]^$+*?.]/g;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = function(obj, key) {
  return hasOwnProperty.apply(obj, [key]);
};
utils.escapeRegExpChars = function(string) {
  if (!string) {
    return "";
  }
  return String(string).replace(regExpChars, "\\$&");
};
var _ENCODE_HTML_RULES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&#34;",
  "'": "&#39;"
};
var _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
}
var escapeFuncStr = `var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
`;
utils.escapeXML = function(markup) {
  return markup == void 0 ? "" : String(markup).replace(_MATCH_HTML, encode_char);
};
function escapeXMLToString() {
  return Function.prototype.toString.call(this) + ";\n" + escapeFuncStr;
}
try {
  if (typeof Object.defineProperty === "function") {
    Object.defineProperty(utils.escapeXML, "toString", { value: escapeXMLToString });
  } else {
    utils.escapeXML.toString = escapeXMLToString;
  }
} catch (err) {
  console.warn("Unable to set escapeXML.toString (is the Function prototype frozen?)");
}
utils.shallowCopy = function(to, from) {
  from = from || {};
  if (to !== null && to !== void 0) {
    for (var p in from) {
      if (!hasOwn(from, p)) {
        continue;
      }
      if (p === "__proto__" || p === "constructor") {
        continue;
      }
      to[p] = from[p];
    }
  }
  return to;
};
utils.shallowCopyFromList = function(to, from, list) {
  list = list || [];
  from = from || {};
  if (to !== null && to !== void 0) {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (typeof from[p] != "undefined") {
        if (!hasOwn(from, p)) {
          continue;
        }
        if (p === "__proto__" || p === "constructor") {
          continue;
        }
        to[p] = from[p];
      }
    }
  }
  return to;
};
utils.cache = {
  _data: {},
  set: function(key, val) {
    this._data[key] = val;
  },
  get: function(key) {
    return this._data[key];
  },
  remove: function(key) {
    delete this._data[key];
  },
  reset: function() {
    this._data = {};
  }
};
utils.hyphenToCamel = function(str) {
  return str.replace(/-[a-z]/g, function(match) {
    return match[1].toUpperCase();
  });
};
utils.createNullProtoObjWherePossible = (function() {
  if (typeof Object.create == "function") {
    return function() {
      return /* @__PURE__ */ Object.create(null);
    };
  }
  if (!({ __proto__: null } instanceof Object)) {
    return function() {
      return { __proto__: null };
    };
  }
  return function() {
    return {};
  };
})();
utils.hasOwnOnlyObject = function(obj) {
  var o = utils.createNullProtoObjWherePossible();
  for (var p in obj) {
    if (hasOwn(obj, p)) {
      o[p] = obj[p];
    }
  }
  return o;
};
if (typeof exports != "undefined") {
  module.exports = utils;
}
var utils_default = utils;

// node_modules/ejs/lib/esm/ejs.js
var DECLARATION_KEYWORD = "let";
var ejs = {};
var _DEFAULT_OPEN_DELIMITER = "<";
var _DEFAULT_CLOSE_DELIMITER = ">";
var _DEFAULT_DELIMITER = "%";
var _DEFAULT_LOCALS_NAME = "locals";
var _REGEX_STRING = "(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)";
var _OPTS_PASSABLE_WITH_DATA = [
  "delimiter",
  "scope",
  "context",
  "debug",
  "compileDebug",
  "client",
  "_with",
  "rmWhitespace",
  "strict",
  "filename",
  "async"
];
var _OPTS_PASSABLE_WITH_DATA_EXPRESS = _OPTS_PASSABLE_WITH_DATA.concat("cache");
var _BOM = /^\uFEFF/;
var _JS_IDENTIFIER = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
ejs.cache = utils_default.cache;
ejs.fileLoader = fs.readFileSync;
ejs.localsName = _DEFAULT_LOCALS_NAME;
ejs.promiseImpl = new Function("return this;")().Promise;
ejs.resolveInclude = function(name, filename, isDir) {
  let dirname3 = path.dirname;
  let extname = path.extname;
  let resolve2 = path.resolve;
  let includePath = resolve2(isDir ? filename : dirname3(filename), name);
  let ext = extname(name);
  if (!ext) {
    includePath += ".ejs";
  }
  return includePath;
};
function resolvePaths(name, paths) {
  let filePath;
  if (paths.some(function(v) {
    filePath = ejs.resolveInclude(name, v, true);
    return fs.existsSync(filePath);
  })) {
    return filePath;
  }
}
function getIncludePath(path4, options) {
  let includePath;
  let filePath;
  let views = options.views;
  let match = /^[A-Za-z]+:\\|^\//.exec(path4);
  if (match && match.length) {
    path4 = path4.replace(/^\/*/, "");
    if (Array.isArray(options.root)) {
      includePath = resolvePaths(path4, options.root);
    } else {
      includePath = ejs.resolveInclude(path4, options.root || "/", true);
    }
  } else {
    if (options.filename) {
      filePath = ejs.resolveInclude(path4, options.filename);
      if (fs.existsSync(filePath)) {
        includePath = filePath;
      }
    }
    if (!includePath && Array.isArray(views)) {
      includePath = resolvePaths(path4, views);
    }
    if (!includePath && typeof options.includer !== "function") {
      throw new Error('Could not find the include file "' + options.escapeFunction(path4) + '"');
    }
  }
  return includePath;
}
function handleCache(options, template) {
  let func;
  let filename = options.filename;
  let hasTemplate = arguments.length > 1;
  if (options.cache) {
    if (!filename) {
      throw new Error("cache option requires a filename");
    }
    func = ejs.cache.get(filename);
    if (func) {
      return func;
    }
    if (!hasTemplate) {
      template = fileLoader(filename).toString().replace(_BOM, "");
    }
  } else if (!hasTemplate) {
    if (!filename) {
      throw new Error("Internal EJS error: no file name or template provided");
    }
    template = fileLoader(filename).toString().replace(_BOM, "");
  }
  func = ejs.compile(template, options);
  if (options.cache) {
    ejs.cache.set(filename, func);
  }
  return func;
}
function tryHandleCache(options, data, cb) {
  let result;
  if (!cb) {
    if (typeof ejs.promiseImpl == "function") {
      return new ejs.promiseImpl(function(resolve2, reject) {
        try {
          result = handleCache(options)(data);
          resolve2(result);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      throw new Error("Please provide a callback function");
    }
  } else {
    try {
      result = handleCache(options)(data);
    } catch (err) {
      return cb(err);
    }
    cb(null, result);
  }
}
function fileLoader(filePath) {
  return ejs.fileLoader(filePath);
}
function includeFile(path4, options) {
  let opts = utils_default.shallowCopy(utils_default.createNullProtoObjWherePossible(), options);
  opts.filename = getIncludePath(path4, opts);
  if (typeof options.includer === "function") {
    let includerResult = options.includer(path4, opts.filename);
    if (includerResult) {
      if (includerResult.filename) {
        opts.filename = includerResult.filename;
      }
      if (includerResult.template) {
        return handleCache(opts, includerResult.template);
      }
    }
  }
  return handleCache(opts);
}
function rethrow(err, str, flnm, lineno, esc) {
  let lines = str.split("\n");
  let start = Math.max(lineno - 3, 0);
  let end = Math.min(lines.length, lineno + 3);
  let filename = esc(flnm);
  let context = lines.slice(start, end).map(function(line, i) {
    let curr = i + start + 1;
    return (curr == lineno ? " >> " : "    ") + curr + "| " + line;
  }).join("\n");
  err.path = filename;
  err.message = (filename || "ejs") + ":" + lineno + "\n" + context + "\n\n" + err.message;
  throw err;
}
function stripSemi(str) {
  return str.replace(/;(\s*$)/, "$1");
}
ejs.compile = function compile(template, opts) {
  let templ;
  if (opts && opts.scope) {
    console.warn("`scope` option is deprecated and will be removed in future EJS");
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new Template(template, opts);
  return templ.compile();
};
ejs.render = function(template, d, o) {
  let data = d || utils_default.createNullProtoObjWherePossible();
  let opts = o || utils_default.createNullProtoObjWherePossible();
  if (arguments.length == 2) {
    utils_default.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA);
  }
  return handleCache(opts, template)(data);
};
ejs.renderFile = function() {
  let args = Array.prototype.slice.call(arguments);
  let filename = args.shift();
  let cb;
  let opts = { filename };
  let data;
  let viewOpts;
  if (typeof arguments[arguments.length - 1] == "function") {
    cb = args.pop();
  }
  if (args.length) {
    data = args.shift();
    if (args.length) {
      utils_default.shallowCopy(opts, args.pop());
    } else {
      if (data.settings) {
        if (data.settings.views) {
          opts.views = data.settings.views;
        }
        if (data.settings["view cache"]) {
          opts.cache = true;
        }
        viewOpts = data.settings["view options"];
        if (viewOpts) {
          utils_default.shallowCopy(opts, viewOpts);
        }
      }
      utils_default.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
    }
    opts.filename = filename;
  } else {
    data = utils_default.createNullProtoObjWherePossible();
  }
  return tryHandleCache(opts, data, cb);
};
ejs.Template = Template;
ejs.clearCache = function() {
  ejs.cache.reset();
};
function Template(text, optsParam) {
  let opts = utils_default.hasOwnOnlyObject(optsParam);
  let options = utils_default.createNullProtoObjWherePossible();
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = "";
  options.client = opts.client || false;
  options.escapeFunction = opts.escape || opts.escapeFunction || utils_default.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.openDelimiter = opts.openDelimiter || ejs.openDelimiter || _DEFAULT_OPEN_DELIMITER;
  options.closeDelimiter = opts.closeDelimiter || ejs.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
  options.delimiter = opts.delimiter || ejs.delimiter || _DEFAULT_DELIMITER;
  options.strict = opts.strict || false;
  options.context = opts.context;
  options.cache = opts.cache || false;
  options.rmWhitespace = opts.rmWhitespace;
  options.root = opts.root;
  options.includer = opts.includer;
  options.outputFunctionName = opts.outputFunctionName;
  options.localsName = opts.localsName || ejs.localsName || _DEFAULT_LOCALS_NAME;
  options.views = opts.views;
  options.async = opts.async;
  options.destructuredLocals = opts.destructuredLocals;
  options.legacyInclude = typeof opts.legacyInclude != "undefined" ? !!opts.legacyInclude : true;
  if (options.strict) {
    options._with = false;
  } else {
    options._with = typeof opts._with != "undefined" ? opts._with : true;
  }
  this.opts = options;
  this.regex = this.createRegex();
}
Template.modes = {
  EVAL: "eval",
  ESCAPED: "escaped",
  RAW: "raw",
  COMMENT: "comment",
  LITERAL: "literal"
};
Template.prototype = {
  createRegex: function() {
    let str = _REGEX_STRING;
    let delim = utils_default.escapeRegExpChars(this.opts.delimiter);
    let open = utils_default.escapeRegExpChars(this.opts.openDelimiter);
    let close = utils_default.escapeRegExpChars(this.opts.closeDelimiter);
    str = str.replace(/%/g, delim).replace(/</g, open).replace(/>/g, close);
    return new RegExp(str);
  },
  compile: function() {
    let src;
    let fn;
    let opts = this.opts;
    let prepended = "";
    let appended = "";
    let escapeFn = opts.escapeFunction;
    let ctor;
    let sanitizedFilename = opts.filename ? JSON.stringify(opts.filename) : "undefined";
    if (!this.source) {
      this.generateSource();
      prepended += `  ${DECLARATION_KEYWORD} __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
`;
      if (opts.outputFunctionName) {
        if (!_JS_IDENTIFIER.test(opts.outputFunctionName)) {
          throw new Error("outputFunctionName is not a valid JS identifier.");
        }
        prepended += `  ${DECLARATION_KEYWORD} ` + opts.outputFunctionName + " = __append;\n";
      }
      if (opts.localsName && !_JS_IDENTIFIER.test(opts.localsName)) {
        throw new Error("localsName is not a valid JS identifier.");
      }
      if (opts.destructuredLocals && opts.destructuredLocals.length) {
        let destructuring = `  ${DECLARATION_KEYWORD} __locals = (` + opts.localsName + " || {}),\n";
        for (let i = 0; i < opts.destructuredLocals.length; i++) {
          let name = opts.destructuredLocals[i];
          if (!_JS_IDENTIFIER.test(name)) {
            throw new Error("destructuredLocals[" + i + "] is not a valid JS identifier.");
          }
          if (i > 0) {
            destructuring += ",\n  ";
          }
          destructuring += name + " = __locals." + name;
        }
        prepended += destructuring + ";\n";
      }
      if (opts._with !== false) {
        prepended += "  with (" + opts.localsName + " || {}) {\n";
        appended += "  }\n";
      }
      appended += "  return __output;\n";
      this.source = prepended + this.source + appended;
    }
    if (opts.compileDebug) {
      src = `${DECLARATION_KEYWORD} __line = 1
  , __lines = ` + JSON.stringify(this.templateText) + "\n  , __filename = " + sanitizedFilename + ";\ntry {\n" + this.source + "} catch (e) {\n  rethrow(e, __lines, __filename, __line, escapeFn);\n}\n";
    } else {
      src = this.source;
    }
    if (opts.client) {
      src = "escapeFn = escapeFn || " + escapeFn.toString() + ";\n" + src;
      if (opts.compileDebug) {
        src = "rethrow = rethrow || " + rethrow.toString() + ";\n" + src;
      }
    }
    if (opts.strict) {
      src = '"use strict";\n' + src;
    }
    if (opts.debug) {
      console.log(src);
    }
    if (opts.compileDebug && opts.filename) {
      src = src + "\n//# sourceURL=" + sanitizedFilename + "\n";
    }
    try {
      if (opts.async) {
        try {
          ctor = new Function("return (async function(){}).constructor;")();
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new Error("This environment does not support async/await");
          } else {
            throw e;
          }
        }
      } else {
        ctor = Function;
      }
      fn = new ctor(opts.localsName + ", escapeFn, include, rethrow", src);
    } catch (e) {
      if (e instanceof SyntaxError) {
        if (opts.filename) {
          e.message += " in " + opts.filename;
        }
        e.message += " while compiling ejs\n\n";
        e.message += "If the above error is not helpful, you may want to try EJS-Lint:\n";
        e.message += "https://github.com/RyanZim/EJS-Lint";
        if (!opts.async) {
          e.message += "\n";
          e.message += "Or, if you meant to create an async function, pass `async: true` as an option.";
        }
      }
      throw e;
    }
    let returnedFn = opts.client ? fn : function anonymous(data) {
      let include = function(path4, includeData) {
        let d = utils_default.shallowCopy(utils_default.createNullProtoObjWherePossible(), data);
        if (includeData) {
          d = utils_default.shallowCopy(d, includeData);
        }
        return includeFile(path4, opts)(d);
      };
      return fn.apply(
        opts.context,
        [data || utils_default.createNullProtoObjWherePossible(), escapeFn, include, rethrow]
      );
    };
    if (opts.filename && typeof Object.defineProperty === "function") {
      let filename = opts.filename;
      let basename3 = path.basename(filename, path.extname(filename));
      try {
        Object.defineProperty(returnedFn, "name", {
          value: basename3,
          writable: false,
          enumerable: false,
          configurable: true
        });
      } catch (e) {
      }
    }
    return returnedFn;
  },
  generateSource: function() {
    let opts = this.opts;
    if (opts.rmWhitespace) {
      this.templateText = this.templateText.replace(/[\r\n]+/g, "\n").replace(/^\s+|\s+$/gm, "");
    }
    this.templateText = this.templateText.replace(/[ \t]*<%_/gm, "<%_").replace(/_%>[ \t]*/gm, "_%>");
    let self = this;
    let matches = this.parseTemplateText();
    let d = this.opts.delimiter;
    let o = this.opts.openDelimiter;
    let c = this.opts.closeDelimiter;
    if (matches && matches.length) {
      matches.forEach(function(line, index) {
        let closing;
        if (line.indexOf(o + d) === 0 && line.indexOf(o + d + d) !== 0) {
          closing = matches[index + 2];
          if (!(closing == d + c || closing == "-" + d + c || closing == "_" + d + c)) {
            throw new Error('Could not find matching close tag for "' + line + '".');
          }
        }
        self.scanLine(line);
      });
    }
  },
  parseTemplateText: function() {
    let str = this.templateText;
    let pat = this.regex;
    let result = pat.exec(str);
    let arr = [];
    let firstPos;
    while (result) {
      firstPos = result.index;
      if (firstPos !== 0) {
        arr.push(str.substring(0, firstPos));
        str = str.slice(firstPos);
      }
      arr.push(result[0]);
      str = str.slice(result[0].length);
      result = pat.exec(str);
    }
    if (str) {
      arr.push(str);
    }
    return arr;
  },
  _addOutput: function(line) {
    if (this.truncate) {
      line = line.replace(/^(?:\r\n|\r|\n)/, "");
      this.truncate = false;
    }
    if (!line) {
      return line;
    }
    line = line.replace(/\\/g, "\\\\");
    line = line.replace(/\n/g, "\\n");
    line = line.replace(/\r/g, "\\r");
    line = line.replace(/"/g, '\\"');
    this.source += '    ; __append("' + line + '")\n';
  },
  scanLine: function(line) {
    let self = this;
    let d = this.opts.delimiter;
    let o = this.opts.openDelimiter;
    let c = this.opts.closeDelimiter;
    let newLineCount = 0;
    newLineCount = line.split("\n").length - 1;
    switch (line) {
      case o + d:
      case o + d + "_":
        this.mode = Template.modes.EVAL;
        break;
      case o + d + "=":
        this.mode = Template.modes.ESCAPED;
        break;
      case o + d + "-":
        this.mode = Template.modes.RAW;
        break;
      case o + d + "#":
        this.mode = Template.modes.COMMENT;
        break;
      case o + d + d:
        this.mode = Template.modes.LITERAL;
        this.source += '    ; __append("' + line.replace(o + d + d, o + d) + '")\n';
        break;
      case d + d + c:
        this.mode = Template.modes.LITERAL;
        this.source += '    ; __append("' + line.replace(d + d + c, d + c) + '")\n';
        break;
      case d + c:
      case "-" + d + c:
      case "_" + d + c:
        if (this.mode == Template.modes.LITERAL) {
          this._addOutput(line);
        }
        this.mode = null;
        this.truncate = line.indexOf("-") === 0 || line.indexOf("_") === 0;
        break;
      default:
        if (this.mode) {
          switch (this.mode) {
            case Template.modes.EVAL:
            case Template.modes.ESCAPED:
            case Template.modes.RAW:
              if (line.lastIndexOf("//") > line.lastIndexOf("\n")) {
                line += "\n";
              }
          }
          switch (this.mode) {
            // Just executing code
            case Template.modes.EVAL:
              this.source += "    ; " + line + "\n";
              break;
            // Exec, esc, and output
            case Template.modes.ESCAPED:
              this.source += "    ; __append(escapeFn(" + stripSemi(line) + "))\n";
              break;
            // Exec and output
            case Template.modes.RAW:
              this.source += "    ; __append(" + stripSemi(line) + ")\n";
              break;
            case Template.modes.COMMENT:
              break;
            // Literal <%% mode, append as raw output
            case Template.modes.LITERAL:
              this._addOutput(line);
              break;
          }
        } else {
          this._addOutput(line);
        }
    }
    if (self.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this.source += "    ; __line = " + this.currentLine + "\n";
    }
  }
};
ejs.escapeXML = utils_default.escapeXML;
ejs.__express = ejs.renderFile;
if (typeof window != "undefined") {
  window.ejs = ejs;
}
if (typeof module != "undefined") {
  module.exports = ejs;
}
var ejs_default = ejs;

// dist/cli/state-manager.js
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
function getPackageRoot() {
  const currentDir = __dirname;
  const baseName = path2.basename(currentDir);
  if (baseName === "cli" || baseName === "dist") {
    return path2.join(currentDir, "..", "..");
  }
  return path2.join(currentDir, "..");
}
function getProjectPaths(cwd) {
  const packageRoot = getPackageRoot();
  return {
    srcDir: path2.join(cwd, "src"),
    docDir: path2.join(cwd, "doc"),
    handlersDir: path2.join(cwd, "src", "handlers"),
    botJsonPath: path2.join(cwd, "bot.json"),
    stateTypesPath: path2.join(cwd, "src", "bot-state-types.ts"),
    botDiagramMdPath: path2.join(cwd, "doc", "bot-diagram.md"),
    botDiagramPngPath: path2.join(cwd, "doc", "bot-diagram.png"),
    // Templates are relative to the package root, not the CLI file
    templatePath: path2.join(packageRoot, "dist", "templates", "handler.ts.ejs")
  };
}
function loadBotConfig(cwd) {
  const paths = getProjectPaths(cwd);
  if (!fs2.existsSync(paths.botJsonPath)) {
    return {};
  }
  return JSON.parse(fs2.readFileSync(paths.botJsonPath, "utf-8"));
}
function saveBotConfig(config, cwd) {
  const paths = getProjectPaths(cwd);
  fs2.writeFileSync(paths.botJsonPath, JSON.stringify(config, null, 2) + "\n");
}
function validateStateName(name) {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}
function pascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getHandlerPath(stateName, cwd) {
  return path2.join(getProjectPaths(cwd).handlersDir, stateName, "index.ts");
}
function handlerExists(stateName, cwd) {
  return fs2.existsSync(getHandlerPath(stateName, cwd));
}
function isHandlerFolderNonEmpty(stateName, cwd) {
  const handlerDir = path2.join(getProjectPaths(cwd).handlersDir, stateName);
  if (!fs2.existsSync(handlerDir))
    return false;
  const files = fs2.readdirSync(handlerDir);
  return files.length > 0;
}
function getIncomingTransitions(config, stateName) {
  const incoming = [];
  for (const [from, targets] of Object.entries(config)) {
    if (targets.includes(stateName)) {
      incoming.push(from);
    }
  }
  return incoming;
}
function generateTypes(config) {
  const states = Object.keys(config).sort();
  if (states.length === 0) {
    return `// Auto-generated by telemeister state:sync - DO NOT EDIT
// No states defined yet

export type AppStates = never;

export type StateTransitions = Record<string, never>;
`;
  }
  const statesUnion = states.map((s) => `'${s}'`).join(" | ");
  let stateTransitionsContent = "";
  for (const state of states) {
    const targets = config[state] || [];
    if (targets.length === 0) {
      stateTransitionsContent += `  ${state}: void;
`;
    } else {
      const targetsUnion = [...targets].sort().map((t) => `'${t}'`).join(" | ");
      stateTransitionsContent += `  ${state}: ${targetsUnion} | void;
`;
    }
  }
  let returnTypesContent = "";
  for (const state of states) {
    const typeName = `${pascalCase(state)}Transitions`;
    returnTypesContent += `export type ${typeName} = Promise<StateTransitions['${state}']>;
`;
  }
  return `// Auto-generated by telemeister state:sync - DO NOT EDIT

export type AppStates = ${statesUnion};

export type StateTransitions = {
${stateTransitionsContent}};

${returnTypesContent}
`;
}
function generateMermaidDiagram(config) {
  const states = Object.keys(config);
  if (states.length === 0) {
    return "stateDiagram-v2\n    [*] --> [*]";
  }
  const transitions = [];
  for (const [from, targets] of Object.entries(config)) {
    for (const to of targets) {
      transitions.push(`    ${from} --> ${to}`);
    }
  }
  return `stateDiagram-v2
${transitions.join("\n")}`;
}
function generateMermaidMarkdown(config) {
  const mermaidCode = generateMermaidDiagram(config);
  return `# Bot State Diagram

\`\`\`mermaid
${mermaidCode}
\`\`\`
`;
}
async function generateDiagram(config, cwd) {
  const paths = getProjectPaths(cwd);
  if (!fs2.existsSync(paths.docDir)) {
    fs2.mkdirSync(paths.docDir, { recursive: true });
  }
  const mdContent = generateMermaidMarkdown(config);
  fs2.writeFileSync(paths.botDiagramMdPath, mdContent);
  console.log(`\u{1F4DD} Updated: doc/bot-diagram.md`);
  const mermaidCode = generateMermaidDiagram(config);
  const tempMmdPath = path2.join(cwd, ".temp-diagram.mmd");
  fs2.writeFileSync(tempMmdPath, mermaidCode);
  try {
    const { execSync: execSync2 } = await import("child_process");
    execSync2(`npx mmdc -i "${tempMmdPath}" -o "${paths.botDiagramPngPath}" -b white`, {
      stdio: "pipe",
      cwd
    });
    console.log(`\u{1F4DD} Updated: doc/bot-diagram.png`);
  } catch {
    console.warn(`\u26A0\uFE0F  Could not generate PNG diagram (mermaid-cli may not be installed)`);
  } finally {
    fs2.unlinkSync(tempMmdPath);
  }
}
async function createHandler(stateName, transitionStates, cwd) {
  const paths = getProjectPaths(cwd);
  const handlerDir = path2.join(paths.handlersDir, stateName);
  const handlerPath = path2.join(handlerDir, "index.ts");
  if (fs2.existsSync(handlerPath)) {
    console.log(`\u23ED\uFE0F  Handler already exists: src/handlers/${stateName}/index.ts`);
    return;
  }
  if (!fs2.existsSync(handlerDir)) {
    fs2.mkdirSync(handlerDir, { recursive: true });
  }
  const templateContent = fs2.readFileSync(paths.templatePath, "utf-8");
  const content = ejs_default.render(templateContent, {
    stateName,
    transitionStates: [...transitionStates].sort(),
    pascalCase
  });
  fs2.writeFileSync(handlerPath, content);
  console.log(`\u{1F4DD} Created: src/handlers/${stateName}/index.ts`);
}
function updateHandlersIndex(stateName, cwd) {
  const paths = getProjectPaths(cwd);
  const indexPath = path2.join(paths.handlersDir, "index.ts");
  if (!fs2.existsSync(indexPath)) {
    const content2 = `/**
 * State Handlers Index
 *
 * Import all your state handler files here.
 */

import './${stateName}/index.js';
`;
    fs2.writeFileSync(indexPath, content2);
    console.log(`\u{1F4DD} Created: src/handlers/index.ts`);
    return;
  }
  let content = fs2.readFileSync(indexPath, "utf-8");
  const importLine = `import './${stateName}/index.js';`;
  if (content.includes(importLine)) {
    return;
  }
  content = content.trimEnd() + `
${importLine}
`;
  fs2.writeFileSync(indexPath, content);
  console.log(`\u{1F4DD} Updated: src/handlers/index.ts`);
}
function removeFromHandlersIndex(stateName, cwd) {
  const paths = getProjectPaths(cwd);
  const indexPath = path2.join(paths.handlersDir, "index.ts");
  if (!fs2.existsSync(indexPath))
    return;
  let content = fs2.readFileSync(indexPath, "utf-8");
  const importLine = `import './${stateName}/index.js';`;
  if (content.includes(importLine)) {
    content = content.replace(new RegExp(`^${importLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}
?`, "m"), "");
    fs2.writeFileSync(indexPath, content);
    console.log(`\u{1F4DD} Removed import from: src/handlers/index.ts`);
  }
}
async function stateAdd(stateName) {
  const cwd = process.cwd();
  if (!stateName) {
    console.error("\u274C Error: State name is required");
    console.error("Usage: telemeister state:add <state-name>");
    process.exit(1);
  }
  if (!validateStateName(stateName)) {
    console.error("\u274C Error: State name must start with a letter and contain only letters, numbers, and underscores");
    process.exit(1);
  }
  const config = loadBotConfig(cwd);
  if (config[stateName]) {
    console.error(`\u274C Error: State "${stateName}" already exists in bot.json`);
    process.exit(1);
  }
  config[stateName] = [];
  saveBotConfig(config, cwd);
  console.log(`\u2705 Added state "${stateName}" to bot.json`);
  await createHandler(stateName, [], cwd);
  updateHandlersIndex(stateName, cwd);
  const paths = getProjectPaths(cwd);
  const typesContent = generateTypes(config);
  fs2.writeFileSync(paths.stateTypesPath, typesContent);
  console.log(`\u{1F4DD} Updated: src/bot-state-types.ts`);
  await generateDiagram(config, cwd);
  console.log(`
\u2705 State "${stateName}" added successfully!`);
  console.log(`
Next steps:`);
  console.log(`  1. Edit src/handlers/${stateName}/index.ts to customize the handler`);
  console.log(`  2. Add transitions: telemeister state:transition:add ${stateName} <target-state>`);
}
async function stateDelete(stateName) {
  const cwd = process.cwd();
  if (!stateName) {
    console.error("\u274C Error: State name is required");
    console.error("Usage: telemeister state:delete <state-name>");
    process.exit(1);
  }
  const config = loadBotConfig(cwd);
  if (!config[stateName]) {
    console.error(`\u274C Error: State "${stateName}" does not exist in bot.json`);
    process.exit(1);
  }
  if (isHandlerFolderNonEmpty(stateName, cwd)) {
    console.error(`\u274C Error: Cannot delete state "${stateName}" - handler folder is not empty`);
    console.error(`   Path: src/handlers/${stateName}/`);
    console.error(`   Remove or move the handler files first, then retry.`);
    process.exit(1);
  }
  const outgoing = config[stateName] || [];
  if (outgoing.length > 0) {
    console.error(`\u274C Error: Cannot delete state "${stateName}" - has outgoing transitions:`);
    outgoing.forEach((t) => console.error(`   ${stateName} \u2192 ${t}`));
    console.error(`   Remove transitions first: telemeister state:transition:delete ${stateName} <target>`);
    process.exit(1);
  }
  const incoming = getIncomingTransitions(config, stateName);
  if (incoming.length > 0) {
    console.error(`\u274C Error: Cannot delete state "${stateName}" - has incoming transitions:`);
    incoming.forEach((f) => console.error(`   ${f} \u2192 ${stateName}`));
    console.error(`   Remove transitions first: telemeister state:transition:delete <source> ${stateName}`);
    process.exit(1);
  }
  delete config[stateName];
  saveBotConfig(config, cwd);
  console.log(`\u2705 Removed state "${stateName}" from bot.json`);
  removeFromHandlersIndex(stateName, cwd);
  const paths = getProjectPaths(cwd);
  const typesContent = generateTypes(config);
  fs2.writeFileSync(paths.stateTypesPath, typesContent);
  console.log(`\u{1F4DD} Updated: src/bot-state-types.ts`);
  await generateDiagram(config, cwd);
  const handlerDir = path2.join(paths.handlersDir, stateName);
  if (fs2.existsSync(handlerDir)) {
    fs2.rmdirSync(handlerDir);
    console.log(`\u{1F5D1}\uFE0F  Removed empty folder: src/handlers/${stateName}/`);
  }
  console.log(`
\u2705 State "${stateName}" deleted successfully!`);
}
async function stateSync() {
  const cwd = process.cwd();
  const config = loadBotConfig(cwd);
  const states = Object.keys(config);
  console.log("\u{1F504} Syncing state types and handlers...\n");
  const paths = getProjectPaths(cwd);
  const typesContent = generateTypes(config);
  fs2.writeFileSync(paths.stateTypesPath, typesContent);
  console.log(`\u{1F4DD} Updated: src/bot-state-types.ts`);
  for (const state of states) {
    if (!handlerExists(state, cwd)) {
      await createHandler(state, config[state] || [], cwd);
      updateHandlersIndex(state, cwd);
    } else {
      console.log(`\u23ED\uFE0F  Handler exists: src/handlers/${state}/index.ts`);
    }
  }
  await generateDiagram(config, cwd);
  console.log("\n\u2705 Sync complete!");
}
async function transitionAdd(fromState, toState) {
  const cwd = process.cwd();
  if (!fromState || !toState) {
    console.error("\u274C Error: Both source and target state names are required");
    console.error("Usage: telemeister state:transition:add <from-state> <to-state>");
    process.exit(1);
  }
  const config = loadBotConfig(cwd);
  if (!config[fromState]) {
    console.error(`\u274C Error: Source state "${fromState}" does not exist in bot.json`);
    process.exit(1);
  }
  if (!config[toState]) {
    console.error(`\u274C Error: Target state "${toState}" does not exist in bot.json`);
    process.exit(1);
  }
  if (config[fromState].includes(toState)) {
    console.error(`\u274C Error: Transition "${fromState}" \u2192 "${toState}" already exists`);
    process.exit(1);
  }
  config[fromState].push(toState);
  saveBotConfig(config, cwd);
  console.log(`\u2705 Added transition: ${fromState} \u2192 ${toState}`);
  const paths = getProjectPaths(cwd);
  const typesContent = generateTypes(config);
  fs2.writeFileSync(paths.stateTypesPath, typesContent);
  console.log(`\u{1F4DD} Updated: src/bot-state-types.ts`);
  await generateDiagram(config, cwd);
}
async function transitionDelete(fromState, toState) {
  const cwd = process.cwd();
  if (!fromState || !toState) {
    console.error("\u274C Error: Both source and target state names are required");
    console.error("Usage: telemeister state:transition:delete <from-state> <to-state>");
    process.exit(1);
  }
  const config = loadBotConfig(cwd);
  if (!config[fromState]) {
    console.error(`\u274C Error: Source state "${fromState}" does not exist in bot.json`);
    process.exit(1);
  }
  const index = config[fromState].indexOf(toState);
  if (index === -1) {
    console.error(`\u274C Error: Transition "${fromState}" \u2192 "${toState}" does not exist`);
    process.exit(1);
  }
  config[fromState].splice(index, 1);
  saveBotConfig(config, cwd);
  console.log(`\u2705 Removed transition: ${fromState} \u2192 ${toState}`);
  const paths = getProjectPaths(cwd);
  const typesContent = generateTypes(config);
  fs2.writeFileSync(paths.stateTypesPath, typesContent);
  console.log(`\u{1F4DD} Updated: src/bot-state-types.ts`);
  await generateDiagram(config, cwd);
}

// dist/cli/create-bot.js
import * as fs3 from "fs";
import * as path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { execSync } from "child_process";
var __dirname2 = path3.dirname(fileURLToPath2(import.meta.url));
function getPackageRoot2() {
  const currentDir = __dirname2;
  const baseName = path3.basename(currentDir);
  if (baseName === "cli" || baseName === "dist") {
    return path3.join(currentDir, "..", "..");
  }
  return path3.join(currentDir, "..");
}
function loadTemplate(templateName) {
  const packageRoot = getPackageRoot2();
  const templatePath = path3.join(packageRoot, "dist", "templates", templateName);
  return fs3.readFileSync(templatePath, "utf-8");
}
function renderTemplate(templateName, data = {}) {
  const template = loadTemplate(templateName);
  return ejs_default.render(template, data);
}
async function createBot(botName) {
  if (!botName) {
    console.error("\u274C Error: Bot name is required");
    console.error("Usage: telemeister create-bot <bot-name>");
    process.exit(1);
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(botName)) {
    console.error("\u274C Error: Bot name must start with a letter and contain only letters, numbers, underscores, and hyphens");
    process.exit(1);
  }
  const targetDir = path3.resolve(process.cwd(), botName);
  if (fs3.existsSync(targetDir)) {
    console.error(`\u274C Error: Directory "${botName}" already exists`);
    process.exit(1);
  }
  console.log(`\u{1F680} Creating new bot: ${botName}
`);
  fs3.mkdirSync(targetDir, { recursive: true });
  fs3.mkdirSync(path3.join(targetDir, "src", "handlers"), { recursive: true });
  fs3.mkdirSync(path3.join(targetDir, "prisma"), { recursive: true });
  fs3.writeFileSync(path3.join(targetDir, ".gitignore"), loadTemplate("gitignore.ejs"));
  fs3.writeFileSync(path3.join(targetDir, "tsconfig.json"), loadTemplate("tsconfig.json.ejs"));
  fs3.writeFileSync(path3.join(targetDir, ".env.example"), loadTemplate("env.example.ejs"));
  fs3.writeFileSync(path3.join(targetDir, "bot.json"), loadTemplate("bot.json.ejs"));
  fs3.writeFileSync(path3.join(targetDir, "src", "index.ts"), loadTemplate("index.ts.ejs"));
  fs3.writeFileSync(path3.join(targetDir, "prisma", "schema.prisma"), loadTemplate("prisma-schema.prisma.ejs"));
  fs3.writeFileSync(path3.join(targetDir, "prisma.config.ts"), loadTemplate("prisma.config.ts.ejs"));
  fs3.mkdirSync(path3.join(targetDir, "src", "lib"), { recursive: true });
  fs3.writeFileSync(path3.join(targetDir, "src", "lib", "database.ts"), loadTemplate("database.ts.ejs"));
  fs3.writeFileSync(path3.join(targetDir, "README.md"), renderTemplate("README.md.ejs", { botName }));
  fs3.writeFileSync(path3.join(targetDir, "package.json"), renderTemplate("package.json.ejs", { botName }));
  process.chdir(targetDir);
  await stateSync();
  console.log("\n\u{1F4E6} Installing dependencies...");
  try {
    execSync("npm install", { stdio: "inherit" });
    console.log("\u2705 Dependencies installed\n");
  } catch {
    console.error('\u274C Failed to install dependencies. Please run "npm install" manually.\n');
    process.exit(1);
  }
  const tempDbUrl = "file:./dev.db";
  console.log("\u{1F5C4}\uFE0F  Generating Prisma client...");
  try {
    execSync("npm run db:generate", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: tempDbUrl }
    });
    console.log("\u2705 Prisma client generated\n");
  } catch {
    console.error('\u274C Failed to generate Prisma client. Please run "npm run db:generate" manually.\n');
    process.exit(1);
  }
  console.log("\u{1F5C4}\uFE0F  Creating initial database migration...");
  try {
    execSync("npx prisma migrate dev --name init", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: tempDbUrl }
    });
    console.log("\u2705 Database migration created\n");
  } catch {
    console.error('\u274C Failed to create database migration. Please run "npm run db:migrate" manually.\n');
    process.exit(1);
  }
  console.log(`\u2705 Bot "${botName}" created successfully!
`);
  console.log("Next steps:");
  console.log(`  cd ${botName}`);
  console.log("  cp .env.example .env  # Add your bot token from @BotFather");
  console.log("  npm run dev");
}

// dist/cli/cli.js
var command = process.argv[2];
var arg1 = process.argv[3];
var arg2 = process.argv[4];
async function runCLI() {
  switch (command) {
    case "create-bot":
      await createBot(arg1);
      break;
    case "state:add":
      await stateAdd(arg1);
      break;
    case "state:delete":
      await stateDelete(arg1);
      break;
    case "state:sync":
      await stateSync();
      break;
    case "state:transition:add":
      await transitionAdd(arg1, arg2);
      break;
    case "state:transition:delete":
      await transitionDelete(arg1, arg2);
      break;
    default:
      console.error("\u274C Unknown command:", command);
      console.error("");
      console.error("Available commands:");
      console.error("  create-bot <name>                    - Create a new bot project");
      console.error("  state:add <name>                     - Add a new state + create handler");
      console.error("  state:delete <name>                  - Delete a state (with safety checks)");
      console.error("  state:sync                           - Sync types and create missing handlers");
      console.error("  state:transition:add <from> <to>     - Add a transition");
      console.error("  state:transition:delete <from> <to>  - Delete a transition");
      process.exit(1);
  }
}
runCLI().catch((err) => {
  console.error("\u274C Error:", err.message);
  process.exit(1);
});
export {
  runCLI
};
/*! Bundled license information:

ejs/lib/esm/ejs.js:
  (**
   * @file Embedded JavaScript templating engine. {@link http://ejs.co}
   * @author Matthew Eernisse <mde@fleegix.org>
   * @project EJS
   * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
   *)
*/
