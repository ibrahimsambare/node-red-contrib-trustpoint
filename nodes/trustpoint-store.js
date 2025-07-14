const fs = require('fs');

module.exports = function(RED) {
    function TrustpointStore(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function(msg) {
            try {
                if (!msg.payload || !msg.payload.deviceId || !msg.payload.privateKey || !msg.payload.publicKey) {
                    node.error("Missing or invalid payload: deviceId, privateKey, or publicKey", msg);
                    return;
                }

                const { deviceId, privateKey, publicKey } = msg.payload;

                const folderPath = `${RED.settings.userDir}/keys`;
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }

                const privKeyPath = `${folderPath}/${deviceId}-key.pem`;
                const pubKeyPath = `${folderPath}/${deviceId}-pub.pem`;

                fs.writeFileSync(privKeyPath, privateKey);
                fs.writeFileSync(pubKeyPath, publicKey);

                msg.keystore = {
                    deviceId,
                    privateKey,
                    publicKey,
                    privateKeyPath: privKeyPath,
                    publicKeyPath: pubKeyPath
                };

                msg.payload = { status: "stored", path: privKeyPath };
                node.send(msg);
            } catch (err) {
                node.error("Storage failed: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-store", TrustpointStore);
};
