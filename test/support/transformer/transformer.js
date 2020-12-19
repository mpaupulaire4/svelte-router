// const log = require('why-is-node-running')
const { basename } = require('path');
const { execSync } = require('child_process');
const svelte = require('svelte/compiler');
const getSvelteConfig = require('./svelteconfig');

const options = {
  preprocess: true
}

function transformer(source, filename) {
  const {
    debug,
    compilerOptions,
    preprocess,
    maxBuffer = 10 * 1024 * 1024
  } = options
  let processed = source

  if (preprocess) {
    const svelteConfigFile = getSvelteConfig(preprocess)
    const preprocessor = require.resolve('./preprocess.js')
    processed = execSync(`yarn node --unhandled-rejections=strict --abort-on-uncaught-exception "${preprocessor}"`, {
      env: { PATH: process.env.PATH, source, filename, svelteConfigFile },
      maxBuffer: maxBuffer
    }).toString()
  }

  const result = svelte.compile(processed, {
    filename: basename(filename),
    css: true,
    accessors: true,
    dev: true,
    format: 'cjs',
    ...compilerOptions
  })

  if (debug) {
    console.log(result.js.code)
  }

  const esInterop = 'Object.defineProperty(exports, "__esModule", { value: true });'

  return {
    code: result.js.code + esInterop,
    map: result.js.map
  }
}

module.exports = {
  process: transformer
}
