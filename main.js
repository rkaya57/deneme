import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

globalThis.THREE = THREE;
globalThis.GLTFLoader = GLTFLoader;
globalThis.SkeletonUtils = SkeletonUtils;
globalThis.loadModule = (url) => import(url);

await import('/game-core.js');
