/* Test-only shim: load the browser pars.js (which assigns window.MARQUEE_PARS)
 * as a CommonJS module so the Node twin can read the SAME authored table the
 * page uses — no second copy to drift. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'pars.js'), 'utf8');
const win = {};
new Function('window', src)(win);
module.exports = win.MARQUEE_PARS;
