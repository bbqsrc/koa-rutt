'use strict';

var dox = require('dox'),
    //marked = require('marked'),
    fs = require('fs'),
    path = require('path');

let toc = [];

function getSource() {
  var dirname = path.resolve(__dirname, '../lib');
  var dir = fs.readdirSync(dirname);

  let out = [];

  for (let fn of dir) {
    let data = fs.readFileSync(path.resolve(dirname, fn), { encoding: 'utf-8' });
    out.push(convertToMarkdown(data));
  }

  console.log('## API\n\n' + toc.join('\n') + '\n\n' + out.join('\n\n---\n\n'));
}

function parseTags(segment) {
  let o = {};

  for (let tag of segment.tags) {
    if (tag.type === 'param') {
      if (!o.param) o.param = [];
      o.param.push(tag);
    } else if (tag.type === 'example') {
      if (!o.example) o.example = [];
      let re = /<caption>(.*?)<\/caption>\s*/;
      if (re.test(tag.string)) {
        tag.string = tag.string.replace(re, function() {
          tag.caption = arguments[1];
          return '';
        });
      }
      o.example.push(tag);
    } else {
      o[tag.type] = tag;
    }
  }

  return o;
}

function mdTitleURL(text) {
  return text.toLowerCase().replace(/ /g, '-').replace(/[^-a-z0-9]/g, '');
}

function convertToMarkdown(data) {
  let o = dox.parseComments(data, { raw: true });
  let x = [];

  for (let segment of o) {
    let out = [];

    if (segment.isPrivate) {
      continue;
    }

    let tags = parseTags(segment);
    let name = tags.name ? tags.name.string : segment.ctx.name;

    let outName, outNameParams = [], outParams = [];

    if (segment.isClass) {
      let n = 'class `' + name + '`';
      x.push('### ' + n);
      toc.push('- [' + n + '](#' + mdTitleURL(n) + ')');
    }

    if (tags.param) {
      outParams.push('| Name | Type | Attributes | Description |');
      outParams.push('| ---- | ---- | ---------- | ----------- |');

      for (let param of tags.param) {
        let attrs = [];
        if (param.variable) { attrs.push('multiple'); }
        if (param.optional) { attrs.push('optional'); }

        outNameParams.push((param.variable ? '...' : '') + param.name);
        outParams.push('| ' + param.name +
                ' | `' + param.types.join('|') +
                '` | ' + attrs.join(',') +
                ' | ' + param.description + ' |');
      }
    }

    if (segment.isClass) {
      outName = '`new ' + name;
    } else {
      outName = '`';

      if (segment.ctx.type === 'method') {
        outName += segment.ctx.cons + '#' + name;
      }
    }
    outName += ' (' + outNameParams.join(', ') + ')';

    if (tags.returns) {
      outName += ' → {' + tags.returns.types.join('|') + '}';
    }

    outName += '`';
    toc.push('  - [' + outName + '](#' + mdTitleURL(outName) + ')');

    out.push('#### ' + outName);
    out.push(segment.description.full);
    out.push(outParams.join('\n'));

    if (tags.returns) {
      out.push('**Returns:** `' + tags.returns.types.join('|') + '` ' +
              tags.returns.description);
    }

    if (tags.example) {
      for (let example of tags.example) {
        if (example.caption) {
          out.push('**Example:** ' + example.caption);
        }
        out.push('```javascript\n' + example.string + '\n```');
      }
    }

    x.push(out.join('\n\n'));
  }

  return x.join('\n\n---\n\n');
}

getSource();
/*
var derp = [
  {
    "tags": [
      {
        "type": "class",
        "string": "",
        "html": ""
      },
      {
        "type": "since",
        "string": "0.1",
        "html": "<p>0.1</p>"
      },
      {
        "type": "param",
        "string": "{String} prefix The prefix of each route of this router.",
        "name": "prefix",
        "description": "<p>The prefix of each route of this router.</p>",
        "types": [
          "String"
        ],
        "typesDescription": "<code>String</code>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": false
      }
    ],
    "description": {
      "full": "<p>The router.</p>",
      "summary": "<p>The router.</p>",
      "body": ""
    },
    "isPrivate": false,
    "isConstructor": false,
    "isClass": true,
    "isEvent": false,
    "ignore": false,
    "line": 6,
    "codeStart": 14,
    "code": "class Router {\n  constructor(prefix) {\n    this.routes = {};\n    this.prefix = prefix || '';\n    this.preMiddleware = {};",
    "ctx": {
      "type": "class",
      "constructor": "Router",
      "cons": "Router",
      "name": "Router",
      "extends": "",
      "string": "new Router()"
    }
  },
  {
    "tags": [
      {
        "type": "memberof",
        "string": "Router#",
        "html": "<p>Router#</p>"
      },
      {
        "type": "name",
        "string": "get|post|delete|put",
        "html": "<p>get|post|delete|put</p>"
      },
      {
        "type": "function",
        "string": "",
        "html": ""
      },
      {
        "type": "since",
        "string": "0.1",
        "html": "<p>0.1</p>"
      },
      {
        "type": "param",
        "string": "{String} path The path to the relevant Route.",
        "name": "path",
        "description": "<p>The path to the relevant Route.</p>",
        "types": [
          "String"
        ],
        "typesDescription": "<code>String</code>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": false
      },
      {
        "type": "param",
        "string": "{...GeneratorFunction} middleware Middleware to be attached to called HTTP method.",
        "name": "middleware",
        "description": "<p>Middleware to be attached to called HTTP method.</p>",
        "types": [
          "GeneratorFunction"
        ],
        "typesDescription": "...<a href=\"GeneratorFunction.html\">GeneratorFunction</a>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": true
      },
      {
        "type": "returns",
        "string": "{Router} Returns this instance of Router.",
        "types": [
          "Router"
        ],
        "typesDescription": "<a href=\"Router.html\">Router</a>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": false,
        "description": "<p>Returns this instance of Router.</p>"
      }
    ],
    "description": {
      "full": "",
      "summary": "",
      "body": ""
    },
    "isPrivate": false,
    "isConstructor": false,
    "isClass": false,
    "isEvent": false,
    "ignore": false,
    "line": 20,
    "codeStart": 32,
    "code": "for (let method of ['get', 'post', 'delete', 'put']) {\n  this[method] = function(path) {\n    this.route(path)[method](compose([].slice.call(arguments, 1)));\n    return this;\n  }.bind(this);\n}\n  }",
    "ctx": {
      "type": "method",
      "constructor": "Router",
      "cons": "Router",
      "name": "for",
      "string": "Router.prototype.for()"
    }
  },
  {
    "tags": [
      {
        "type": "since",
        "string": "0.1",
        "html": "<p>0.1</p>"
      },
      {
        "type": "param",
        "string": "{String} path The URL path to the resource.",
        "name": "path",
        "description": "<p>The URL path to the resource.</p>",
        "types": [
          "String"
        ],
        "typesDescription": "<code>String</code>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": false
      },
      {
        "type": "param",
        "string": "{Object} [methods] An object with HTTP methods.",
        "name": "[methods]",
        "description": "<p>An object with HTTP methods.</p>",
        "types": [
          "Object"
        ],
        "typesDescription": "<code>Object</code>",
        "optional": true,
        "nullable": false,
        "nonNullable": false,
        "variable": false
      },
      {
        "type": "example",
        "string": "router.route('/test', {\n  get: function* (next) { ... }\n});",
        "html": "<p>router.route(&#39;/test&#39;, {<br />  get: function* (next) { ... }<br />});</p>"
      },
      {
        "type": "example",
        "string": "let testRoute = router.route('/test');",
        "html": "<p>let testRoute = router.route(&#39;/test&#39;);</p>"
      },
      {
        "type": "returns",
        "string": "{Router|Route} Returns this instance of Router, or Route for path\n                        if no methods specified.",
        "types": [
          "Router",
          "Route"
        ],
        "typesDescription": "<a href=\"Router.html\">Router</a>|<a href=\"Route.html\">Route</a>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": false,
        "description": "<p>Returns this instance of Router, or Route for path                         if no methods specified.</p>"
      }
    ],
    "description": {
      "full": "<p>Create or get a Route from the Router object, or HTTP methods on Route<br />by using the optional methods parameter.</p>",
      "summary": "<p>Create or get a Route from the Router object, or HTTP methods on Route<br />by using the optional methods parameter.</p>",
      "body": ""
    },
    "isPrivate": false,
    "isConstructor": false,
    "isClass": false,
    "isEvent": false,
    "ignore": false,
    "line": 40,
    "codeStart": 60,
    "code": "route(path, methods) {\n  if (!this.routes[path]) {\n    this.routes[path] = new Route(this, path);\n  }\n\n  if (methods) {\n    this.routes[path].middleware = methods;\n    return this;\n  }\n\n  return this.routes[path];\n}",
    "ctx": {
      "type": "method",
      "constructor": "Router",
      "cons": "Router",
      "name": "route",
      "string": "Router.prototype.route()"
    }
  },
  {
    "tags": [
      {
        "type": "private",
        "string": "",
        "visibility": "private",
        "html": ""
      }
    ],
    "description": {
      "full": "",
      "summary": "",
      "body": ""
    },
    "isPrivate": true,
    "isConstructor": false,
    "isClass": false,
    "isEvent": false,
    "ignore": false,
    "line": 73,
    "codeStart": 74,
    "code": "match(realPath, method) {\n  for (let path of Object.keys(this.routes)) {\n    let route = this.routes[path];\n\n    if (route.match(realPath, method)) {\n      return route;\n    }\n  }\n}",
    "ctx": {
      "type": "method",
      "constructor": "Router",
      "cons": "Router",
      "name": "match",
      "string": "Router.prototype.match()"
    }
  },
  {
    "tags": [
      {
        "type": "since",
        "string": "0.1",
        "html": "<p>0.1</p>"
      },
      {
        "type": "param",
        "string": "{string} [method] The HTTP method (eg 'get') to as pre-middleware to.",
        "name": "[method]",
        "description": "<p>The HTTP method (eg &#39;get&#39;) to as pre-middleware to.</p>",
        "types": [
          "string"
        ],
        "typesDescription": "<code>string</code>",
        "optional": true,
        "nullable": false,
        "nonNullable": false,
        "variable": false
      },
      {
        "type": "param",
        "string": "{...GeneratorFunction} middleware The middleware to attach.",
        "name": "middleware",
        "description": "<p>The middleware to attach.</p>",
        "types": [
          "GeneratorFunction"
        ],
        "typesDescription": "...<a href=\"GeneratorFunction.html\">GeneratorFunction</a>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": true
      },
      {
        "type": "example",
        "string": "router.pre(function* (next) {\n  this.type = 'application/json';\n  yield next;\n}).pre('post', bodyParser());",
        "html": "<p>router.pre(function* (next) {<br />  this.type = &#39;application/json&#39;;<br />  yield next;<br />}).pre(&#39;post&#39;, bodyParser());</p>"
      },
      {
        "type": "returns",
        "string": "{Router} Returns this instance of Router.",
        "types": [
          "Router"
        ],
        "typesDescription": "<a href=\"Router.html\">Router</a>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": false,
        "description": "<p>Returns this instance of Router.</p>"
      }
    ],
    "description": {
      "full": "<p>Define middleware to run prior to HTTP method middleware. If no method<br />provided, the middleware will run before all other middlewares on the router.</p>",
      "summary": "<p>Define middleware to run prior to HTTP method middleware. If no method<br />provided, the middleware will run before all other middlewares on the router.</p>",
      "body": ""
    },
    "isPrivate": false,
    "isConstructor": false,
    "isClass": false,
    "isEvent": false,
    "ignore": false,
    "line": 84,
    "codeStart": 101,
    "code": "pre(method) {\n  let args = [].slice.call(arguments);\n\n  if (typeof method === 'string') {\n    args.shift();\n  } else {\n    method = 'all';\n  }\n\n  if (this.preMiddleware[method]) {\n    args.unshift(this.preMiddleware[method]);\n  }\n\n  this.preMiddleware[method] = compose(args);\n  return this;\n}",
    "ctx": {
      "type": "method",
      "constructor": "Router",
      "cons": "Router",
      "name": "pre",
      "string": "Router.prototype.pre()"
    }
  },
  {
    "tags": [
      {
        "type": "since",
        "string": "0.1",
        "html": "<p>0.1</p>"
      },
      {
        "type": "returns",
        "string": "{GeneratorFunction} Middleware to provide to Koa.",
        "types": [
          "GeneratorFunction"
        ],
        "typesDescription": "<a href=\"GeneratorFunction.html\">GeneratorFunction</a>",
        "optional": false,
        "nullable": false,
        "nonNullable": false,
        "variable": false,
        "description": "<p>Middleware to provide to Koa.</p>"
      }
    ],
    "description": {
      "full": "<p>Returns the middleware to be provided to the Koa app instance.</p>",
      "summary": "<p>Returns the middleware to be provided to the Koa app instance.</p>",
      "body": ""
    },
    "isPrivate": false,
    "isConstructor": false,
    "isClass": false,
    "isEvent": false,
    "ignore": false,
    "line": 118,
    "codeStart": 125,
    "code": "middleware() {\n  let router = this;\n\n  return function* middleware(next) {\n    let path = this.path;\n    let method = this.method.toLowerCase();\n\n    let matched = router.match(path, method);\n    if (matched) {\n      next = matched.resolve(this, path, method, next);\n    }\n\n    yield* next;\n  };\n}\n}\n\nmodule.exports = Router;",
    "ctx": {
      "type": "method",
      "constructor": "Router",
      "cons": "Router",
      "name": "middleware",
      "string": "Router.prototype.middleware()"
    }
  }
]

*/
