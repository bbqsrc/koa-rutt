"use strict"

const pathToRegexp = require("path-to-regexp"),
      constants = require("./constants"),
      compose = require("./compose").compose

/**
 * The route.
 * @class Route
 *
 * @since 0.1
 *
 * @param {Router} router - The Router this Route is attached to.
 * @param {String} path - The URL path.
 */
class Route {
  constructor(router, path) {
    this.router = router
    this.path = path
    this.keys = []
    this.regex = pathToRegexp(router.prefix + path, this.keys)
    this.middleware = {}

    this.memoized = {}

    /**
     * Assign middleware to be run upon relevant HTTP method being triggered.
     *
     * @memberof Route#
     * @name get|post|delete|put
     * @function
     *
     * @since 0.1
     *
     * @param {...Middleware} middleware - Middleware to be attached to called HTTP method.
     *
     * @returns {Route} Returns this instance of Route.
     */
    for (const method of constants.methods) {
      this[method] = function onMethod() {
        this.middleware[method] = compose(Array.from(arguments))
        return this
      }.bind(this)
    }
  }

  /** @private */
  match(path, method) {
    return this.middleware[method] && this.regex.test(path)
  }

  /** @private */
  getParams(path) {
    const r = this.regex.exec(path)
    const o = {}
    let n = 1

    for (const k of this.keys) {
      o[k.name] = r[n++]
    }

    return o
  }

  /** @private */
  resolve(ctx, path, method, next) {
    const router = this.router

    ctx.params = this.getParams(path)

    if (!this.memoized[method]) {
      const mw = [this.middleware[method]]

      if (router.preMiddleware[method]) {
        mw.unshift(router.preMiddleware[method])
      }

      if (router.preMiddleware.all) {
        mw.unshift(router.preMiddleware.all)
      }

      this.memoized[method] = compose(mw)
    }

    return this.memoized[method](ctx, next)
  }
}

module.exports = Route
