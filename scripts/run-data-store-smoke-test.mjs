import { build } from 'esbuild'

const result = await build({
  entryPoints: ['scripts/data-store-smoke-test.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'silent',
})

const source = result.outputFiles[0].text
const encoded = Buffer.from(source).toString('base64')

await import(`data:text/javascript;base64,${encoded}`)
