const loadModule = new Function('u', 'return im' + 'port(u)');
globalThis.THREE = await loadModule('https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js');
await loadModule('/game-core.js');
