# 介绍

这是一个 mini 版的 koa 框架，用于学习 koa 框架的实现原理，下面是具体的实现过程。

# application

1.  在根目录下创建 lib 目录，在 lib 目录下创建入口 `application.js`

    ```js
    // lib/application.js

    /**
     * Application 类
     *
     * use：用于接收中间件
     *
     * listen：创建 http 服务，并且监听端口
     */

    const http = require("http");

    class Application {
      /**
       * 用于接收中间件
       * @params {function} fn：中间件函数
       */
      use(fn) {
        this.fn = fn;
      }

      /**
       * 开启服务器
       * @param  {...any} args：监听服务器的参数
       */
      listen(...args) {
        // 创建服务器：回调函数的形参为 NodeJS 的 request 和 response
        const server = http.createServer((request, response) => {
          // 调用中间件
          this.fn(request, response);
        });
        // 监听
        server.listen(...args);
      }
    }

    module.exports = Application;
    ```

# context

1.  在 lib 目录下创建上下文对象的文件 `context.js`

    ```js
    const context = {};

    /**
     * 封装 Object.defineProperty 函数
     * @params {string} target：目标属性
     * @params {string} key：属性名
     */
    function defineProperty(target, key) {
      // 配置别名
      Object.defineProperty(context, key, {
        get: function () {
          return this[target][key];
        },
        set: function (value) {
          this[target][key] = value;
        },
      });
    }

    defineProperty("request", "path");
    defineProperty("request", "query");
    defineProperty("request", "body");

    module.exports = context;
    ```

2.  在 lib 目录下创建请求对象的文件 `request.js`

    ```js
    // lib/request.js

    const request = {};
    module.exports = request;
    ```

3.  在 lib 目录下创建响应对象的文件 `response.js`

    ```js
    // lib/response.js

    const response = {};
    module.exports = response;
    ```

4.  在 `application.js` 文件中定义上下文对象的相关配置

    ```js
    /**
     * Application 类
     *
     * use：用于接收中间件
     *
     * listen：创建 http 服务，并且监听端口
     */

    const context = require("./context");
    const request = require("./request");
    const response = require("./response");

    class Application {
      constructor() {
        // 上下文对象
        this.context = context;
        // 请求对象
        this.request = request;
        // 响应对象
        this.response = response;
      }

      /**
       * 创建上下文对象
       * @params {object} req：NodeJS 的请求对象
       * @params {object} res：NodeJS 的响应对象
       */
      createContext(request, response) {
        // req 和 res 属性为 NodeJS 对象上的 request 和 response
        this.context.req = request;
        this.context.res = response;

        // request 和 response 属性为请求对象和响应对象
        this.context.request = this.request;
        this.context.request.req = request;
        this.context.response = this.response;
        this.context.response.res = request;

        // state 属性为空对象
        this.context.state = {};
        // originaUrl 属性为 NodeJS 对象上的 request 属性的 url 属性
        this.context.originaUrl = request.url;

        return this.context;
      }

      /**
       * 开启服务器
       * @param  {...any} args：监听服务器的参数
       */
      listen(...args) {
        // 创建服务器：回调函数的形参为 NodeJS 的 request 和 response
        const server = http.createServer((request, response) => {
          // 上下文对象实例
          const context = this.createContext(request, response);
          // 调用中间件
          this.fn(context);
        });
      }
    }

    module.exports = Application;
    ```

# request

1.  配置请求对象

    ```js
    // lib/request.js

    const url = require("url");

    const request = {
      // path 属性的 getter 函数
      get path() {
        const { pathname } = url.parse(this.req.url);
        return pathname;
      },
      // query 属性的 getter 函数
      get query() {
        const { query } = url.parse(this.req.url, true); // 传入 true 的意义：确保 query 为对象，否则为字符串
        return query;
      },
    };

    module.exports = request;
    ```

# response

1.  配置响应对象

    ```js
    // lib/response.js

    const response = {
      // body 属性的初始值
      _body: undefined,
      // body 的 getter 函数
      get body() {
        return this._body;
      },
      // body 的 setter 函数
      set body(value) {
        this._body = value;
      },
    };

    module.exports = response;
    ```

2.  在 application 对象中给予响应

    ```js
    // lib/application.js

    /**
     * Application 类
     *
     * use：用于接收中间件
     *
     * listen：创建 http 服务，并且监听端口
     */

    class Application {
      /**
       * 开启服务器
       * @param  {...any} args：监听服务器的参数
       */
      listen(...args) {
        // 创建服务器：回调函数的形参为 NodeJS 的 request 和 response
        const server = http.createServer((request, response) => {
          // 给予响应
          response.end(context.body);
        });
        // 监听
        server.listen(...args);
      }
    }

    module.exports = Application;
    ```

# 中间件

1.  在 application 中配置中间件

    ```js
    /**
     * Application 类
     *
     * use：用于接收中间件
     *
     * listen：创建 http 服务，并且监听端口
     */

    class Application {
      constructor() {
        // 中间件
        this.middlewares = [];
        // 上下文对象
      }

      /**
       * 用于接收中间件
       * @params {function} fn：中间件函数
       */
      use(fn) {
        // 将中间件函数放到中间件数组中
        this.middlewares.push(fn);
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
          if (index <= curIndex) return Promise.reject("next不能执行多次");
          curIndex = index;

          // 中间件执行完毕了
          if (this.middlewares.length === index) {
            return Promise.resolve();
          }

          // fn：中间件函数
          const fn = this.middlewares[index];
          // 执行下一个中间件
          return Promise.resolve(
            fn(context, () => {
              dispatch(index + 1);
            })
          );
        };
        return dispatch(0);
      }

      /**
       * 开启服务器
       * @params  {...any} args：监听服务器的参数
       */
      listen(...args) {
        // 创建服务器：回调函数的形参为 NodeJS 的 request 和 response
        const server = http.createServer((request, response) => {
          // 调用中间件
          this.compose(context).then(() => {
            response.end(context.body);
          });
        });
      }
    }
    ```
