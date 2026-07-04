import * as THREE from 'three';

globalThis.THREE = THREE;
globalThis.loadModule = (url) => import(url);

await import('/game-core.js');
