const forge = require('node-forge');

module.exports = function(RED) {
    function TrustpointCreateCsr(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function(msg) {
            try {
                const { deviceId, privateKey, publicKey } = msg.keystore;

                if (!deviceId || !privateKey || !publicKey) {
                    node.error("Missing deviceId, privateKey or publicKey in msg.keystore", msg);
                    return;
                }

                const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
                const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);

                const csr = forge.pki.createCertificationRequest();
                csr.publicKey = publicKeyObj;
                csr.setSubject([
                    { name: 'commonName', value: deviceId }
                ]);
                csr.sign(privateKeyObj);

                // ✅ Le node d'enrollment attend directement un PEM string
                msg.payload = forge.pki.certificationRequestToPem(csr);

                node.send(msg);
            } catch (err) {
                node.error("CSR creation failed: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-create-csr", TrustpointCreateCsr);
};
