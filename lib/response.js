/* 
  响应对象
*/

const response = {
  // body 属性的初始值
  _body: undefined,
  // body 的 getter 函数
  get body() {
    return this._body
  },
  // body 的 setter 函数
  set body(value) {
    this._body = value
  }
}

module.exports = response
