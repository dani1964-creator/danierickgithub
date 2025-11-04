const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

function makeProxy(port, hostHeader) {
  const app = express();

  app.use('/', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    ws: true,
    onProxyReq(proxyReq, req, res) {
      // For requests proxied to Vite, override Host to emulate subdomain
      proxyReq.setHeader('host', hostHeader);
    }
  }));

  return app.listen(port, () => console.log(`${hostHeader} proxy: http://localhost:${port}`));
}

// Start two proxies for testing
makeProxy(8081, 'danierick.adminimobiliaria.site');
makeProxy(8082, 'teste.adminimobiliaria.site');

console.log('Dev proxy started: ports 8081 (danierick ) and 8082 (teste) -> forwarding to localhost:3000');
