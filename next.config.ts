const withTM = require('next-transpile-modules')(['rc-util']);

module.exports = withTM({
  reactStrictMode: true,
  swcMinify: true,  // Optional: pastikan SWC aktif untuk optimasi build
});
