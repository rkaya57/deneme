const THREE = globalThis.THREE;
const ctx = { THREE };
globalThis.gameCtx = ctx;
await globalThis.loadModule('/simple.js');
await globalThis.loadModule('/simple3.js');
