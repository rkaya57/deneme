import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

globalThis.THREE = THREE;
globalThis.GLTFLoader = GLTFLoader;
globalThis.loadModule = (url) => import(url);

await import('/game-core.js');
