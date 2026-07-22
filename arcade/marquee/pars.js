/* THE HOUSE LIGHTS — the authored key/par map.
 *
 * NOT derived from slug convention. Each `key` was read FIRST-HAND from the
 * cabinet's own source (its localStorage.getItem/setItem) this cycle, and each
 * `par` is a HAND-CHOSEN house bar for a "competent few-session" player of that
 * specific game — not a first-death score, not a world record.
 *
 * Two families of key live here:
 *   • 10 legacy `<compact>_high`  (asteroids_high … chomp_high) — note the two
 *     slug≠key traps: missile-command -> missilecmd_high, lunar-lander ->
 *     lunarlander_high; and 2048 -> 2048_high (cumulative SCORE, not besttile).
 *   • 12 shared `ws:best:<slug>`  (swarm … tiltyard).
 *   • pong keeps NO numeric best — it is the keystone (par: null), the 23rd
 *     bulb that ignites only when the other 22 have crossed par.
 *
 * `metric` names what the stored value MEANS, because it differs per cabinet
 * (gyre/tessera/qubit persist a LEVEL, swarm/centipede a WAVE, the rest a
 * SCORE). It only changes how the readout is phrased — every metric is
 * higher-is-better, so `best >= par` lights the bulb uniformly.
 *
 * This layer is READ-ONLY on every ws:best:* / *_high key (the hidden Mastery
 * trophies stay undisturbed); its own state lives only under ws:marquee:*.
 */
window.MARQUEE_PARS = [
  { slug: 'asteroids',      file: 'asteroids.html',      key: 'asteroids_high',       name: 'Asteroids',       mono: 'AST',  accent: '#37f7e0', par: 6000,  metric: 'score' },
  { slug: 'breakout',       file: 'breakout.html',       key: 'breakout_high',        name: 'Breakout',        mono: 'BRK',  accent: '#ff3ea5', par: 1500,  metric: 'score' },
  { slug: 'snake',          file: 'snake.html',          key: 'snake_high',           name: 'Snake',           mono: 'SNK',  accent: '#39ff9e', par: 400,   metric: 'score' },
  { slug: 'starfighter',    file: 'starfighter.html',    key: 'starfighter_high',     name: 'Starfighter',     mono: 'STR',  accent: '#ff2e88', par: 20000, metric: 'score' },
  { slug: 'tetris',         file: 'tetris.html',         key: 'tetris_high',          name: 'Tetris',          mono: 'TET',  accent: '#37d6ff', par: 10000, metric: 'score' },
  { slug: '2048',           file: '2048.html',           key: '2048_high',            name: '2048',            mono: '2048', accent: '#ffb13d', par: 12000, metric: 'score' },
  { slug: 'missile-command', file: 'missile-command.html', key: 'missilecmd_high',    name: 'Missile Command', mono: 'MSL',  accent: '#ff6a3d', par: 5000,  metric: 'score' },
  { slug: 'pong',           file: 'pong.html',           key: null,                   name: 'Pong',            mono: 'PNG',  accent: '#c6ff4d', par: null,  metric: 'keystone' },
  { slug: 'lunar-lander',   file: 'lunar-lander.html',   key: 'lunarlander_high',     name: 'Lunar Lander',    mono: 'LND',  accent: '#8fbaff', par: 2500,  metric: 'score' },
  { slug: 'crossing',       file: 'crossing.html',       key: 'crossing_high',        name: 'Crossing',        mono: 'XNG',  accent: '#39ff14', par: 2000,  metric: 'score' },
  { slug: 'chomp',          file: 'chomp.html',          key: 'chomp_high',           name: 'Chomp',           mono: 'CHP',  accent: '#ffd23d', par: 4000,  metric: 'score' },
  { slug: 'swarm',          file: 'swarm.html',          key: 'ws:best:swarm',        name: 'Swarm',           mono: 'SWM',  accent: '#b06bff', par: 8,     metric: 'wave' },
  { slug: 'gyre',           file: 'gyre.html',           key: 'ws:best:gyre',         name: 'Gyre',            mono: 'GYR',  accent: '#37f7e0', par: 5,     metric: 'level' },
  { slug: 'tessera',        file: 'tessera.html',        key: 'ws:best:tessera',      name: 'Tessera',         mono: 'TSA',  accent: '#ff2e88', par: 5,     metric: 'level' },
  { slug: 'centipede',      file: 'centipede.html',      key: 'ws:best:centipede',    name: 'Centipede',       mono: 'CEN',  accent: '#39ff9e', par: 6,     metric: 'wave' },
  { slug: 'qubit',          file: 'qubit.html',          key: 'ws:best:qubit',        name: 'Qubit',           mono: 'QBT',  accent: '#ffd23d', par: 4,     metric: 'level' },
  { slug: 'vanguard',       file: 'vanguard.html',       key: 'ws:best:vanguard',     name: 'Vanguard',        mono: 'VNG',  accent: '#37d6ff', par: 24000, metric: 'score' },
  { slug: 'digdug',         file: 'digdug.html',         key: 'ws:best:digdug',       name: 'Dig Dug',         mono: 'DIG',  accent: '#ffa83d', par: 20000, metric: 'score' },
  { slug: 'bulwark',        file: 'bulwark.html',        key: 'ws:best:bulwark',      name: 'Bulwark',         mono: 'BLW',  accent: '#5fe6c4', par: 6000,  metric: 'score' },
  { slug: 'lode-runner',    file: 'lode-runner.html',    key: 'ws:best:lode-runner',  name: 'Lode Runner',     mono: 'LOD',  accent: '#ffd24d', par: 4000,  metric: 'score' },
  { slug: 'the-climb',      file: 'the-climb.html',      key: 'ws:best:the-climb',    name: 'The Climb',       mono: 'CLB',  accent: '#ff7a3d', par: 4000,  metric: 'score' },
  { slug: 'the-last-line',  file: 'the-last-line.html',  key: 'ws:best:the-last-line', name: 'The Last Line',  mono: 'LST',  accent: '#5fff8a', par: 3000,  metric: 'score' },
  { slug: 'tiltyard',       file: 'tiltyard.html',       key: 'ws:best:tiltyard',     name: 'Tiltyard',        mono: 'TLT',  accent: '#7c5cff', par: 1200,  metric: 'score' }
];
