const svelte = require('svelte/compiler')

const { source, filename, svelteConfigFile } = process.env
const config = require(svelteConfigFile)

svelte
  .preprocess(source, config.preprocess || {}, { filename })
  .then(r => { process.stdout.write(r.code) })
