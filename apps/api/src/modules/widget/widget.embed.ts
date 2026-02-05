import type { FastifyInstance } from "fastify";

export async function widgetEmbedRoutes(app: FastifyInstance) {
  // This serves a tiny embed script: /widget/embed.js
  app.get("/widget/embed.js", async (_req, reply) => {
    const js = `
(function () {
  // Prevent double init
  if (window.__NAGOOL_WIDGET_LOADED__) return;
  window.__NAGOOL_WIDGET_LOADED__ = true;

  var ORIGIN = window.location.origin;

  // Create iframe
  var iframe = document.createElement("iframe");
  iframe.src = ORIGIN + "/test-widget";
  iframe.id = "nagool-widget-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "16px";
  iframe.style.bottom = "80px";
  iframe.style.width = "360px";
  iframe.style.height = "520px";
  iframe.style.border = "0";
  iframe.style.borderRadius = "16px";
  iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
  iframe.style.display = "none";
  iframe.style.zIndex = "999999";

  // Create button
  var btn = document.createElement("button");
  btn.id = "nagool-widget-btn";
  btn.innerText = "🎤";
  btn.style.position = "fixed";
  btn.style.right = "16px";
  btn.style.bottom = "16px";
  btn.style.width = "56px";
  btn.style.height = "56px";
  btn.style.border = "0";
  btn.style.borderRadius = "999px";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "22px";
  btn.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  btn.style.background = "#111";
  btn.style.color = "#fff";
  btn.style.zIndex = "1000000";

  btn.addEventListener("click", function () {
    iframe.style.display = (iframe.style.display === "none") ? "block" : "none";
  });

  document.body.appendChild(iframe);
  document.body.appendChild(btn);
})();`;

    reply
      .header("content-type", "application/javascript; charset=utf-8")
      .send(js);
  });
}
