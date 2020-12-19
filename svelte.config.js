const sveltePreprocess = require('svelte-preprocess');
const production = process.env.NODE_ENV === 'production';

module.exports = {
  compilerOptions: {
    // enable run-time checks when not in production
    dev: !production,
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css: false,
    immutable: true,
  },
  preprocess: sveltePreprocess(),
}
