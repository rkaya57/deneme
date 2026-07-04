const loadModule = new Function('u', 'return im' + 'port(u)');
globalThis.loadModule = loadModule;
globalThis.THREE = await loadModule('three');
await loadModule('/game-core.js');
