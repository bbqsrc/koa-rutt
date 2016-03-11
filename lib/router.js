"use strict"

const Route = require("./route"),
      compose = require("koa-compose")

/**
 * The router.
 * @class
 *
 * @since 0.1
 *
 * @param {String} prefix The prefix of each route of this router.
 */
class Router {
  constructor(prefix) {
    this.routes = {}
    this.prefix = prefix || ""
    this.preMiddleware = {}

    /**
     * Assign middleware to be run upon relevant HTTP method being triggered.
     *
     * @memberof Router#
     * @name get|post|delete|put
     * @function
     *
     * @since 0.1
     *
     * @param {String} path The path to the relevant Route.
     * @param {...GeneratorFunction} middleware Middleware to be attached to called HTTP method.
     *
     * @returns {Router} Returns this instance of Router.
     */
    for (const method of ["get", "post", "delete", "put"]) {
      this[method] = function onMethod(path) {
        const middlewares = compose([].slice.call(arguments, 1))

        this.route(path)[method](middlewares)
        return this
      }.bind(this)
    }
  }

  /**
   * Create or get a Route from the Router object, or HTTP methods on Route
   * by using the optional methods parameter.
   *
   * @since 0.1
   *
   * @param {String} path The URL path to the resource.
   * @param {Object} [methods] An object with HTTP methods.
   *
   * @example <caption>Usage with optional methods parameter</caption>
   * router.route('/test', {
   *   get: function* (next) { ... }
   * });
   *
   * @example <caption>Usage with only path parameter</caption>
   * consttestRoute = router.route('/test');
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
  match(realPath, method) {
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
   * @since 0.1
   *
   * @param {string} [method] The HTTP method (eg 'get') to add pre-middleware to.
   * @param {...GeneratorFunction} middleware The middleware to attach.
   *
   * @example <caption>Example of #pre usage.</caption>
   * router.pre(function* (next) {
   *   this.type = 'application/json';
   *   yield next;
   * }).pre('post', bodyParser());
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
      const matched = self.match(path, method)

      if (matched) {
        // eslint-disable-next-line no-param-reassign
        next = matched.resolve(this, path, method, next)
      }

      yield* next
    }
  }
}

module.exports = Router
