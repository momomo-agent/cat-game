// Theme definitions for Cat Game
const THEMES = {
  aquarium: {
    name: '水族馆',
    icon: '🐟',
    emojis: ['🐟', '🐠', '🐡', '🦈', '🐙'],
    bgGradient: ['#0a1628', '#0d3b66', '#1a6fa0'],
    particleColors: ['#00bfff', '#87ceeb', '#4fc3f7', '#81d4fa'],
    movePattern: 'swim',
    captureSound: 'bubble',
    bgType: 'bubbles'
  },
  mouse: {
    name: '老鼠',
    icon: '🐭',
    emojis: ['🐭', '🐁', '🧀'],
    bgGradient: ['#3e2723', '#5d4037', '#795548'],
    particleColors: ['#d7ccc8', '#bcaaa4', '#a1887f', '#ffcc80'],
    movePattern: 'scurry',
    captureSound: 'squeak',
    bgType: 'woodgrain'
  },
  bugs: {
    name: '虫子',
    icon: '🐛',
    emojis: ['🐛', '🐜', '🐞', '🦗', '🪲'],
    bgGradient: ['#1b5e20', '#2e7d32', '#4caf50'],
    particleColors: ['#a5d6a7', '#81c784', '#66bb6a', '#fff59d'],
    movePattern: 'crawl',
    captureSound: 'crunch',
    bgType: 'grass'
  },
  laser: {
    name: '激光点',
    icon: '🔴',
    emojis: ['🔴'],
    bgGradient: ['#0d0d0d', '#1a1a1a', '#262626'],
    particleColors: ['#ff1744', '#ff5252', '#ff8a80', '#ffab40'],
    movePattern: 'laser',
    captureSound: 'zap',
    bgType: 'none'
  },
  butterfly: {
    name: '蝴蝶',
    icon: '🦋',
    emojis: ['🦋', '🌸', '🌺'],
    bgGradient: ['#1a237e', '#4a148c', '#880e4f'],
    particleColors: ['#f8bbd0', '#ce93d8', '#b39ddb', '#fff176'],
    movePattern: 'flutter',
    captureSound: 'chime',
    bgType: 'flowers'
  }
};
