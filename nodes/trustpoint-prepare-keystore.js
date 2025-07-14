const path = require('path');

module.exports = function (RED) {
    function TrustpointPrepareKeyStore(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                if (!msg.deviceId || !msg.privateKey) {
                    node.error("Missing deviceId or privateKey in msg", msg);
                    return;
                }

                const sanitizedId = msg.deviceId.replace(/[^a-zA-Z0-9_-]/g, '');
                const keyPath = `/home/pi/.node-red/keys/${sanitizedId}-key.pem`;

                // Ajoute les infos nécessaires dans msg.keystore
                msg.filePath = keyPath;
                msg.keystore = {
                    deviceId: sanitizedId,
                    privateKey: msg.privateKey
                };

                node.send(msg);
            } catch (err) {
                node.error(`❌ Failed to prepare keystore: ${err.message}`, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-prepare-keystore", TrustpointPrepareKeyStore);
};
