import parseArgs from 'minimist'
import consola from 'consola'

import { loadNuxtConfig } from '../common/utils'

export default async function build() {
  const { Nuxt } = await import('@nuxt/core')
  const { Builder, Generator } = await import('@nuxt/builder')

  const argv = parseArgs(process.argv.slice(2), {
    alias: {
      h: 'help',
      c: 'config-file',
      a: 'analyze',
      s: 'spa',
      u: 'universal',
      q: 'quiet'
    },
    boolean: ['h', 'a', 's', 'u', 'q'],
    string: ['c'],
    default: {
      c: 'nuxt.config.js'
    }
  })

  if (argv.help) {
    process.stderr.write(`
    Description
      Compiles the application for production deployment
    Usage
      $ nuxt build <dir>
    Options
      --analyze, -a        Launch webpack-bundle-analyzer to optimize your bundles.
      --spa, -s            Launch in SPA mode
      --universal, -u      Launch in Universal mode (default)
      --no-generate        Don't generate static version for SPA mode (useful for nuxt start)
      --config-file, -c    Path to Nuxt.js config file (default: nuxt.config.js)
      --quiet, -q          Disable output except for errors
      --help, -h           Displays this message
  `)
    process.exit(0)
  }

  const options = loadNuxtConfig(argv)

  // Create production build when calling `nuxt build`
  options.dev = false

  // Analyze option
  options.build = options.build || {}
  if (argv.analyze && typeof options.build.analyze !== 'object') {
    options.build.analyze = true
  }

  // Silence output when using --quiet
  if (argv.quiet) {
    options.build.quiet = !!argv.quiet
  }

  const nuxt = new Nuxt(options)
  const builder = new Builder(nuxt)

  // Setup hooks
  nuxt.hook('error', err => consola.fatal(err))

  // Close function
  const close = () => {
    // In analyze mode wait for plugin
    // emitting assets and opening browser
    if (options.build.analyze === true || typeof options.build.analyze === 'object') {
      return
    }

    process.exit(0)
  }

  if (options.mode !== 'spa' || argv.generate === false) {
    // Build only
    return builder
      .build()
      .then(close)
      .catch(err => consola.fatal(err))
  } else {
    // Build + Generate for static deployment
    return new Generator(nuxt, builder)
      .generate({ build: true })
      .then(close)
      .catch(err => consola.fatal(err))
  }
}
