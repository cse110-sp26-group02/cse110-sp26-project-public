import js from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    files: [
      'tests/integration/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    }
  },
  {
    files: ["src/**/*.js"],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": ["warn", {
        require: { FunctionDeclaration: true, MethodDefinition: true, ClassDeclaration: true }
      }],
      "jsdoc/require-param": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/require-returns-description": "warn",
    },
  },
  {
    files: ["*.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'dev/**',
    ]
  },
];
