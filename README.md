# koa-rutt

[![Build Status](https://travis-ci.org/bbqsrc/koa-rutt.svg?branch=master)](https://travis-ci.org/bbqsrc/koa-rutt) [![codecov.io](http://codecov.io/github/bbqsrc/koa-rutt/coverage.svg?branch=master)](http://codecov.io/github/bbqsrc/koa-rutt?branch=master)

Swedish routing, for Koa.

## Install

`npm install koa-rutt`

## Usage

Most features will be demonstrated below.

```javascript
var app = require('koa')();
    Router = require('koa-rutt');

var router = new Router();

// Add pre-middleware.
router
.pre(function*(next) {
   // This will run on all HTTP methods first (GET, POST, etc);
})
.pre('post', function*(next) {
  // Run a middleware just on this HTTP method (POST), such as a body parser
})
.get('/', function*(next) {
  this.body = "Index!";
})
.get('/item/:id', function(next) {
  // a `params` object is added to `this`.
  var id = this.params.id;
})
.post('/item/:id', function(next) {
  // You can use this just like koa-router, although repeating yourself
  // does get annoying.
})
.route('/item2/:id', {
  // How about we define them all at once?
  get: function*(next) {
    var id = this.params.id;
  },
  post: function*(next) {
    // Oh this is much better!
  }
});

// You can also return individual Route objects if you prefer
router
.route('/some/route')
.get(function*(next) {
  // ...
})
.post(function(next) {
  // ...
})
.delete(function(next) {
  // ...
}),
.put(function(next) {
  // ...
});

// Add the router as middleware to the app.
app.use(router.middleware());

app.listen(3000);
```

## API

- [class `Route`](#class-route)
  - [`new Route (router, path)`](#new-route-router-path)
  - [`Route#get|post|delete|put (...middleware) → {Route}`](#routegetpostdeleteput-middleware--route)
- [class `Router`](#class-router)
  - [`new Router (prefix)`](#new-router-prefix)
  - [`Router#get|post|delete|put (path, ...middleware) → {Router}`](#routergetpostdeleteput-path-middleware--router)
  - [`Router#route (path, [methods]) → {Router|Route}`](#routerroute-path-methods--routerroute)
  - [`Router#pre ([method], ...middleware) → {Router}`](#routerpre-method-middleware--router)
  - [`Router#middleware () → {GeneratorFunction}`](#routermiddleware---generatorfunction)

---

### class `Route`

---

#### `new Route (router, path)`

The route.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| router | `Router` |  | The Router this Route is attached to. |
| path | `String` |  | The URL path. |

---

#### `Route#get|post|delete|put (...middleware) → {Route}`

Assign middleware to be run upon relevant HTTP method being triggered.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| middleware | `GeneratorFunction` | multiple | Middleware to be attached to called HTTP method. |

**Returns:** `Route` Returns this instance of Route.

---

### class `Router`

---

#### `new Router (prefix)`

The router.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| prefix | `String` |  | The prefix of each route of this router. |

---

#### `Router#get|post|delete|put (path, ...middleware) → {Router}`

Assign middleware to be run upon relevant HTTP method being triggered.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| path | `String` |  | The path to the relevant Route. |
| middleware | `GeneratorFunction` | multiple | Middleware to be attached to called HTTP method. |

**Returns:** `Router` Returns this instance of Router.

---

#### `Router#route (path, [methods]) → {Router|Route}`

Create or get a Route from the Router object, or HTTP methods on Route
by using the optional methods parameter.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| path | `String` |  | The URL path to the resource. |
| [methods] | `Object` | optional | An object with HTTP methods. |

**Returns:** `Router|Route` Returns this instance of Router, or Route for path                         if no methods specified.

**Example:** Usage with optional methods parameter

```javascript
router.route('/test', {
  get: function* (next) { ... }
});
```

**Example:** Usage with only path parameter

```javascript
let testRoute = router.route('/test');
```

---

#### `Router#pre ([method], ...middleware) → {Router}`

Define middleware to run prior to HTTP method middleware. If no method
provided, the middleware will run before all other middlewares on the router.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| [method] | `string` | optional | The HTTP method (eg 'get') to add pre-middleware to. |
| middleware | `GeneratorFunction` | multiple | The middleware to attach. |

**Returns:** `Router` Returns this instance of Router.

**Example:** Example of #pre usage.

```javascript
router.pre(function* (next) {
  this.type = 'application/json';
  yield next;
}).pre('post', bodyParser());
```

---

#### `Router#middleware () → {GeneratorFunction}`

Returns the middleware to be provided to the Koa app instance.

**Returns:** `GeneratorFunction` Middleware to provide to Koa.

## License

ISC - see LICENSE.
