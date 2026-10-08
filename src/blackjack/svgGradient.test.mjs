import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';

test('table gradients preserve their offsets through the installed native SVG extractor without warnings', () => {
  const module = { exports: {} };
  const source = readFileSync(new URL('../../node_modules/react-native-svg/src/lib/extract/extractGradient.ts', import.meta.url), 'utf8');
  const deps = { react: React, 'react-native': { processColor: () => 0xFF123456 }, './extractOpacity': { __esModule: true, default: () => 1 }, './extractTransform': { __esModule: true, default: () => null }, '../units': { __esModule: true, default: {} } };
  new Function('require', 'module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(id => deps[id], module, module.exports);
  const warnings = [];
  const warn = console.warn;
  console.warn = text => warnings.push(text);
  try {
    for (const file of ['TableFinish.tsx', 'BlackjackScreen.tsx', 'BetWell.tsx', 'DealerChipRack.tsx']) {
      const tree = ts.createSourceFile(file, readFileSync(new URL(file, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      let count = 0;
      const visit = node => {
        if (ts.isJsxAttribute(node) && node.name.getText(tree) === 'offset') {
          const value = ts.isStringLiteral(node.initializer) ? node.initializer.text : Number(node.initializer.expression.getText(tree));
          const gradient = module.exports.default({ id: 'probe', children: [React.createElement('Stop', { offset: value, stopColor: '#123456' })] }, null);
          assert.equal(gradient.gradient[0], Number(value), `${file}: offset ${value}`);
          count++;
        }
        ts.forEachChild(node, visit);
      };
      visit(tree);
      assert.ok(count > 0 || file === 'DealerChipRack.tsx');
    }
    assert.deepEqual(warnings, []);
  } finally { console.warn = warn; }
});
