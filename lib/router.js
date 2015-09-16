'use strict';

var Route = require('./route'),
    compose = require('koa-compose');

class Router {
  constructor(prefix) {
    this.routes = {};
    this.prefix = prefix || '';
    this.preMiddleware = {};
  }

  route(path, methods) {
    if (!this.routes[path]) {
      this.routes[path] = new Route(this, path);
    }

    if (methods) {
      this.routes[path].middleware = methods;
    }

    return this.routes[path];
  }

  match(realPath, method) {
    for (let path of Object.keys(this.routes)) {
      let route = this.routes[path];

      if (route.match(realPath, method)) {
        return route;
      }
    }
  }

  pre(method) {
    let args = [].slice.call(arguments);

    if (typeof method === 'string') {
      args.shift();
    } else {
      method = 'all';
    }

    this.preMiddleware[method] = compose(args);
    return this;
  }

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
