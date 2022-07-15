'use strict'
import path from 'path'
import fs from 'fs-extra'
import fg from 'fast-glob'
import { $, cd } from 'zx'
import { join } from 'path'
export default async function FileUtils(readPath, writePath) {
  if (!exists(readPath)) {
    throw new Error(`file-utils: ${readPath} does not exist`)
  }
  if (!exists(writePath)) {
    throw new Error(`file-utils: ${writePath} path does not exist`)
  }
  let file = {
    async open(encoding = 'utf8') {
      await read(readPath, encoding)
    },
    async save(data) {
      return await write(writePath, data)
    },
    change: {
      async readFile(readPath2) {
        return await FileUtils(readPath2, writePath)
      },
      async writeFile(writePath2, data) {
        return await (await FileUtils(readPath, writePath2)).save(data)
      },
    },
    JSON: await jsonRead(readPath),
  }
  return file
}
export function interpretPath(...args) {
  return path.join($.cwd || process.cwd(), ...(args ?? ''))
}
export const readDirectorySync = (directory, allFiles = []) => {
  const files = fs.readdirSync(directory).map((file) => join(directory, file))
  allFiles.push(...files)
  files.forEach((file) => {
    fs.statSync(file).isDirectory() && readDirectorySync(file, allFiles)
  })
  return allFiles
}
export function exists(path2) {
  path2 = interpretPath(path2)
  return fs.existsSync(interpretPath(path2))
}
export async function remove(path2) {
  path2 = interpretPath(path2)
  return fs.remove(interpretPath(path2))
}
export async function read(path2, encoding) {
  path2 = interpretPath(path2)
  return fs.readFile(path2, encoding ?? 'utf-8')
}
read.sync = function (...args) {
  const path2 = interpretPath(args)
  return fs.readFileSync(path2, 'utf-8')
}
export async function mkdir(...path2) {
  let input = interpretPath(...path2)
  return fs.mkdir(input)
}
export async function write(path2, content) {
  return fs.writeFile(interpretPath(path2), content, 'utf-8')
}
write.sync = function (path2, content) {
  return fs.writeFileSync(interpretPath(path2), content, 'utf-8')
}
async function jsonRead(path2) {
  path2 = interpretPath(path2)
  return fs.readJSON(path2)
}
jsonRead.sync = function (path2) {
  path2 = interpretPath(path2)
  return fs.readJSONSync(path2)
}
read.json = jsonRead
export function glob(args) {
  const input = args.map((path2) => interpretPath(path2))
  return fg(input, { cwd: interpretPath() })
}
export { cd, fs, fg }
