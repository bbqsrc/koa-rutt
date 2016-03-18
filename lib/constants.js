"use strict"

const methods = ["delete", "get", "head", "options", "patch", "post", "put", "trace"]
const endpoints = Symbol("endpoints")

/**
 * Middleware callback signature for use with koa-rutt.
 *
 * Must be a generator.
 *
 * @callback Middleware
 *
 * @param {KoaContext} ctx - The koa context.
 * @param {KoaMiddleware} next - The koa 'next' middleware.
 */

module.exports = { methods, endpoints }
