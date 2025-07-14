module.exports = function (RED) {
    function TrustpointBuildEnrollPayload(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function (msg) {
            if (!msg.payload || !msg.payload.csrDer || !msg.estUsername || !msg.estPassword || !msg.deviceId) {
                node.error("Missing fields: estUsername, estPassword, deviceId or csrDer in msg", msg);
                return;
            }

            const csrDer = Buffer.isBuffer(msg.payload.csrDer)
                ? msg.payload.csrDer
                : Buffer.from(msg.payload.csrDer, 'binary');

            msg.payload = {
                csr: csrDer.toString("base64"),
                username: msg.estUsername,
                password: msg.estPassword,
                deviceId: msg.deviceId
            };

            node.send(msg);
        });
    }

    RED.nodes.registerType("trustpoint-build-enroll-payload", TrustpointBuildEnrollPayload);
};
