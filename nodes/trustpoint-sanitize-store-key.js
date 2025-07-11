const path = require("path");

module.exports = function (RED) {
    function TrustpointSanitizeStoreKeyNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", function (msg) {
            try {
                if (!msg.deviceId || !msg.payload || !msg.payload.privateKey) {
                    node.error("Missing required fields: deviceId or privateKey", msg);
                    return;
                }

                // Sanitize device ID to prevent path traversal or unsafe chars
                const safeDeviceId = msg.deviceId.replace(/[^a-zA-Z0-9_-]/g, "");
                msg.filePath = `/home/pi/.node-red/keys/${safeDeviceId}-key.pem`;

                // Preserve private key object for later use
                msg.privateKeyObject = msg.payload.privateKey;

                // Set payload to PEM string
                msg.payload = msg.payload.privateKey.toString();

                node.send(msg);
            } catch (err) {
                node.error("❌ Failed to sanitize/store key: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-sanitize-store-key", TrustpointSanitizeStoreKeyNode);
};
