"use strict"

const Router = require("../lib/router")
const Route = require("../lib/route")
const constants = require('../lib/constants')

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

  describe("in an app", function() {
    const app = koa()

    const router = new Router()
    const router2 = new Router()
    const router3 = new Router({ prefix: "/prefix" })

    router
      .route("/test", {
        * get() {
          this.body = "get!"
        },
        * post() {
          this.body = "post!"
        },
        * put() {
          this.body = "put!"
        },
        * delete() {
          this.body = "delete!"
        }
      })
      .get("/params/:test1/:test2", function* () {
        this.body = `${this.params.test1},${this.params.test2}`
      })
      .route("/longer/url/here", {
        * get() {
          this.body = "yus"
        }
      })
      .get("/yield-before", function* () {
        this.body = "before yield"
      })
      .get("/yield*", function* () {
        this.body = ":)"
      })
      .get("/yield-after", function* () {
        this.body = "after yield"
      })

    router2
      .pre(function* (next) {
        this.body = "pre"
        yield next
      })
      .get("/pre", function* () {
        this.body += "get"
      })

    router3
      .get("/foo", function* (next) {
        this.body = "yes"
      })

    app.use(router.middleware())
    app.use(router2.middleware())
    app.use(router3.middleware())

    const request = supertest.agent(app.listen())

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
