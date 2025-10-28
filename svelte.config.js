import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: false
    })
  },
  onwarn: (warning, handler) => {
    // Suprimir warnings A11y y CSS no críticos
    if (warning.code === 'a11y-label-has-associated-control') return;
    if (warning.code === 'a11y-click-events-have-key-events') return;
    if (warning.code === 'a11y-no-static-element-interactions') return;
    if (warning.code === 'a11y-no-noninteractive-element-interactions') return;
    if (warning.code === 'css-unused-selector') return;
    handler(warning);
  }
};
