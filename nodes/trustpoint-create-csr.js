const forge = require('node-forge');

module.exports = function(RED) {
    function TrustpointCreateCsr(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            try {
                const deviceId = msg.keystore.deviceId;
                const privateKeyPem = msg.keystore.privateKey;

                if (!deviceId || !privateKeyPem) {
                    node.error("Missing deviceId or privateKey in msg.keystore", msg);
                    return;
                }

                const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

                const csr = forge.pki.createCertificationRequest();
                csr.publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e); // ⚠️ ou passer la vraie publicKey
                csr.setSubject([{
                    name: 'commonName',
                    value: deviceId
                }]);
                csr.sign(privateKey);

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
}
