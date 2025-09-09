const path = require('node:path');

module.exports = {
  root: true,

  // ensure this CJS config parses fine (fixes "const is reserved")
  parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
  env: { node: true },

  ignorePatterns: ['projects/**/*', 'dist/**', 'coverage/**', '.angular/cache/**', '**/*.spec.ts'],

  plugins: [
    'unused-imports',
    'simple-import-sort',
    'jsdoc',
    'prefer-arrow',
    'import',
    '@typescript-eslint',
    'perfectionist',
    'prettier',
  ],

  overrides: [
    // TypeScript
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [path.resolve(__dirname, 'tsconfig.eslint.json')],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      // make sure ESLint loads these plugin objects for TS files
      plugins: ['@typescript-eslint', '@angular-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'warn',
          { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
        ],
        'array-bracket-newline': ['error', { multiline: true, minItems: 2 }],
        'array-element-newline': ['error', { multiline: true, minItems: 2 }],
        'nonblock-statement-body-position': ['error', 'below'],
        curly: ['error', 'all'],
        'brace-style': ['error', '1tbs', { allowSingleLine: false }],
        'no-extra-boolean-cast': 'off',
        indent: ['error', 2, { SwitchCase: 1, VariableDeclarator: 1 }],
        'comma-dangle': ['error', 'never'],
        'no-multi-spaces': ['error'],
        'array-bracket-spacing': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        quotes: ['error', 'double', { avoidEscape: true }],
        'key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],
        'no-useless-escape': 'off',
        'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
        'no-trailing-spaces': 'error',
        'eol-last': ['error', 'always'],
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              ['^@?\\w'],
              ['^@app/', '^@shared/', '^@env/'],
              ['^src/'],
              ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
              ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
              ['^.+\\.s?css$'],
            ],
          },
        ],
        'simple-import-sort/exports': 'error',

        '@angular-eslint/directive-selector': 'off',
        '@angular-eslint/component-selector': 'off',

        '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
        '@typescript-eslint/ban-types': [
          'warn',
          {
            types: {
              Object: { message: 'Avoid using the `Object` type. Did you mean `object`?' },
              Function: {
                message:
                  'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.',
              },
              Boolean: { message: 'Avoid using the `Boolean` type. Did you mean `boolean`?' },
              Number: { message: 'Avoid using the `Number` type. Did you mean `number`?' },
              String: { message: 'Avoid using the `String` type. Did you mean `string`?' },
              Symbol: { message: 'Avoid using the `Symbol` type. Did you mean `symbol`?' },
            },
          },
        ],
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          {
            accessibility: 'explicit',
            overrides: {
              constructors: 'no-public',
              methods: 'explicit',
              properties: 'explicit',
              accessors: 'explicit',
              parameterProperties: 'explicit',
            },
          },
        ],
        'perfectionist/sort-classes': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            fallbackSort: { type: 'unsorted' },
            ignoreCase: true,
            specialCharacters: 'keep',
            partitionByComment: false,
            partitionByNewLine: false,
            newlinesBetween: 1,
            ignoreCallbackDependenciesPatterns: [],
            groups: [
              'index-signature',
              ['private-static-property', 'private-static-accessor-property'],
              ['private-static-get-method', 'private-static-set-method'],
              ['protected-static-property', 'protected-static-accessor-property'],
              ['protected-static-get-method', 'protected-static-set-method'],
              ['static-property', 'static-accessor-property'],
              ['static-get-method', 'static-set-method'],
              'static-block',
              ['private-property', 'private-accessor-property'],
              'private-methods-get',
              'private-methods-set',
              ['private-get-method', 'private-set-method'],
              ['protected-property', 'protected-accessor-property'],
              'protected-methods-get',
              'protected-methods-set',
              ['protected-get-method', 'protected-set-method'],
              'angular-queries',
              'angular-host-bindings',
              'angular-inputs',
              'angular-outputs',
              'angular-host-listeners',
              ['property', 'accessor-property'],
              'public-methods-get',
              'public-methods-set',
              ['get-method', 'set-method'],
              'angular-signals',
              ['constructor'],
              'constructor_override',
              ['static-method', 'static-function-property'],
              'angular-lifecycle',
              ['method', 'function-property'],
              'public-methods-spaced',
              ['protected-static-method', 'protected-static-function-property'],
              ['protected-method', 'protected-function-property'],
              'protected-methods-spaced',
              ['private-static-method', 'private-static-function-property'],
              'private-methods-spaced',
              'unknown',
            ],
            customGroups: [
              {
                groupName: 'angular-inputs',
                selector: 'property',
                modifiers: ['decorated'],
                decoratorNamePattern: 'Input',
              },
              {
                groupName: 'angular-outputs',
                selector: 'property',
                modifiers: ['decorated'],
                decoratorNamePattern: 'Output',
              },
              {
                groupName: 'angular-queries',
                selector: 'property',
                modifiers: ['decorated'],
                decoratorNamePattern: '(ViewChild|ViewChildren|ContentChild|ContentChildren)',
              },
              {
                groupName: 'angular-host-bindings',
                selector: 'property',
                modifiers: ['decorated'],
                decoratorNamePattern: 'HostBinding',
              },
              {
                groupName: 'angular-host-listeners',
                selector: 'method',
                modifiers: ['decorated'],
                decoratorNamePattern: 'HostListener',
              },
              {
                groupName: 'angular-lifecycle',
                selector: 'method',
                elementNamePattern:
                  '^ng(OnChanges|OnInit|DoCheck|AfterContentInit|AfterContentChecked|AfterViewInit|AfterViewChecked|OnDestroy)$',
                newlinesInside: 1,
              },
              {
                groupName: 'angular-signals',
                selector: 'property',
                elementValuePattern: '(^|\\W)(signal|computed|effect)\\s*\\(',
              },
              {
                groupName: 'private-methods-get',
                selector: 'get-method',
                newlinesInside: 1,
                modifiers: ['private'],
              },
              {
                groupName: 'private-methods-set',
                selector: 'set-method',
                newlinesInside: 1,
                modifiers: ['private'],
              },
              {
                groupName: 'private-methods-spaced',
                selector: 'method',
                newlinesInside: 1,
                modifiers: ['private'],
              },
              {
                groupName: 'protected-methods-get',
                selector: 'get-method',
                newlinesInside: 1,
                modifiers: ['protected'],
              },
              {
                groupName: 'protected-methods-set',
                selector: 'set-method',
                newlinesInside: 1,
                modifiers: ['protected'],
              },
              {
                groupName: 'protected-methods-spaced',
                selector: 'method',
                newlinesInside: 1,
                modifiers: ['protected'],
              },
              { groupName: 'constructor_override', selector: 'constructor', newlinesInside: 1 },
              {
                groupName: 'public-methods-get',
                selector: 'get-method',
                newlinesInside: 1,
                modifiers: ['public'],
              },
              {
                groupName: 'public-methods-set',
                selector: 'set-method',
                newlinesInside: 1,
                modifiers: ['public'],
              },
              {
                groupName: 'public-methods-spaced',
                selector: 'method',
                newlinesInside: 1,
                modifiers: ['public'],
              },
            ],
          },
        ],
        '@typescript-eslint/naming-convention': [
          'warn',
          {
            selector: 'property',
            modifiers: ['private'],
            format: ['camelCase'],
            leadingUnderscore: 'require',
          },
          {
            selector: 'property',
            modifiers: ['private', 'readonly', 'static'],
            format: ['UPPER_CASE'],
          },
          { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
          {
            selector: 'variable',
            modifiers: ['exported'],
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          },
        ],
      },
    },

    // Angular templates
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      plugins: ['prettier'],
      rules: {},
    },
    {
      files: ['*.html'],
      excludedFiles: ['*inline-template-*.component.html'],
      extends: [
        'plugin:@angular-eslint/template/recommended',
        'plugin:@angular-eslint/template/accessibility',
      ],
      plugins: ['prettier'],
      rules: {
        'prettier/prettier': ['warn', { parser: 'angular', endOfLine: 'auto' }],
        '@angular-eslint/template/interactive-supports-focus': 'off',
        '@angular-eslint/template/click-events-have-key-events': 'off',
      },
    },
  ],
};
