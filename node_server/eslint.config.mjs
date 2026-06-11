// Flat ESLint config (ESM, hence the .mjs extension since this package is CJS).
// Lints the server (src, test) and the shared protocol.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  // Keep prettier last so formatting rules don't fight the formatter.
  prettier,
);
