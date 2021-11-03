# qiniu-oss-webpack-plugin

支持 Webpack5 的七牛云存储 webpack 插件，兼容webpack4 

之前项目使用的是 https://github.com/longtian/qiniu-webpack-plugin 但webpack5插件进制改动蛮大的，所以我做了升级，并兼容了webpack4，目前用法和原来的一样


## 安装

```bash
npm install qiniu-oss-webpack-plugin --save-dev
```

## 引入
```javascript
const QiniuOssPlugin = require('qiniu-oss-webpack-plugin');
```

## 配置

- `ACCESS_KEY`,`SECRET_KEY`, `bucket` 与七牛云设置一致
- `path` 存储的路径，默认为 `[hash]`
- `include` 可选项。你可以选择上传的文件，比如`['main.js']``或者`[/main/]`

另外

- Webpack 的 `output.publicPath` 要指向七牛云（或自定义的）域名地址


```js

// 这里配置 Plugin

// 这里是 Webpack 的配置
module.exports={
 output:{
    // 这里是七牛的域名加上 Webpack 的 hash
    publicPath:"http://abc.com/foo/bar/"
    // ..
 },
 plugins:[
   new QiniuOssPlugin({
      ACCESS_KEY: qiniu.accessKey,
      SECRET_KEY: qiniu.secretKey,
      bucket: qiniu.bucket,
      //上传目录的第一级目录前千万不要有"/" 巨坑
      path: 'web/static/',
      //要上传的文件匹配规则
      include: [/\.js$/, /\.js.gz$/, /\.css$/, /\.css.gz$/],
      //exclude 考虑后期支持
    }),
   // ...
 ]
 // ...
}
```