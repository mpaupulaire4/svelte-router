const { existsSync } = require('fs')
const { resolve } = require('path')

const configFilename = 'svelte.config.js'

module.exports = function getSvelteConfig(preprocess) {
  let configFile = ''

  if (typeof preprocess === 'boolean') {
    configFile = resolve(configFilename)
  } else if (typeof preprocess === 'string') {
    configFile = resolve(preprocess)
  }

  if (!existsSync(configFile)) {
    throw Error(`Could not find ${configFilename}`)
  }

  return configFile
}
