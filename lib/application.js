/**
 * Application 类
 *   use：用于接收中间件
 *   listen：创建 http 服务，并且监听端口
 */

const http = require('http')
const context = require('./context')
const request = require('./request')
const response = require('./response')

class Application {
  constructor() {
    // 中间件
    this.middlewares = []
    // 上下文对象
    this.context = context
    // 请求对象
    this.request = request
    // 响应对象
    this.response = response
  }

  /**
   * 创建上下文对象
   * @params {object} req：NodeJS 的请求对象
   * @params {object} res：NodeJS 的响应对象
   */
  createContext(request, response) {
    // req 和 res 属性为 NodeJS 对象上的 request 和 response
    this.context.req = request
    this.context.res = response

    // request 和 response 属性为请求对象和响应对象
    this.context.request = this.request
    this.context.request.req = request
    this.context.response = this.response
    this.context.response.res = request

    // state 属性为空对象
    this.context.state = {}
    // originaUrl 属性为 NodeJS 对象上的 request 属性的 url 属性
    this.context.originaUrl = request.url

    return this.context
  }

  /**
   * 用于接收中间件
   * @params {function} fn：中间件函数
   */
  use(fn) {
    // 将中间件函数放到中间件数组中
    this.middlewares.push(fn)
  }

  /**
   * @params {object} content：上下文对象
   */
  compose(content) {
    // curIndex：当前正在执行的中间件索引
    let curIndex = -1;
    // 这里要用箭头函数，否则 this 指向 compose
    const dispatch = (index) => {
      // 同一个中间件多次调用了 next()
      if (index <= curIndex) return Promise.reject('next不能执行多次')
      curIndex = index;

      // 中间件执行完毕了
      if (this.middlewares.length === index) {
        return Promise.resolve()
      }

      // fn：中间件函数
      const fn = this.middlewares[index]
      // 执行下一个中间件
      return Promise.resolve(fn(context, () => {
        dispatch(index + 1)
      }))
    }
    return dispatch(0)
  }

  /**
   * 开启服务器
   * @params  {...any} args：监听服务器的参数
   */
  listen(...args) {
    // 创建服务器：回调函数的形参为 NodeJS 的 request 和 response
    const server = http.createServer((request, response) => {
      // 上下文对象实例
      const context = this.createContext(request, response)
      // 调用中间件
      this.compose(context).then(() => {
        response.end(context.body)
      })
    })
    // 监听
    server.listen(...args)
  }
}

module.exports = Application