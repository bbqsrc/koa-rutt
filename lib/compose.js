"use strict" /* eslint-disable no-param-reassign */

// Modified version of: https://github.com/koajs/compose
// License: MIT

/** @private */
function compose(middlewares) {
  if (arguments.length > 1) {
    return compose(arguments)
  }

  return function* (ctx, next) {
    if (!next) {
      next = function* noop() {}
    }

    let i = middlewares.length

    while (i--) {
      next = middlewares[i](ctx, next)
    }

    return yield* next
  }
}

module.exports = { compose }
