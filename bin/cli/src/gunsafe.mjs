#! /usr/bin/env node
'use strict'
import fs from 'fs'
import '../../index.mjs'
import Gun from 'gun'
import SEA from 'gun/sea.js'
import Carets from 'carets'
import '../../lib/chain-methods/chainlocker.mjs'
const gun = Gun()
gun.locker()
let params = {
  caret: 'locker > ',
  docCaret: 'locker $ > ',
}
let carets = new Carets(params)
carets.prompt('locker name > ')
let authedUser
carets.on('line', (data) => {
  let line = data.split(' ')
  if (!gun.locker.keys && !authedUser) {
    auth(line)
    setTimeout(() => {
      carets.prompt(params.caret)
    })
  }
  if (line[0] === 'keypair') keypair(line)
  if (line[0] === 'peers') peers(line)
  if (line[0] === 'pair') pair(line)
  if (line[0] === 'put') put(line)
  if (line[0] === 'get') get(line)
  if (line[0] === 'list') list(line)
  if (line[0] === 'delete') del(line)
})
let yes = ['Y', 'y', 'yes', 'Yes', 'true', 'True', '1']
let no = ['N', 'n', 'no', 'No', 'false', 'False', '0']
async function auth(line) {
  if (line === '\r') return console.log('The locker name may not be empty.')
  authedUser = line.join(' ')
  console.log('Keypair for the locker named,', authedUser + ', created.')
  let key
  try {
    key = fs.readFileSync('./key', (err) => {}).toString()
    gun.locker.name(key, authedUser)
  } catch {
    let pair2 = await SEA.pair()
    fs.writeFile('./key', pair2.epriv, (err) => {})
    gun.locker.name(pair2.epriv, authedUser)
  }
}
function keypair() {
  let key = gun.locker.key()
  console.log(key)
}
function peers(line) {
  let peers2
  if (line && line[1]) {
    line.shift()
    gun.locker.peers(line)
  } else {
    peers2 = gun.locker.peers()
    console.log(peers2)
  }
}
async function pair(line) {
  if (line[1]) {
    gun.locker.pair(line[1])
  } else {
    let pair2 = await gun.locker.pair()
    console.log('\r\nYour pairing key', pair2)
    carets.prompt(params.caret)
  }
}
function list(line) {
  let gone = false
  if (line.includes('--deleted')) gone = true
  gun.locker.list(gone, (data) => {
    carets.prompt('')
    console.log(data)
    carets.prompt(params.caret)
  })
}
function put(line) {
  let dataIndex = line.indexOf('--data')
  let data = line.splice(dataIndex, line.length)
  data.shift()
  line.slice(dataIndex, line.length)
  line.slice(dataIndex)
  line.shift()
  let name = line
  name = name.join(' ')
  data = data.join(' ')
  gun.locker.put(name, data, (cb) => {
    console.log(cb)
  })
  setTimeout(() => carets.prompt(params.caret))
}
function putDoc(name, data) {
  gun.locker.put(name, data)
}
carets.on('docmode', (bool) => {
  if (bool) {
    setTimeout(() => carets.prompt(''))
  }
})
function get(name) {
  name.shift()
  let run
  let global = true
  if (name.includes('--run')) {
    run = true
    name = name.filter((v) => v !== '--run')
  }
  if (name.includes('--global')) {
    global = true
    name = name.filter((v) => v !== '--global')
  }
  name = name.join(' ')
  gun.locker.get(name, run, global, (data) => {
    carets.prompt('')
    console.log(data)
    carets.prompt(params.caret)
  })
}
function del(line) {
  if (line.length > 1) {
    line.shift()
    line = line.join(' ')
    gun.locker.delete(line)
  } else {
    setTimeout(() => carets.prompt("This will delete all of this gusafe's data. Continue? > "))
    carets.on('line', (data) => {
      if (yes.includes(data)) {
        gun.locker.delete()
        setTimeout(() => carets.prompt(params.caret))
      }
    })
  }
}
carets.on('doc', (data) => {
  let doc = {}
  let keys = Object.keys(data)
  let docname = data[Math.min(...keys)]
  delete data[keys[0]]
  if (keys.length > 0) {
    doc = data
    putDoc(docname, doc)
  }
  carets.prompt(params.caret)
})
