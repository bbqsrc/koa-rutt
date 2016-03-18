"use strict"

const Route = require("./route"),
      constants = require("./constants"),
      compose = require("./compose").compose

/**
 * The router.
 * @class Router
 *
 * @since 0.2
 *
 * @param {Object} [options] - Options object
 * @param {string} options.prefix - The prefix of each route of this router.
 */
class Router {
  constructor() {
    const options = arguments[0] || {}

    this.prefix = options.prefix || ""

    this.routes = {}
    this.preMiddleware = {}

    /**
     * Assign middleware to be run upon relevant HTTP method being triggered.
     *
     * @memberof Router#
     * @name get|post|delete|put
     * @function
     *
     * @since 0.3
     *
     * @param {String} path - The path to the relevant Route.
     * @param {...Middleware} middleware - Middleware to be attached to called HTTP method.
     *
     * @returns {Router} Returns this instance of Router.
     */
    for (const method of constants.methods) {
      this[method] = function onMethod(path) {
        const middlewares = compose([].slice.call(arguments, 1))

        this.route(path)[method](middlewares)
        return this
      }.bind(this)
    }
  }

  /**
   * Add routes using a provided constructor that implements the endpoints protocol.
   *
   * All class methods are bound to the class instance.
   *
   * @since 0.3
   *
   * @param {Function|Class} routeClass - The constructor implementing endpoints protocol
   *
   * @example <caption>Usage with class implementing endpoints protocol</caption>
   * const endpoints = require("koa-rutt").endpoints
   *
   * class MemberRoutes {
   *   [endpoints]() {
   *     return {
   *       get: {
   *         "/member/:id": this.get
   *       },
   *       post: {
   *         "/members": this.create
   *       },
   *       put: {
   *         "/member/:id": [requireAuth, this.update]
   *       },
   *       delete: {
   *         "/member/:id": [requireAuth, this.delete]
   *       }
   *     }
   *   }
   *
   *   * get(ctx, next) { ... }
   *   * create(ctx, next) { ... }
   *   * update(ctx, next) { ... }
   *   * delete(ctx, next) { ... }
   * }
   *
   * @returns {Router} Returns this instance of Router.
   */
  use(routeClass) {
    const instance = new routeClass(this) // eslint-disable-line new-cap

    if (!instance[constants.endpoints]) {
      throw new TypeError("Provided object does not implement routes protocol")
    }

    const routes = instance[constants.endpoints]()

    for (const method in routes) {
      for (const path in routes[method]) {
        if (!this.routes[path]) {
          this.routes[path] = new Route(this, path)
        }

        const o = routes[method][path]
        const middleware = Array.isArray(o) ? compose(o) : o

        this.routes[path].middleware[method] = middleware
      }
    }

    return this
  }

  /**
   * Create or get a Route from the Router object, or HTTP methods on Route
   * by using the optional methods parameter.
   *
   * @since 0.3
   *
   * @param {String} path - The URL path to the resource.
   * @param {Object} [methods] - An object with HTTP methods.
   *
   * @example <caption>Usage with optional methods parameter</caption>
   * router.route('/test', {
   *   * get(ctx, next) {
   *     // Do something
   *   },
   *   * post(ctx, next) {
   *     // Do something
   *   }
   * })
   *
   * @example <caption>Usage with only path parameter</caption>
   * const testRoute = router.route('/test')
   *
   * @returns {Router|Route} Returns this instance of Router, or Route for path
   *                         if no methods specified.
   */
  route(path, methods) {
    if (!this.routes[path]) {
      this.routes[path] = new Route(this, path)
    }

    if (methods) {
      this.routes[path].middleware = methods
      return this
    }

    return this.routes[path]
  }

  /** @private */
  match(ctx, realPath, method) {
    for (const path of Object.keys(this.routes)) {
      const route = this.routes[path]

      if (route.match(realPath, method)) {
        return route
      }
    }
  }

  /**
   * Define middleware to run prior to HTTP method middleware. If no method
   * provided, the middleware will run before all other middlewares on the router.
   *
   * @since 0.3
   *
   * @param {string} [method] - The HTTP method (eg 'get') to add pre-middleware to.
   * @param {...Middleware} middleware - The middleware to attach.
   *
   * @example <caption>Example of #pre usage.</caption>
   * router.pre(function* (ctx, next) {
   *   ctx.type = 'application/json'
   *   yield next
   * }).pre('post', bodyParser())
   *
   * @returns {Router} Returns this instance of Router.
   */
  pre() {
    const args = [].slice.call(arguments)
    let method

    if (typeof args[0] === "string") {
      method = args.shift()
    } else {
      method = "all"
    }

    if (this.preMiddleware[method]) {
      args.unshift(this.preMiddleware[method])
    }

    this.preMiddleware[method] = compose(args)
    return this
  }

  /**
   * Returns the middleware to be provided to the Koa app instance.
   *
   * @since 0.1
   *
   * @returns {GeneratorFunction} Middleware to provide to Koa.
   */
  middleware() {
    const self = this

    return function* middleware(next) {
      const path = this.path
      const method = this.method.toLowerCase()
      const matched = self.match(this, path, method)

      if (matched) {
        // eslint-disable-next-line no-param-reassign
        next = matched.resolve(this, path, method, next)
      }

      yield* next
    }
  }
}

module.exports = Router
