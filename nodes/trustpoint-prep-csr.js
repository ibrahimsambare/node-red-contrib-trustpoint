module.exports = function(RED) {
    function TrustpointPrepCsr(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            if (!msg.deviceId || !msg.privateKey || !msg.publicKey) {
                node.error("Missing deviceId, privateKey or publicKey in msg", msg);
                return;
            }

            node.log(`[Prep CSR] Device: ${msg.deviceId}`);
            node.log(`[Prep CSR] privateKey size: ${msg.privateKey.length} chars`);

            // ✅ Envoie un keystore complet pour la suite
            msg.keystore = {
                deviceId: msg.deviceId,
                privateKey: msg.privateKey,
                publicKey: msg.publicKey
            };

            node.send(msg);
        });
    }
    RED.nodes.registerType("trustpoint-prep-csr", TrustpointPrepCsr);
};
