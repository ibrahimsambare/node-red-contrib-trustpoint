const fs = require('fs');
const path = require('path');

module.exports = function(RED) {
    function TrustpointStoreCertificate(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function(msg) {
            try {
                const deviceId = msg.payload.deviceId;
                const certificate = msg.payload.certificate;

                if (!deviceId || !certificate) {
                    node.error("Missing deviceId or certificate in msg.payload", msg);
                    return;
                }

                const filePath = path.join("/home/pi/.node-red/certs", `${deviceId}-cert.pem`);
                fs.writeFileSync(filePath, certificate);

                msg.payload = {
                    status: "stored",
                    path: filePath
                };
                node.send(msg);
            } catch (err) {
                node.error("Certificate storage failed: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-store-certificate", TrustpointStoreCertificate);
};
