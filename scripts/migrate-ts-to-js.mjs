import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const projectRoot = process.cwd();
const skipDirs = new Set(['node_modules', '.git', '.next', 'dist', 'out', 'build']);
const sourceExts = new Set(['.ts', '.tsx']);
const rewriteExts = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const converted = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(path.join(dir, entry.name));
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const ext = path.extname(entry.name);

    if (!sourceExts.has(ext)) continue;
    if (entry.name.endsWith('.d.ts')) continue;
    if (entry.name === 'next-env.d.ts') continue;

    const code = fs.readFileSync(fullPath, 'utf8');
    const isTsx = ext === '.tsx';
    const outExt = isTsx ? '.jsx' : '.js';
    const outPath = fullPath.slice(0, -ext.length) + outExt;

    const result = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.Preserve,
        esModuleInterop: true,
      },
      fileName: fullPath,
      reportDiagnostics: false,
    });

    const output = result.outputText
      .replace(/\/\/\# sourceMappingURL=.*$/gm, '')
      .trimEnd() + '\n';

    fs.writeFileSync(outPath, output, 'utf8');
    fs.unlinkSync(fullPath);
    converted.push({ from: fullPath, to: outPath });
  }
}

function rewriteImportExtensions(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = original.replace(/(['"])(\.{1,2}\/[^'"\n]+?)\.(ts|tsx)(['"])/g, (_m, q1, importPath, ext, q2) => {
    const newExt = ext === 'tsx' ? 'jsx' : 'js';
    return `${q1}${importPath}.${newExt}${q2}`;
  });

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

function walkAndRewrite(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walkAndRewrite(path.join(dir, entry.name));
      continue;
    }

    const ext = path.extname(entry.name);
    if (!rewriteExts.has(ext)) continue;
    rewriteImportExtensions(path.join(dir, entry.name));
  }
}

walk(projectRoot);
walkAndRewrite(projectRoot);

console.log(`Converted ${converted.length} files from TypeScript to JavaScript.`);
