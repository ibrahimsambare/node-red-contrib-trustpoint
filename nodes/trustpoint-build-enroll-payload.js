module.exports = function (RED) {
    function TrustpointBuildEnrollPayloadNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", function (msg) {
            try {
                if (!msg.estBaseUrl || !msg.estUsername || !msg.estPassword || !msg.payload || !msg.payload.csrDer) {
                    node.error("Missing fields: estBaseUrl, estUsername, estPassword or csrDer", msg);
                    return;
                }

                msg.payload = {
                    estBaseUrl: msg.estBaseUrl,
                    username: msg.estUsername,
                    password: msg.estPassword,
                    useBasic: true,
                    csr: Buffer.from(msg.payload.csrDer)
                };

                node.send(msg);
            } catch (err) {
                node.error("❌ Failed to build enrollment payload: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-build-enroll-payload", TrustpointBuildEnrollPayloadNode);
};
