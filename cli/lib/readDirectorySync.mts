import fs from 'fs'
import { join } from 'path'

const readDirectorySync = (directory: string, allFiles: string[]) => {
  const files = fs.readdirSync(directory).map((file) => join(directory, file))
  allFiles.push(...files)
  files.forEach((file) => {
    fs.statSync(file).isDirectory() && readDirectorySync(file, allFiles)
  })
  return allFiles
}

export default readDirectorySync
