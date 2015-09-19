'use strict';

var Route = require('./route'),
    compose = require('koa-compose');

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
    this.routes = {};
    this.prefix = prefix || '';
    this.preMiddleware = {};

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
    for (let method of ['get', 'post', 'delete', 'put']) {
      this[method] = function(path) {
        this.route(path)[method](compose([].slice.call(arguments, 1)));
        return this;
      }.bind(this);
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
   * let testRoute = router.route('/test');
   *
   * @returns {Router|Route} Returns this instance of Router, or Route for path
   *                         if no methods specified.
   */
  route(path, methods) {
    if (!this.routes[path]) {
      this.routes[path] = new Route(this, path);
    }

    if (methods) {
      this.routes[path].middleware = methods;
      return this;
    }

    return this.routes[path];
  }

  /** @private */
  match(realPath, method) {
    for (let path of Object.keys(this.routes)) {
      let route = this.routes[path];

      if (route.match(realPath, method)) {
        return route;
      }
    }
  }

  /**
   * Define middleware to run prior to HTTP method middleware. If no method
   * provided, the middleware will run before all other middlewares on the router.
   *
   * @since 0.1
   *
   * @param {string} [method] The HTTP method (eg 'get') to as pre-middleware to.
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
  pre(method) {
    let args = [].slice.call(arguments);

    if (typeof method === 'string') {
      args.shift();
    } else {
      method = 'all';
    }

    if (this.preMiddleware[method]) {
      args.unshift(this.preMiddleware[method]);
    }

    this.preMiddleware[method] = compose(args);
    return this;
  }

  /**
   * Returns the middleware to be provided to the Koa app instance.
   *
   * @since 0.1
   *
   * @returns {GeneratorFunction} Middleware to provide to Koa.
   */
  middleware() {
    let router = this;

    return function* middleware(next) {
      let path = this.path;
      let method = this.method.toLowerCase();

      let matched = router.match(path, method);
      if (matched) {
        next = matched.resolve(this, path, method, next);
      }

      yield* next;
    };
  }
}

module.exports = Router;
