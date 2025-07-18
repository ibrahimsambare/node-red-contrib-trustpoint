const fs = require("fs");
const path = require("path");

module.exports = function (RED) {
  function TrustpointStoreCANode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const certificate = msg.payload?.certificate;
      if (typeof certificate !== "string" || !certificate.includes("BEGIN CERTIFICATE")) {
        return done(new Error("❌ Invalid or missing certificate content in msg.payload.certificate"));
      }

      const filename = msg.filename || "ca-cert.pem";
      const outputPath = path.join("/home/pi/.node-red/certs", filename);

      try {
        fs.writeFileSync(outputPath, certificate, { encoding: "utf8" });
        node.log(`✅ CA certificate saved to: ${outputPath}`);
        msg.payload = {
          status: "success",
          path: outputPath,
        };
        send(msg);
        done();
      } catch (err) {
        node.error("❌ Failed to save CA certificate: " + err.message, msg);
        done(err);
      }
    });
  }

  RED.nodes.registerType("trustpoint-store-ca", TrustpointStoreCANode);
};
