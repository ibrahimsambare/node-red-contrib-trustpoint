module.exports = function(RED) {
    function TrustpointPrepCsr(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            if (!msg.deviceId || !msg.privateKey) {
                node.error("Missing deviceId or privateKey in msg", msg);
                return;
            }

            node.log(`[Prep CSR] Device: ${msg.deviceId}`);
            node.log(`[Prep CSR] privateKey size: ${msg.privateKey.length} chars`);

            msg.keystore = {
                deviceId: msg.deviceId,
                privateKey: msg.privateKey
            };

            node.send(msg);
        });
    }
    RED.nodes.registerType("trustpoint-prep-csr", TrustpointPrepCsr);
}
