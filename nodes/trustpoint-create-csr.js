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

                const csrDer = forge.asn1.toDer(forge.pki.certificationRequestToAsn1(csr)).getBytes();
                msg.payload = {
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
