const forge = require('node-forge');

module.exports = function (RED) {
    function TrustpointCreateCsrNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                const privateKeyPem = msg.payload.privateKey || config.privateKey;
                if (!privateKeyPem) {
                    return node.error("No private key provided in msg.payload.privateKey");
                }

                const subject = msg.payload.subject || {
                    CN: config.cn || 'example.com',
                    O: config.o || '',
                    OU: config.ou || ''
                };

                const sanArray = msg.payload.san
                    || (config.san?.split(',').map(s => s.trim()).filter(Boolean))
                    || [];

                const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

                const csr = forge.pki.createCertificationRequest();
                csr.publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e); // for RSA

                csr.setSubject([
                    { name: 'commonName', value: subject.CN },
                    ...(subject.O ? [{ name: 'organizationName', value: subject.O }] : []),
                    ...(subject.OU ? [{ name: 'organizationalUnitName', value: subject.OU }] : [])
                ]);

                if (sanArray.length > 0) {
                    csr.setAttributes([{
                        name: 'extensionRequest',
                        extensions: [{
                            name: 'subjectAltName',
                            altNames: sanArray.map(value => ({
                                type: /^[0-9.]+$/.test(value) ? 7 : 2, // IP=7, DNS=2
                                value
                            }))
                        }]
                    }]);
                }

                csr.sign(privateKey);

                // Générer PEM
                const pem = forge.pki.certificationRequestToPem(csr);

                // Générer DER (Buffer)
                const der = forge.asn1.toDer(forge.pki.certificationRequestToAsn1(csr)).getBytes();
                const derBuffer = Buffer.from(der, 'binary');

                // On renvoie les 2 formats + info complète
                msg.payload.csr = pem;
                msg.payload.csrPem = pem;
                msg.payload.csrDer = derBuffer;
                msg.payload.algorithm = "RSA"; // pour log éventuel
                msg.payload.privateKey = privateKeyPem; // utile pour la suite (optionnel)

                node.send(msg);

            } catch (err) {
                node.error("CSR generation failed: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-create-csr", TrustpointCreateCsrNode);
};
