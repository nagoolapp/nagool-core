(() => {
  const API_ORIGIN = window.location.origin; // same origin as /test-widget when served by API
  const SESSION_ENDPOINT = API_ORIGIN + "/v1/widget/session";

  // UI helpers
  function byId(id) { return document.getElementById(id); }
  function setStatus(text) {
    const el = byId("Nagool_status");
    if (el) el.textContent = text;
  }

  function ensureCss() {
    const cssId = "Nagool_widget_css";
    if (document.getElementById(cssId)) return;
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href = API_ORIGIN + "/widget.css?v=1";
    document.head.appendChild(link);
  }

  function createUI() {
    if (byId("Nagool_root")) return null;
    ensureCss();

    const script = document.currentScript;
    const publicKey = script?.getAttribute("data-nagool-key") || "pub_test";

    const root = document.createElement("div");
    root.id = "Nagool_root";

    const panel = document.createElement("div");
    panel.className = "Nagool_panel";

    const header = document.createElement("div");
    header.className = "Nagool_header";

    const title = document.createElement("div");
    title.textContent = "Nagool";

    const close = document.createElement("button");
    close.textContent = "✕";
    close.ariaLabel = "Close";

    header.appendChild(title);
    header.appendChild(close);

    const body = document.createElement("div");
    body.className = "Nagool_body";
    body.innerHTML = `
      <div><strong>Voice AI</strong></div>
      <div class="Nagool_subtext">Connect → allow microphone → talk.</div>
      <div class="Nagool_badge" id="Nagool_status">idle</div>

      <div class="Nagool_subtext" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <button id="Nagool_connectBtn" style="padding:10px 12px;border-radius:10px;border:1px solid #ddd;cursor:pointer;background:#fff;">Connect</button>
        <button id="Nagool_disconnectBtn" style="padding:10px 12px;border-radius:10px;border:1px solid #ddd;cursor:pointer;background:#fff;display:none;">Disconnect</button>
      </div>

      <div class="Nagool_subtext" style="margin-top:10px;">Key: <code>${publicKey}</code></div>
      <div class="Nagool_subtext" style="margin-top:10px;" id="Nagool_hint"></div>
    `;

    panel.appendChild(header);
    panel.appendChild(body);

    const floatBtn = document.createElement("button");
    floatBtn.className = "Nagool_floatBtn";
    floatBtn.textContent = "🎤";
    floatBtn.ariaLabel = "Open Nagool";

    function openPanel(){ panel.classList.add("open"); }
    function closePanel(){ panel.classList.remove("open"); }
    function toggle(){ panel.classList.contains("open") ? closePanel() : openPanel(); }

    floatBtn.addEventListener("click", toggle);
    close.addEventListener("click", closePanel);

    root.appendChild(panel);
    root.appendChild(floatBtn);
    document.body.appendChild(root);

    return { publicKey };
  }

  // ---- Realtime WebRTC ----
  let pc = null;
  let localStream = null;

  async function createSession(publicKey) {
    const r = await fetch(SESSION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKey })
    });
    if (!r.ok) throw new Error("session_error: " + (await r.text()));
    return await r.json();
  }

  async function connect(publicKey) {
    setStatus("creating session...");
    const sess = await createSession(publicKey);

    const model = sess?.model || "gpt-realtime";
    const clientSecret = sess?.clientSecret;
    if (!clientSecret) throw new Error("missing clientSecret from /v1/widget/session");

    setStatus("getting mic...");
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    setStatus("webrtc...");
    pc = new RTCPeerConnection();

    // send local audio
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

    // play remote audio
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      let audio = document.getElementById("Nagool_remote_audio");
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "Nagool_remote_audio";
        audio.autoplay = true;
        audio.playsInline = true;
        document.body.appendChild(audio);
      }
      audio.srcObject = stream;
    };

    // SDP offer
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    // Exchange SDP with OpenAI Realtime
    const sdpResp = await fetch(
      "https://api.openai.com/v1/realtime?model=" + encodeURIComponent(model),
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + clientSecret,
          "Content-Type": "application/sdp"
        },
        body: offer.sdp
      }
    );

    if (!sdpResp.ok) {
      const text = await sdpResp.text().catch(() => "");
      throw new Error("realtime_sdp_error: " + sdpResp.status + " " + text.slice(0, 800));
    }

    const answerSdp = await sdpResp.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    setStatus("connected ✅");
    const hint = byId("Nagool_hint");
    if (hint) hint.textContent = "Say something now…";
  }

  async function disconnect() {
    setStatus("disconnecting...");
    try {
      if (pc) pc.close();
      pc = null;
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    } finally {
      setStatus("idle");
      const hint = byId("Nagool_hint");
      if (hint) hint.textContent = "";
    }
  }

  // init UI
  const ui = createUI();
  if (!ui) return;

  // wire buttons
  setTimeout(() => {
    const connectBtn = byId("Nagool_connectBtn");
    const disconnectBtn = byId("Nagool_disconnectBtn");
    if (!connectBtn || !disconnectBtn) return;

    connectBtn.addEventListener("click", async () => {
      connectBtn.disabled = true;
      try {
        await connect(ui.publicKey);
        connectBtn.style.display = "none";
        disconnectBtn.style.display = "inline-block";
      } catch (e) {
        console.error(e);
        setStatus("error");
        connectBtn.disabled = false;
        alert(String(e?.message || e));
      }
    });

    disconnectBtn.addEventListener("click", async () => {
      disconnectBtn.disabled = true;
      await disconnect();
      disconnectBtn.style.display = "none";
      connectBtn.style.display = "inline-block";
      connectBtn.disabled = false;
      disconnectBtn.disabled = false;
    });
  }, 0);
})();
