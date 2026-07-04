const load = new Function('p', 'return im' + 'port(p)');
const lib = await load('three');
console.log(lib);
