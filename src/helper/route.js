
const fs = require('fs')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const Handlebars = require('handlebars')
const readdir = promisify(fs.readdir)
const path = require('path')
const mime = require('./mime')
const compress = require('../config/compress')
const tplPath = path.join(__dirname, '../template/dir.tpl')

const source = fs.readFileSync(tplPath, 'utf-8')

const template = Handlebars.compile(source)
const config = require('../config/defaultConfig')
module.exports = async function (req, res, filePath) {
    try {
        const stats = await stat(filePath)
        if (stats.isFile()) {
            const contentType = mime(filePath)
            res.statusCode = 200
            res.setHeader('Content-Type', contentType)
            let rs = fs.createReadStream(filePath)
            if(filePath.match(config.compress)){
                rs = compress(rs,req,res)
            }
            fs.createReadStream(filePath).pipe(res)
        } else if (stats.isDirectory()) {
            const files = await readdir(filePath)
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            const dir = path.relative(config.root, filePath)
            const data = {
                files: files.map(file => {
                    return {
                        file,
                        icon: mime(file)
                    }
                }),
                dir: dir ? `/${dir}` : '',
                title: path.basename(filePath),

            }
            res.end(template(data))
        }
    } catch (ex) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain')
        res.end(`${filePath} is a directory or file`)
    }
}