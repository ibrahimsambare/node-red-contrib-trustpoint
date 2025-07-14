const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointCreateCsr(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                if (!msg.keystore || !msg.keystore.deviceId || !msg.keystore.privateKey || !msg.keystore.publicKey) {
                    node.error("Missing keystore information (deviceId, privateKey, or publicKey)", msg);
                    return;
                }

                const deviceId = msg.keystore.deviceId;
                const privateKeyPem = msg.keystore.privateKey;
                const publicKeyPem = msg.keystore.publicKey;

                const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
                const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

                const csr = forge.pki.createCertificationRequest();
                csr.publicKey = publicKey;
                csr.setSubject([{ name: 'commonName', value: deviceId }]);
                csr.sign(privateKey);

                const csrPem = forge.pki.certificationRequestToPem(csr);
                const csrDer = forge.asn1.toDer(forge.pki.certificationRequestToAsn1(csr)).getBytes();

                msg.payload = {
                    csrPem: csrPem,
                    csrDer: Buffer.from(csrDer, 'binary')
                };

                node.send(msg);
            } catch (err) {
                node.error("CSR creation failed: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-create-csr", TrustpointCreateCsr);
};
