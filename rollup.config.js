import typescript from 'rollup-plugin-typescript2'
import serve from 'rollup-plugin-serve'
import { terser } from 'rollup-plugin-terser'

const isDev = process.argv.includes('-w')

export default {
  input: './src/index.ts',
  output: [
    {
      file: './dist/main.js',
      format: 'iife',
    }
  ],

  plugins: [
    typescript({ inlineSourceMap: true }),
    isDev && serve(),
    !isDev && terser(),
  ],
}
