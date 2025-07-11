const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointAnalyzeCertNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", function (msg) {
            try {
                if (typeof msg.payload !== 'string' || !msg.payload.includes("-----BEGIN CERTIFICATE-----")) {
                    node.warn("Payload does not contain a valid PEM certificate.");
                    return;
                }

                const cert = forge.pki.certificateFromPem(msg.payload);

                msg.certMetadata = {
                    subjectCN: cert.subject.getField('CN')?.value || "N/A",
                    issuerCN: cert.issuer.getField('CN')?.value || "N/A",
                    validFrom: cert.validity.notBefore,
                    validTo: cert.validity.notAfter
                };

                const deviceId = msg.deviceId?.replace(/[^a-zA-Z0-9_-]/g, '') || 'unknown-device';
                msg.filePath = path.join('/home/pi/.node-red/certs', `${deviceId}-cert.pem`);

                node.log(`✅ Extracted metadata for ${deviceId}`);
                node.send(msg);
            } catch (err) {
                node.error(`❌ Failed to analyze certificate: ${err.message}`, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-analyze-cert", TrustpointAnalyzeCertNode);
};
