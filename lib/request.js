/* 
  请求对象
*/

const url = require('url')

const request = {
  // path 属性的 getter 函数
  get path() {
    const { pathname } = url.parse(this.req.url)
    return pathname
  },
  // query 属性的 getter 函数
  get query() {
    const { query } = url.parse(this.req.url, true) // 传入 true 的意义：确保 query 为对象，否则为字符串
    return query
  },
}

module.exports = request