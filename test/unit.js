"use strict"

const Router = require("../lib/router")
const Route = require("../lib/route")
const constants = require("../lib/constants")

const koa = require("koa")
const supertest = require("supertest-as-promised")

describe("Router", function() {
  it("can be created", function() {
    const router = new Router()

    expect(router).to.exist
  })

  it("supports #route", function() {
    const router = new Router()
    const route = router.route("/any/route")

    expect(route).to.be.an.instanceof(Route)
  })

  it("allows #pre setting for all methods", function() {
    const router = new Router()

    expect(router.preMiddleware.all).not.to.exist

    router.pre(function* () {})
    expect(router.preMiddleware.all).to.exist
  })

  it("allows #pre setting for each HTTP method", function() {
    const router = new Router()

    for (const method of constants.methods) {
      expect(router.preMiddleware[method]).not.to.exist
      router.pre(method, function* () {})
      expect(router.preMiddleware[method]).to.exist
    }
  })

  it("allows each HTTP method", function() {
    const router = new Router()

    // Create initial route.
    router.route("/test")

    for (const method of constants.methods) {
      expect(router.routes["/test"].middleware[method]).not.to.exist

      router[method]("/test", function* () {})
      expect(router.routes["/test"].middleware[method]).to.exist
    }
  })

  it("handles assets helper method", function* () {
    const router = new Router()

    router.assets("/static", __dirname)

    expect(router.routes["/static/:assetPath(.+)"].middleware.get).to.exist
  })

  describe("in an app", function() {
    const app = koa()

    const router = new Router()
    const router2 = new Router()
    const router3 = new Router({ prefix: "/prefix" })

    router
      .assets("/static", __dirname)
      .route("/test", {
        * get(ctx) {
          ctx.body = "get!"
        },
        * post(ctx) {
          ctx.body = "post!"
        },
        * put(ctx) {
          ctx.body = "put!"
        },
        * delete(ctx) {
          ctx.body = "delete!"
        }
      })
      .get("/params/:test1/:test2", function* (ctx) {
        ctx.body = `${ctx.params.test1},${ctx.params.test2}`
      })
      .route("/longer/url/here", {
        * get(ctx) {
          ctx.body = "yus"
        }
      })
      .get("/yield-before", function* (ctx) {
        ctx.body = "before yield"
      })
      .get("/yield*", function* (ctx) {
        ctx.body = ":)"
      })
      .get("/yield-after", function* (ctx) {
        ctx.body = "after yield"
      })

    router2
      .pre(function* (ctx, next) {
        ctx.body = "pre"
        yield next
      })
      .get("/pre", function* (ctx) {
        ctx.body += "get"
      })

    router3
      .get("/foo", function* (ctx) {
        ctx.body = "yes"
      })

    app.use(router.middleware())
    app.use(router2.middleware())
    app.use(router3.middleware())

    const request = supertest.agent(app.listen())

    it("returns a static file from /static", function* () {
      yield request
        .get("/static/unit.js")
        .expect(200)
    })

    it("returns no static file from /static", function* () {
      yield request
        .get("/static/nothing")
        .expect(404)
    })

    it("returns a body from GET", function* () {
      yield request
        .get("/test")
        .expect(200)
        .expect("get!")
    })

    it("returns a body from POST", function* () {
      yield request
        .post("/test")
        .expect(200)
        .expect("post!")
    })

    it("returns a body from PUT", function* () {
      yield request
        .put("/test")
        .expect(200)
        .expect("put!")
    })

    it("returns a body from DELETE", function* () {
      yield request
        .delete("/test")
        .expect(200)
        .expect("delete!")
    })

    it("handles .params properly", function* () {
      yield request
        .get("/params/foo/magic")
        .expect(200)
        .expect("foo,magic")
    })

    it("resolves #pre middleware properly", function* () {
      yield request
        .get("/pre")
        .expect(200)
        .expect("preget")
    })

    it("returns 404 for unrouted pages", function* () {
      yield request
        .get("/anything")
        .expect(404)
    })

    it("returns a body from GET, with a longer URL", function* () {
      yield request
        .get("/longer/url/here")
        .expect(200)
        .expect("yus")
    })

    it("always returns the first match", function* () {
      yield request
        .get("/yield-before")
        .expect(200)
        .expect("before yield")

      yield request
        .get("/yield123")
        .expect(200)
        .expect(":)")

      yield request
        .get("/yield-after")
        .expect(200)
        .expect(":)")
    })

    it("handles prefixed routers", function* () {
      yield request
        .get("/prefix/foo")
        .expect(200)
        .expect("yes")
    })
  })
})

describe("Endpoints protocol", function() {
  const endpoints = require("../lib/constants").endpoints

  function* requireAuth(ctx, next) {
    // stub
    yield next
  }

  class TestRoutes {
    [endpoints]() {
      return {
        get: {
          "/test/:id": this.get
        },
        post: {
          "/tests": this.create
        },
        put: {
          "/test/:id": [requireAuth, this.update]
        },
        delete: {
          "/test/:id": [requireAuth, this.delete]
        }
      }
    }

    * get(ctx) {
      ctx.body = ctx.params.id
    }

    * create(ctx) {
      ctx.body = "create"
    }

    * update(ctx) {
      ctx.body = "update"
    }

    * delete(ctx) {
      ctx.body = "delete"
    }
  }

  const app = koa()
  const router = new Router()

  router.use(TestRoutes)
  app.use(router.middleware())

  const request = supertest.agent(app.listen())

  it("works as expected", function* () {
    yield request
      .get("/test/123")
      .expect(200)
      .expect("123")

    yield request
      .post("/tests")
      .expect(200)
      .expect("create")

    yield request
      .put("/test/123")
      .expect(200)
      .expect("update")

    yield request
      .delete("/test/123")
      .expect(200)
      .expect("delete")
  })
})

describe("Route", function() {
  it("allows each HTTP method", function() {
    const route = new Route(new Router(), "/test")

    for (const method of constants.methods) {
      expect(route.middleware[method]).not.to.exist

      route[method](function* () {})
      expect(route.middleware[method]).to.exist
    }
  })
})
