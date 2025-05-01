const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to the backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4574',
      changeOrigin: true,
    })
  );

  // Add a catch-all handler to serve index.html for any route not handled
  app.use('*', (req, res, next) => {
    if (req.method === 'GET' && !req.url.startsWith('/api')) {
      console.log(`Redirecting ${req.url} to index.html for client-side routing`);
      req.url = '/';
    }
    next();
  });
};
