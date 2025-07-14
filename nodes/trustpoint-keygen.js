const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

module.exports = function (RED) {
    function TrustpointKeygenNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg, send, done) {
            const algorithm = config.algorithm || msg.algorithm || 'RSA';
            const keySize = parseInt(config.keySize || msg.keySize || '2048', 10);
            const curve = config.ecCurve || msg.ecCurve || 'prime256v1';
            const persist = config.persist === true || msg.persist === true;
            const filenamePrefix = config.filenamePrefix || msg.filenamePrefix || 'keypair';

            try {
                let privateKey, publicKey;
                let privateKeyPem, publicKeyPem;

                if (algorithm === 'RSA') {
                    const keys = forge.pki.rsa.generateKeyPair(keySize);
                    privateKey = keys.privateKey;
                    publicKey = keys.publicKey;
                    privateKeyPem = forge.pki.privateKeyToPem(privateKey);
                    publicKeyPem = forge.pki.publicKeyToPem(publicKey);
                } else if (algorithm === 'EC' || algorithm === 'ECC') {
                    const ec = forge.pki.ec;
                    const keys = ec.generateKeyPair({ namedCurve: curve });
                    privateKey = keys.privateKey;
                    publicKey = keys.publicKey;
                    privateKeyPem = forge.pki.privateKeyToPem(privateKey);
                    publicKeyPem = forge.pki.publicKeyToPem(publicKey);
                } else {
                    return done(new Error(`Unsupported algorithm: ${algorithm}`));
                }

                if (persist) {
                    const dir = path.join(__dirname, '..', 'keys');
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                    fs.writeFileSync(path.join(dir, `${filenamePrefix}_private.pem`), privateKeyPem);
                    fs.writeFileSync(path.join(dir, `${filenamePrefix}_public.pem`), publicKeyPem);
                }

                const rawDeviceId = msg.deviceId || config.deviceId || "default";
                const sanitizedDeviceId = rawDeviceId.replace(/[^a-zA-Z0-9_-]/g, '');
                const filePath = `/home/pi/.node-red/keys/${sanitizedDeviceId}-key.pem`;

                // ➕ Champs transmis pour la suite
                msg.deviceId = sanitizedDeviceId;
                msg.privateKey = privateKeyPem;
                msg.publicKey = publicKeyPem;
                msg.filePath = filePath;
                msg.privateKeyObject = privateKey;

                // Ajout du subject ici directement
                msg.subject = {
                    commonName: sanitizedDeviceId,
                    countryName: 'NE',
                    organizationName: 'Trustpoint'
                };

                // Supprime le payload pour ne pas polluer le create-csr
                delete msg.payload;

                send(msg);
                done();
            } catch (err) {
                done(new Error(`Key generation failed: ${err.message}`));
            }
        });
    }

    RED.nodes.registerType("trustpoint-keygen", TrustpointKeygenNode);
};
