'use strict';

var compose = require('koa-compose'),
    pathToRegexp = require('path-to-regexp');

class Route {
  constructor(router, path) {
    this.router = router;
    this.path = path;
    this.keys = [];
    this.regex = pathToRegexp(router.prefix + path, this.keys);
    this.middleware = {};

    this.memoized = {};

    for (let method of ['get', 'post', 'delete', 'put']) {
      this[method] = function() {
        this.middleware[method] = compose([].slice.call(arguments));
        return this;
      }.bind(this);
    }
  }

  match(path, method) {
    return this.middleware[method] && this.regex.test(path);
  }

  getParams(path) {
    let r = this.regex.exec(path);
    let o = {};

    let n = 1;
    for (let k of this.keys) {
      o[k.name] = r[n++];
    }

    return o;
  }

  resolve(ctx, path, method, next) {
    let router = this.router;

    ctx.params = this.getParams(path);

    if (!this.memoized[method]) {
      let mw = [this.middleware[method]];

      if (router.preMiddleware[method]) {
        mw.unshift(router.preMiddleware[method]);
      }

      if (router.preMiddleware['all']) {
        mw.unshift(router.preMiddleware['all']);
      }

      this.memoized[method] = compose(mw);
    }

    return this.memoized[method].call(ctx, next);
  }
}

module.exports = Route;
