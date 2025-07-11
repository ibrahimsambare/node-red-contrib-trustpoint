const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

module.exports = function (RED) {
    function TrustpointKeygenNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            // Config depuis .html ou msg
            const algorithm = msg.algorithm || config.algorithm || 'RSA';
            const keySize = parseInt(msg.keySize || config.keySize || '2048', 10);
            const ecCurve = msg.ecCurve || config.ecCurve || 'prime256v1';
            const persist = msg.persist !== undefined ? msg.persist : config.persist;
            const filenamePrefix = msg.filenamePrefix || config.filenamePrefix || 'keypair';

            let privateKeyPem, publicKeyPem;

            try {
                // Génération des clés
                if (algorithm === 'RSA') {
                    const keys = forge.pki.rsa.generateKeyPair(keySize);
                    privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
                    publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
                } else if (algorithm === 'EC' || algorithm === 'ECC') {
                    const keypair = forge.pki.ec.generateKeyPair({ namedCurve: ecCurve });
                    privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
                    publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
                } else {
                    return node.error(`❌ Unsupported algorithm: ${algorithm}`);
                }

                // Option de persistance
                if (persist) {
                    const dir = path.join(RED.settings.userDir || '.', 'keys');
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(path.join(dir, `${filenamePrefix}_private.pem`), privateKeyPem);
                    fs.writeFileSync(path.join(dir, `${filenamePrefix}_public.pem`), publicKeyPem);
                }

                // Construction du message de sortie
                msg.payload = {
                    algorithm,
                    privateKey: privateKeyPem,
                    publicKey: publicKeyPem
                };

                node.send(msg);
            } catch (err) {
                node.error(`❌ Key generation failed: ${err.message}`, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-keygen", TrustpointKeygenNode);
};
