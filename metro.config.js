const http = require('http');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Required for expo-sqlite on web (wa-sqlite.wasm).
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

/**
 * expo-sqlite web needs SharedArrayBuffer, which requires COOP/COEP on the
 * document. Expo's HTML middleware does not run metro `enhanceMiddleware`, so
 * we stamp the headers onto every ServerResponse in this Node process.
 */
const COEP = 'credentialless';
const COOP = 'same-origin';
if (!http.ServerResponse.prototype.__hkCoopCoepPatched) {
  const originalSetHeader = http.ServerResponse.prototype.setHeader;
  http.ServerResponse.prototype.setHeader = function patchedSetHeader(name, value) {
    return originalSetHeader.call(this, name, value);
  };
  const originalWriteHead = http.ServerResponse.prototype.writeHead;
  http.ServerResponse.prototype.writeHead = function patchedWriteHead(statusCode, ...rest) {
    if (!this.getHeader('Cross-Origin-Embedder-Policy')) {
      this.setHeader('Cross-Origin-Embedder-Policy', COEP);
    }
    if (!this.getHeader('Cross-Origin-Opener-Policy')) {
      this.setHeader('Cross-Origin-Opener-Policy', COOP);
    }
    return originalWriteHead.call(this, statusCode, ...rest);
  };
  http.ServerResponse.prototype.__hkCoopCoepPatched = true;
}

const previousEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhanced = previousEnhanceMiddleware
    ? previousEnhanceMiddleware(middleware, metroServer)
    : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', COEP);
    res.setHeader('Cross-Origin-Opener-Policy', COOP);
    return enhanced(req, res, next);
  };
};

module.exports = config;
