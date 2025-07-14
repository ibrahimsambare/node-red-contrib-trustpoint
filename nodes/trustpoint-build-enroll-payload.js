module.exports = function (RED) {
    function TrustpointBuildEnrollPayload(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                // Vérifications
                if (!msg.payload || !msg.payload.csrDer) {
                    node.error("Missing CSR DER in msg.payload.csrDer", msg);
                    return;
                }

                if (!msg.keystore || !msg.keystore.estUsername || !msg.keystore.estPassword) {
                    node.error("Missing EST credentials (estUsername or estPassword) in msg.keystore", msg);
                    return;
                }

                // Construction de la requête HTTP
                msg.headers = {
                    "Content-Type": "application/pkcs10",
                    "Authorization": "Basic " + Buffer.from(
                        `${msg.keystore.estUsername}:${msg.keystore.estPassword}`
                    ).toString("base64")
                };

                msg.payload = msg.payload.csrDer; // le corps de la requête est le DER binaire

                node.send(msg);
            } catch (err) {
                node.error("Failed to build EST enrollment payload: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-build-enroll-payload", TrustpointBuildEnrollPayload);
};
