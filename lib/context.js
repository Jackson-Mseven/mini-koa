/* 
  上下文对象
*/

const context = {}

/**
 * 配置别名
 * @params {string} target：目标属性
 * @params {string} key：属性名
 */
function defineProperty(target, key) {
  Object.defineProperty(context, key, {
    get: function () {
      return this[target][key]
    },
    set: function (value) {
      this[target][key] = value
    }
  })
}

// 配置 path、query、body 的别名
defineProperty('request', 'path')
defineProperty('request', 'query')
defineProperty('request', 'body')

module.exports = context