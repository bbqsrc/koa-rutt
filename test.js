'use strict';

var app = require('koa')();

var Router = require('./index');

var router = new Router;

router
  .route('/test')
    .get(function*(next) {
      this.body = "oh yes!";
      return;
    });

router
.pre('get', function*(next) {
  if (this.params.id == "break") {
    this.body = "nope";
    return;
  }

  yield next;
})
.route('/another/:id')
.get(function*() {
  return this.body = this.params.id;
});

var admin = new Router('/admin');

admin.route('/test').get(function*() { return this.body = 'admin!' });

let another = new Router;

another
.pre('post', bodyParser())
.route('/magic', {
  get: function*(next) {
    return this.body = 'maaaagic!';
  },
  post: function*(next) {

  }
});

app.use(router.middleware());
app.use(admin.middleware());
app.use(another.middleware());

app.listen(3010);
