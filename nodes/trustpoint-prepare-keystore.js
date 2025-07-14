const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointPrepareKeystore(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                const deviceId = msg.deviceId;
                const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

                const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
                const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);

                msg.keystore = {
                    deviceId: deviceId,
                    privateKey: privateKeyPem,
                    publicKey: publicKeyPem
                };

                // ✅ Ajout nécessaire pour permettre au node `trustpoint-store` de fonctionner
                msg.payload = msg.payload || {};
                msg.payload.deviceId = deviceId;

                node.send(msg);
            } catch (err) {
                node.error("Keystore preparation failed: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-prepare-keystore", TrustpointPrepareKeystore);
};
