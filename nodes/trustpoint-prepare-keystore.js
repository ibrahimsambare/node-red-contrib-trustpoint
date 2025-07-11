const path = require('path');

module.exports = function (RED) {
    function TrustpointPrepareKeyStore(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                if (!msg.deviceId || !msg.payload || !msg.payload.privateKey) {
                    node.error("Missing deviceId or privateKey in msg", msg);
                    return;
                }

                const device = msg.deviceId.replace(/[^a-zA-Z0-9_-]/g, '');
                msg.filePath = `/home/pi/.node-red/keys/${device}-key.pem`;
                msg.privateKeyObject = msg.payload.privateKey;
                msg.payload = msg.payload.privateKey.toString();

                node.send(msg);
            } catch (err) {
                node.error(`❌ Failed to prepare key store: ${err.message}`, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-prepare-keystore", TrustpointPrepareKeyStore);
};
