import qiniu from 'qiniu'
import Promise from 'promise'
import { join, resolve } from 'path'
import slash from 'slash'

class QiniuOSSPlugin {
  //构造函数传参
  constructor(options) {
    if (!options || !options.ACCESS_KEY || !options.SECRET_KEY) {
      throw new Error('ACCESS_KEY and SECRET_KEY must be provided')
    }
    this.options = Object.assign({}, options)
    qiniu.conf.ACCESS_KEY = this.options.ACCESS_KEY
    qiniu.conf.SECRET_KEY = this.options.SECRET_KEY
  }

  apply(compiler) {
    // 拿到webpack的所有配置
    const webpackOptions = compiler.options
    // context为Webpack的执行环境（执行文件夹路径）
    const { output } = webpackOptions || {}
    const { path: OUTPUT_PATH } = output || ''

    this.options.OUTPUT_PATH = OUTPUT_PATH

    //检测webpack5 和webpack4
    if (compiler.hooks && compiler.hooks.afterEmit) {
      compiler.hooks.afterEmit.tap(
        'Qiniu-OSS-Webpack-Plugin',
        this.hooksHandler.bind(this)
      )
    } else {
      compiler.plugin('after-emit', this.pluginHanlder)
    }
  }

  //webpack5
  hooksHandler(compilation, callback) {
    const assets = compilation.assets
    const hash = compilation.hash
    const { bucket, include } = this.options
    let { path = '[hash]' } = this.options

    path = path.replace('[hash]', hash)

    const OUTPUT_PATH = this.options.OUTPUT_PATH

    const promises = Object.keys(assets)
      .filter((fileName) => {
        let valid = true
        if (include) {
          valid = include.some((includeFileName) => {
            if (includeFileName instanceof RegExp) {
              return includeFileName.test(fileName)
            }
            return includeFileName === fileName
          })
        }
        return valid
      })
      .map((fileName) => {
        const key = slash(join(path, fileName))
        const putPolicy = new qiniu.rs.PutPolicy(`${bucket}:${key}`)
        const token = putPolicy.token()
        const extra = new qiniu.io.PutExtra()

        let filePath = resolve(OUTPUT_PATH, fileName)

        return this.uploadify({
          token,
          key,
          realFile: filePath,
          extra,
        })
      })

    Promise.all(promises)
      .then((res) => {
        callback()
      })
      .catch((e) => {
        callback(e)
      })
  }

  // webpack 4
  pluginHanlder(compilation, callback) {
    const assets = compilation.assets
    const hash = compilation.hash
    const { bucket, include } = this.options
    let { path = '[hash]' } = this.options

    path = path.replace('[hash]', hash)

    const promises = Object.keys(assets)
      .filter((fileName) => {
        let valid = assets[fileName].emitted
        if (include) {
          valid =
            valid &&
            include.some((includeFileName) => {
              if (includeFileName instanceof RegExp) {
                return includeFileName.test(fileName)
              }
              return includeFileName === fileName
            })
        }
        return valid
      })
      .map((fileName) => {
        const key = slash(join(path, fileName))
        const putPolicy = new qiniu.rs.PutPolicy(`${bucket}:${key}`)
        const token = putPolicy.token()
        const extra = new qiniu.io.PutExtra()

        return this.uploadify({
          token,
          key,
          realFile: assets[fileName].existsAt,
          extra,
        })
      })

    Promise.all(promises)
      .then((res) => {
        callback()
      })
      .catch((e) => {
        callback(e)
      })
  }

  //上传至七牛云
  uploadify({ token, key, realFile, extra }) {
    return new Promise((resolve, reject) => {
      const begin = Date.now()
      qiniu.io.putFile(token, key, realFile, extra, (err, ret) => {
        if (!err) {
          resolve({
            ...ret,
            duration: Date.now() - begin,
          })
        } else {
          reject(err)
        }
      })
    })
  }
}

module.exports = QiniuOSSPlugin
