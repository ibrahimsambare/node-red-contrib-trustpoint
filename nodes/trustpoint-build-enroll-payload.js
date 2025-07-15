module.exports = function (RED) {
    function TrustpointBuildEnrollPayload(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            try {
                // Check that CSR in DER format is present
                const csrDer = msg.payload?.csrDer;
                if (!csrDer || !Buffer.isBuffer(csrDer)) {
                    node.error("Missing or invalid CSR DER in msg.payload.csrDer", msg);
                    return;
                }

                // Check that EST credentials are provided
                const estUsername = msg.keystore?.estUsername;
                const estPassword = msg.keystore?.estPassword;

                if (!estUsername || !estPassword) {
                    node.error("Missing EST credentials (estUsername or estPassword) in msg.keystore", msg);
                    return;
                }

                // Prepare HTTP headers for the EST request
                msg.headers = {
                    "Content-Type": "application/pkcs10",
                    "Authorization": "Basic " + Buffer.from(`${estUsername}:${estPassword}`).toString("base64")
                };

                // Replace payload with raw CSR DER
                msg.payload = csrDer;

                node.send(msg);
            } catch (err) {
                node.error("Failed to build EST enrollment payload: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-build-enroll-payload", TrustpointBuildEnrollPayload);
};
