module.exports = function (RED) {
    function TrustpointPrepareKeystore(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                const { deviceId, estUsername, estPassword } = msg.payload || {};
                const { privateKeyPem, publicKeyPem } = msg;

                if (!deviceId || !estUsername || !estPassword) {
                    node.error("Missing deviceId, estUsername, or estPassword in msg.payload", msg);
                    return;
                }

                if (!privateKeyPem || !publicKeyPem) {
                    node.error("Missing privateKeyPem or publicKeyPem in msg", msg);
                    return;
                }

                // Prepare keystore structure
                msg.keystore = {
                    deviceId,
                    estUsername,
                    estPassword,
                    privateKey: privateKeyPem,
                    publicKey: publicKeyPem
                };

                node.send(msg);
            } catch (err) {
                node.error("Failed to prepare keystore: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-prepare-keystore", TrustpointPrepareKeystore);
};
