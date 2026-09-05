const target = process.env['services__api__https__0'] || process.env['services__api__http__0'] || 'http://localhost:5205';

module.exports = {
  "/api": {
    "target": target,
    "secure": false,
    "changeOrigin": true
  }
};

