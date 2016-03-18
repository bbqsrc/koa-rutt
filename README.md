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

- [callback `Middleware`](#callback-middleware)
  - [`function* Middleware(ctx, next)`](#function-middlewarectx-next)
- [class `Route`](#class-route)
  - [`new Route(router, path)`](#new-routerouter-path)
  - [`Route#for(...middleware) → {Route}`](#routeformiddleware--route)
- [class `Router`](#class-router)
  - [`new Router([options])`](#new-routeroptions)
  - [`Router#for(path, ...middleware) → {Router}`](#routerforpath-middleware--router)
  - [`Router#use(routeClass) → {Router}`](#routeruserouteclass--router)
  - [`Router#route(path, [methods]) → {Router|Route}`](#routerroutepath-methods--routerroute)
  - [`Router#pre([method], ...middleware) → {Router}`](#routerpremethod-middleware--router)
  - [`Router#middleware() → {GeneratorFunction}`](#routermiddleware--generatorfunction)

---

### callback `Middleware`

---

#### `function* Middleware(ctx, next)`

Middleware callback signature for use with koa-rutt.

Must be a generator.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| ctx | `KoaContext` |  | The koa context. |
| next | `KoaMiddleware` |  | The koa 'next' middleware. |

---

### class `Route`

---

#### `new Route(router, path)`

The route.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| router | `Router` |  | The Router this Route is attached to. |
| path | `String` |  | The URL path. |

---

#### `Route#for(...middleware) → {Route}`

Assign middleware to be run upon relevant HTTP method being triggered.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| middleware | `Middleware` | multiple | Middleware to be attached to called HTTP method. |

**Returns:** `Route` Returns this instance of Route.

---

### class `Router`

---

#### `new Router([options])`

The router.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| [options] | `Object` | optional | Options object |
| options.prefix | `string` |  | The prefix of each route of this router. |

---

#### `Router#for(path, ...middleware) → {Router}`

Assign middleware to be run upon relevant HTTP method being triggered.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| path | `String` |  | The path to the relevant Route. |
| middleware | `Middleware` | multiple | Middleware to be attached to called HTTP method. |

**Returns:** `Router` Returns this instance of Router.

---

#### `Router#use(routeClass) → {Router}`

Add routes using a provided constructor that implements the endpoints protocol.

All class methods are bound to the class instance.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| routeClass | `Function|Class` |  | The constructor implementing endpoints protocol |

**Returns:** `Router` Returns this instance of Router.

**Example:** Usage with class

```javascript
class MemberRoutes extends Routes {
 [endpoints]() {
   const get = {
     "/member/:id": this.get
   }

   const post = {
     "/members": this.create
   }

   const put = {
     "/member/:id": [requireAuth, this.update]
   }

   const del = {
     "/member/:id": [requireAuth, this.delete]
   }

   return { get, post, put, delete: del }
 }

 * get(ctx, next) { ... }
 * create(ctx, next) { ... }
 * update(ctx, next) { ... }
 * delete(ctx, next) { ... }
}
```

---

#### `Router#route(path, [methods]) → {Router|Route}`

Create or get a Route from the Router object, or HTTP methods on Route
by using the optional methods parameter.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| path | `String` |  | The URL path to the resource. |
| [methods] | `Object` | optional | An object with HTTP methods. |

**Returns:** `Router|Route` Returns this instance of Router, or Route for path if no methods specified.

**Example:** Usage with optional methods parameter

```javascript
router.route('/test', {
  * get(ctx, next) {
    // Do something
  },
  * post(ctx, next) {
    // Do something
  }
})
```

**Example:** Usage with only path parameter

```javascript
const testRoute = router.route('/test')
```

---

#### `Router#pre([method], ...middleware) → {Router}`

Define middleware to run prior to HTTP method middleware. If no method
provided, the middleware will run before all other middlewares on the router.

| Name | Type | Attributes | Description |
| ---- | ---- | ---------- | ----------- |
| [method] | `string` | optional | The HTTP method (eg 'get') to add pre-middleware to. |
| middleware | `Middleware` | multiple | The middleware to attach. |

**Returns:** `Router` Returns this instance of Router.

**Example:** Example of #pre usage.

```javascript
router.pre(function* (ctx, next) {
  ctx.type = 'application/json'
  yield next
}).pre('post', bodyParser())
```

---

#### `Router#middleware() → {GeneratorFunction}`

Returns the middleware to be provided to the Koa app instance.

**Returns:** `GeneratorFunction` Middleware to provide to Koa.

## License

BSD 2-clause license. See LICENSE.
