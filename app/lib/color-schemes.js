export const COLOR_SCHEMES = {
  blush: {
    name: 'Blush',
    description: 'Soft rose & lavender',
    preview: ['#f3eae6', '#d4adb6', '#c4929a'],
    vars: {
      '--bg-from':        '#f9f5f0',
      '--bg-mid':         '#f3eae6',
      '--bg-to':          '#f0e8ec',
      '--btn-from':       '#c4929a',
      '--btn-to':         '#d4adb6',
      '--accent':         '#b88a92',
      '--accent-light':   '#d4adb6',
      '--glass-shadow':   'rgba(180, 130, 138, 0.08)',
      '--navbar-tint':    'rgba(255, 255, 255, 0.60)',
    },
  },
  sage: {
    name: 'Sage',
    description: 'Mossy green & cream',
    preview: ['#eef5ee', '#7a9e7e', '#5c8a6a'],
    vars: {
      '--bg-from':        '#f5faf5',
      '--bg-mid':         '#eaf3ea',
      '--bg-to':          '#e2f0e8',
      '--btn-from':       '#6b9e72',
      '--btn-to':         '#4d8a6b',
      '--accent':         '#5e8e68',
      '--accent-light':   '#9ec4a0',
      '--glass-shadow':   'rgba(90, 140, 100, 0.08)',
      '--navbar-tint':    'rgba(245, 255, 245, 0.65)',
    },
  },
  dusk: {
    name: 'Dusk',
    description: 'Indigo & gold',
    preview: ['#f0eef8', '#7c6fcd', '#c9a84c'],
    vars: {
      '--bg-from':        '#f5f3fb',
      '--bg-mid':         '#ede9f6',
      '--bg-to':          '#e8e2f5',
      '--btn-from':       '#7c6fcd',
      '--btn-to':         '#c9a84c',
      '--accent':         '#7462be',
      '--accent-light':   '#a99dda',
      '--glass-shadow':   'rgba(100, 80, 180, 0.08)',
      '--navbar-tint':    'rgba(255, 255, 255, 0.62)',
    },
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep teal & sky',
    preview: ['#e8f6f8', '#3b8a96', '#6bc4d4'],
    vars: {
      '--bg-from':        '#f0f9fb',
      '--bg-mid':         '#e4f4f8',
      '--bg-to':          '#d8eef5',
      '--btn-from':       '#3b8a96',
      '--btn-to':         '#5bbace',
      '--accent':         '#2e7d88',
      '--accent-light':   '#7ec8d8',
      '--glass-shadow':   'rgba(45, 120, 140, 0.08)',
      '--navbar-tint':    'rgba(240, 250, 252, 0.65)',
    },
  },
  peach: {
    name: 'Peach',
    description: 'Warm peach & coral',
    preview: ['#fef3ec', '#e8855a', '#f0a878'],
    vars: {
      '--bg-from':        '#fef8f3',
      '--bg-mid':         '#fdeee4',
      '--bg-to':          '#fce4d4',
      '--btn-from':       '#e07545',
      '--btn-to':         '#f0a060',
      '--accent':         '#c86a3a',
      '--accent-light':   '#f0b08a',
      '--glass-shadow':   'rgba(200, 100, 60, 0.08)',
      '--navbar-tint':    'rgba(255, 250, 245, 0.65)',
    },
  },
};

export function applyScheme(key) {
  const scheme = COLOR_SCHEMES[key] ?? COLOR_SCHEMES.blush;
  const root = document.documentElement;
  Object.entries(scheme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function getSavedScheme() {
  if (typeof window === 'undefined') return 'blush';
  return localStorage.getItem('colorScheme') ?? 'blush';
}

export function saveScheme(key) {
  localStorage.setItem('colorScheme', key);
  applyScheme(key);
}
