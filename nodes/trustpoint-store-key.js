const fs = require('fs');
const path = require('path');

module.exports = function(RED) {
    function TrustpointStoreKey(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function(msg) {
            try {
                const deviceId = msg.payload.deviceId;
                const privateKey = msg.payload.privateKey;

                if (!deviceId || !privateKey) {
                    node.error("Missing deviceId or privateKey in msg.payload", msg);
                    return;
                }

                const filePath = path.join("/home/pi/.node-red/keys", `${deviceId}-key.pem`);
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
