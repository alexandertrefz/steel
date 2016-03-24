#! /bin/bash
node_modules/.bin/rollup src/steel.ts -o dist/steel.amd.js -c -f amd
node_modules/.bin/rollup src/steel.ts -o dist/steel.cjs.js -c -f cjs
node_modules/.bin/rollup src/steel.ts -o dist/steel.umd.js -c -f umd
node_modules/.bin/rollup src/steel.ts -o dist/steel.iife.js -c -f iife