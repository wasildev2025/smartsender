const { generateKeyPairSync } = require('node:crypto');

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('--- PUBLIC KEY ---');
console.log(publicKey);
console.log('--- PRIVATE KEY ---');
console.log(privateKey);
