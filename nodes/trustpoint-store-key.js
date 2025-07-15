const fs = require('fs');
const path = require('path');

module.exports = function(RED) {
    function TrustpointStoreKey(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.filePath = config.filePath; // <== récupération depuis config

        node.on('input', function(msg) {
            try {
                const privateKey = msg.payload?.privateKey;
                const filePath = RED.util.evaluateNodeProperty(
                    node.filePath,
                    config.filePath_fieldType || 'str',
                    node,
                    msg
                );

                if (!privateKey || !filePath) {
                    node.error("Missing privateKey or filePath.", msg);
                    return;
                }

                const dir = path.dirname(filePath);
                fs.mkdirSync(dir, { recursive: true });

                fs.writeFileSync(filePath, privateKey);

                msg.payload = {
                    status: "stored",
                    path: filePath
                };
                node.send(msg);
            } catch (err) {
                node.error("Key storage failed: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-store-key", TrustpointStoreKey);
};
