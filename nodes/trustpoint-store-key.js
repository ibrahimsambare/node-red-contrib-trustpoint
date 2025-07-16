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

                // Détermination du dossier de base
                let baseDir = config.filePath?.trim();

                if (!baseDir) {
                    // fallback vers le répertoire Node-RED de l'utilisateur
                    baseDir = path.join(RED.settings.userDir || process.cwd(), "keys");
                }

                // Création du dossier s’il n’existe pas
                if (!fs.existsSync(baseDir)) {
                    fs.mkdirSync(baseDir, { recursive: true });
                }

                const filePath = path.join(baseDir, `${deviceId}-key.pem`);
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
