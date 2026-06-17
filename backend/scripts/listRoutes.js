 import { createApp } from '../src/app.js';

const app = createApp();
const routes = [];

const walk = (stack, prefix = '') => {
  stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .map((x) => x.toUpperCase())
        .join(',');
      routes.push(methods.padEnd(12) + prefix + layer.route.path);
    } else if (layer.name === 'router' && layer.handle.stack) {
      const re = layer.regexp.toString();
      // crude extraction: pull first slash-prefixed token
      const m = re.match(/\/\\?\/?([a-z0-9\-_]+)/i);
      const seg = m ? '/' + m[1] : '';
      walk(layer.handle.stack, prefix + seg);
    }
  });
};

walk(app._router.stack);
console.log('=== Registered routes ===');
console.log(routes.sort().join('\n'));
process.exit(0);
