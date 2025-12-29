import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // Main build config
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: false,
      },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'AjalaAI',
        sourcemap: false,
        exports: 'named',
        globals: {
          '@anthropic-ai/sdk': 'Anthropic',
          'openai': 'OpenAI',
        },
      },
    ],
    external: [
      '@anthropic-ai/sdk',
      'openai',
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
        browser: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        rootDir: 'src',
        removeComments: true,
      }),
      terser({
        ecma: 2020,
        module: true,
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: true,
          unsafe_math: true,
          unsafe_methods: true,
        },
        mangle: {
          properties: false,
        },
        format: {
          comments: false,
        },
      }),
    ],
    onwarn(warning, warn) {
      if (warning.code === 'THIS_IS_UNDEFINED') return;
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    },
  },
  // Type definitions bundling
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    external: [
      '@anthropic-ai/sdk',
      'openai',
    ],
    plugins: [dts()],
  },
];
