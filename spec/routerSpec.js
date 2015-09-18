'use strict';

var Router = require('../lib/router');
var Route = require('../lib/route');

var koa = require('koa');
var supertest = require('supertest');

supertest.Test.prototype.exec = function(done) {
  this.end(function(err) {
    if (err) {
      done.fail(err);
    } else {
      done();
    }
  });
};

describe('Router', function() {
  it('can be created', function() {
    let router = new Router;
    expect(router).not.toBe(null);
  });

  it('supports #route', function() {
    let router = new Router;

    let route = router.route('/any/route');

    expect(route instanceof Route).toBe(true);
  });

  it('allows #pre setting for all methods', function() {
    let router = new Router;

    expect(router.preMiddleware['all']).not.toBeDefined();
    router.pre(function*() {});
    expect(router.preMiddleware['all']).toBeDefined();
  });

  it('allows #pre setting for each HTTP method', function() {
    let router = new Router;

    for (let method of ['get', 'post', 'delete', 'put']) {
      expect(router.preMiddleware[method]).not.toBeDefined();
      router.pre(method, function*() {});
      expect(router.preMiddleware[method]).toBeDefined();
    }
  });

  it('allows each HTTP method', function() {
    let router = new Router;

    // Create initial route.
    router.route('/test');

    for (let method of ['get', 'post', 'delete', 'put']) {
      expect(router.routes['/test'].middleware[method]).not.toBeDefined();
      router[method]('/test', function*() {});
      expect(router.routes['/test'].middleware[method]).toBeDefined();
    }
  });
});

describe('Route', function() {
  it('allows each HTTP method', function() {
    let route = new Route(new Router, '/test');

    for (let method of ['get', 'post', 'delete', 'put']) {
      expect(route.middleware[method]).not.toBeDefined();
      route[method](function*() {});
      expect(route.middleware[method]).toBeDefined();
    }
  });
});

describe('Router in an app', function() {
  var app, request, router;

  beforeAll(function() {
    app = koa();

    router = new Router;

    router.route('/test', {
      get: function*() {
        this.body = 'get!';
      },
      post: function*() {
        this.body = 'post!';
      },
      put: function*() {
        this.body = 'put!';
      },
      delete: function*() {
        this.body = 'delete!';
      }
    });

    app.use(router.middleware());

    request = supertest.agent(app.listen());
  });

  it('returns a body from GET', function(done) {
    request
    .get('/test')
    .expect(200)
    .expect('get!')
    .exec(done);
  });

  it('returns a body from POST', function(done) {
    request
    .post('/test')
    .expect(200)
    .expect('post!')
    .exec(done);
  });

  it('returns a body from PUT', function(done) {
    request
    .put('/test')
    .expect(200)
    .expect('put!')
    .exec(done);
  });

  it('returns a body from DELETE', function(done) {
    request
    .delete('/test')
    .expect(200)
    .expect('delete!')
    .exec(done);
  });
});
