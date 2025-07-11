module.exports = function (RED) {
    function TrustpointPrepCSRNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", function (msg) {
            try {
                if (!msg.privateKeyObject) {
                    node.error("msg.privateKeyObject is missing.");
                    return;
                }

                msg.payload = {
                    privateKey: msg.privateKeyObject
                };

                node.send(msg);
            } catch (err) {
                node.error("❌ Failed to prepare key for CSR: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("trustpoint-prep-csr", TrustpointPrepCSRNode);
};
