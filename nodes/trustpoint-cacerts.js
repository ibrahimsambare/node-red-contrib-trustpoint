const https = require("https");

module.exports = function (RED) {
  function TrustpointCACertsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg, send, done) {
      const estUrl = msg.estHost || "https://127.0.0.1/.well-known/est/cacerts";

      const options = {
        method: "GET",
        rejectUnauthorized: false,
      };

      https.get(estUrl, options, (res) => {
        let chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          const base64 = raw.toString("base64");
          const pem = [
            "-----BEGIN CERTIFICATE-----",
            base64.match(/.{1,64}/g).join("\n"),
            "-----END CERTIFICATE-----"
          ].join("\n");

          msg.payload.certificate = pem;
          send(msg);
          if (done) done();
        });
      }).on("error", (err) => {
        node.error("Failed to fetch CA certs: " + err.message, msg);
        if (done) done(err);
      });
    });
  }

  RED.nodes.registerType("trustpoint-cacerts", TrustpointCACertsNode);
};
