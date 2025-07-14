module.exports = function (RED) {
    function TrustpointBuildEnrollPayload(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                // ✅ Vérifier que le CSR en DER est présent
                const csrDer = msg.payload?.csrDer;
                if (!csrDer || !Buffer.isBuffer(csrDer)) {
                    node.error("Missing or invalid CSR DER in msg.payload.csrDer", msg);
                    return;
                }

                // ✅ Vérifier que les identifiants EST sont présents
                const estUsername = msg.keystore?.estUsername;
                const estPassword = msg.keystore?.estPassword;

                if (!estUsername || !estPassword) {
                    node.error("Missing EST credentials (estUsername or estPassword) in msg.keystore", msg);
                    return;
                }

                // ✅ Préparation des headers pour la requête HTTP
                msg.headers = {
                    "Content-Type": "application/pkcs10",
                    "Authorization": "Basic " + Buffer.from(`${estUsername}:${estPassword}`).toString("base64")
                };

                // ✅ On transmet uniquement le CSR DER brut dans msg.payload
                msg.payload = csrDer;

                node.send(msg);
            } catch (err) {
                node.error("Failed to build EST enrollment payload: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-build-enroll-payload", TrustpointBuildEnrollPayload);
};
