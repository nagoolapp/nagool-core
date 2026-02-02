(() => {
  // read config from script tag
  const scriptEl = document.currentScript;
  const API_ORIGIN = scriptEl?.getAttribute("data-nagool-api") || window.location.origin;

  const SESSION_ENDPOINT = API_ORIGIN + "/v1/widget/session";
  const BOOTSTRAP_ENDPOINT = API_ORIGIN + "/v1/widget/bootstrap";
  const START_SESSION_ENDPOINT = API_ORIGIN + "/v1/session/start";

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
    link.href = API_ORIGIN + "/widget.css?v=4";
    document.head.appendChild(link);
  }

  function setTheme(uiConfig) {
    if (!uiConfig) return;
    const root = byId("Nagool_root");
    if (!root) return;

    root.style.setProperty("--nagool-primary", uiConfig.primaryColor || "#fc0a7a");
    root.style.setProperty("--nagool-bg", uiConfig.bgColor || "#0b0b0b");
    root.style.setProperty("--nagool-text", uiConfig.textColor || "#ffffff");
    root.style.setProperty("--nagool-radius", String(uiConfig.borderRadius || 16) + "px");

    const title = byId("Nagool_title");
    if (title && uiConfig.brandName) title.textContent = uiConfig.brandName;

    const logo = byId("Nagool_logo");
    if (logo && uiConfig.logoUrl) {
      logo.src = uiConfig.logoUrl;
      logo.style.display = "inline-block";
    }
  }

  function lsKey(widgetKey) { return "nagool_user_" + widgetKey; }
  function loadUser(widgetKey) {
    try { return JSON.parse(localStorage.getItem(lsKey(widgetKey)) || "null"); } catch { return null; }
  }
  function saveUser(widgetKey, obj) {
    try { localStorage.setItem(lsKey(widgetKey), JSON.stringify(obj)); } catch {}
  }

  async function fetchBootstrap(widgetKey) {
    const r = await fetch(BOOTSTRAP_ENDPOINT + "?widgetKey=" + encodeURIComponent(widgetKey));
    if (!r.ok) throw new Error("bootstrap_error: " + (await r.text()));
    return await r.json();
  }

  async function startAppSession(payload) {
    const r = await fetch(START_SESSION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("start_session_error: " + (await r.text()));
    return await r.json();
  }

  function isRtlLang(code) {
    const rtl = new Set(["ar", "ar-OM", "fa", "ur"]);
    return rtl.has(String(code || "").trim());
  }

  function createUI() {
    if (byId("Nagool_root")) return null;
    ensureCss();

    const widgetKey = scriptEl?.getAttribute("data-nagool-key") || "pub_demo";

    const root = document.createElement("div");
    root.id = "Nagool_root";
    root.setAttribute("dir", "ltr");

    const panel = document.createElement("div");
    panel.className = "Nagool_panel";

    const header = document.createElement("div");
    header.className = "Nagool_header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "Nagool_headerLeft";

    const logo = document.createElement("img");
    logo.id = "Nagool_logo";
    logo.alt = "Logo";
    logo.style.width = "28px";
    logo.style.height = "28px";
    logo.style.borderRadius = "8px";
    logo.style.objectFit = "cover";
    logo.style.display = "none";

    const title = document.createElement("div");
    title.id = "Nagool_title";
    title.textContent = "Nagool";

    headerLeft.appendChild(logo);
    headerLeft.appendChild(title);

    const close = document.createElement("button");
    close.textContent = "✕";
    close.ariaLabel = "Close";

    header.appendChild(headerLeft);
    header.appendChild(close);

    const body = document.createElement("div");
    body.className = "Nagool_body";
    body.innerHTML = `
      <div><strong>Voice AI</strong></div>
      <div class="Nagool_subtext">Fill the form → Start → allow microphone → talk.</div>
      <div class="Nagool_badge" id="Nagool_status">loading...</div>

      <div id="Nagool_formWrap" style="margin-top:12px;">
        <div class="Nagool_subtext" style="margin-top:10px;">Name</div>
        <input id="Nagool_name" placeholder="Your name"/>

        <div class="Nagool_subtext" style="margin-top:10px;">Country code</div>
        <select id="Nagool_cc">
          <option value="+968">+968 (Oman)</option>
          <option value="+971">+971 (UAE)</option>
          <option value="+966">+966 (Saudi)</option>
          <option value="+965">+965 (Kuwait)</option>
          <option value="+974">+974 (Qatar)</option>
          <option value="+973">+973 (Bahrain)</option>
          <option value="+98">+98 (Iran)</option>
          <option value="+91">+91 (India)</option>
          <option value="+92">+92 (Pakistan)</option>
          <option value="+63">+63 (Philippines)</option>
          <option value="+66">+66 (Thailand)</option>
          <option value="+86">+86 (China)</option>
          <option value="+7">+7 (Russia)</option>
          <option value="+44">+44 (UK)</option>
          <option value="+1">+1 (US/CA)</option>
        </select>

        <div class="Nagool_subtext" style="margin-top:10px;">Mobile number</div>
        <input id="Nagool_phone" placeholder="e.g. 99999999" inputmode="tel"/>

        <div class="Nagool_subtext" style="margin-top:10px;">Language</div>
        <select id="Nagool_lang"></select>

        <button id="Nagool_startBtn">Start Chat</button>

        <div class="Nagool_subtext" style="margin-top:10px;opacity:.95;" id="Nagool_formHint"></div>
      </div>

      <div class="Nagool_subtext" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <button id="Nagool_disconnectBtn" style="display:none;">Disconnect</button>
      </div>

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

    return { widgetKey };
  }

  // ---- Realtime WebRTC ----
  let pc = null;
  let localStream = null;

  async function createSession(tenantId) {
    const r = await fetch(SESSION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKey: tenantId })
    });
    if (!r.ok) throw new Error("session_error: " + (await r.text()));
    return await r.json();
  }

  async function connect(tenantId) {
    setStatus("creating session...");
    const sess = await createSession(tenantId);

    const model = sess?.model || "gpt-realtime";
    const clientSecret = sess?.clientSecret;
    if (!clientSecret) throw new Error("missing clientSecret from /v1/widget/session");

    setStatus("getting mic...");
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    setStatus("webrtc...");
    pc = new RTCPeerConnection();
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

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

    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

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

  const ui = createUI();
  if (!ui) return;

  let resolvedTenantId = null;

  // boot + hydrate
  (async () => {
    try {
      const bs = await fetchBootstrap(ui.widgetKey);
      resolvedTenantId = bs.tenantId;

      setTheme(bs.uiConfig);
      setStatus("idle");

      const langSel = byId("Nagool_lang");
      if (langSel && Array.isArray(bs.languages)) {
        langSel.innerHTML = bs.languages
          .map(l => `<option value="${String(l.code)}">${String(l.label)}</option>`)
          .join("");
        if (bs.defaults?.language) langSel.value = bs.defaults.language;
      }

      const prev = loadUser(ui.widgetKey);
      if (prev) {
        const name = byId("Nagool_name");
        const cc = byId("Nagool_cc");
        const phone = byId("Nagool_phone");
        const lang = byId("Nagool_lang");
        if (name) name.value = prev.name || "";
        if (cc) cc.value = prev.countryCode || "+968";
        if (phone) phone.value = prev.phone || "";
        if (lang) lang.value = prev.language || (bs.defaults?.language || "en");

        const root = byId("Nagool_root");
        if (root) root.setAttribute("dir", isRtlLang(lang?.value) ? "rtl" : "ltr");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      const hint = byId("Nagool_formHint");
      if (hint) hint.textContent = "Failed to load config.";
    }
  })();

  setTimeout(() => {
    const startBtn = byId("Nagool_startBtn");
    const disconnectBtn = byId("Nagool_disconnectBtn");
    const formHint = byId("Nagool_formHint");

    if (!startBtn || !disconnectBtn) return;

    startBtn.addEventListener("click", async () => {
      startBtn.disabled = true;
      if (formHint) formHint.textContent = "";

      try {
        const name = (byId("Nagool_name")?.value || "").trim();
        const countryCode = byId("Nagool_cc")?.value || "+968";
        const phone = (byId("Nagool_phone")?.value || "").trim();
        const language = byId("Nagool_lang")?.value || "en";

        if (!name) throw new Error("Please enter your name.");
        if (!phone) throw new Error("Please enter your mobile number.");
        if (!resolvedTenantId) throw new Error("Tenant is not resolved yet. Refresh page.");

        saveUser(ui.widgetKey, { name, countryCode, phone, language });

        const root = byId("Nagool_root");
        if (root) root.setAttribute("dir", isRtlLang(language) ? "rtl" : "ltr");

        setStatus("starting...");
        const ss = await startAppSession({
          tenantId: resolvedTenantId,
          name,
          countryCode,
          phone,
          language,
        });

        const hint = byId("Nagool_hint");
        if (hint && ss?.greeting) hint.textContent = ss.greeting;

        setStatus("connecting...");
        await connect(resolvedTenantId);

        disconnectBtn.style.display = "inline-block";
      } catch (e) {
        console.error(e);
        setStatus("idle");
        if (formHint) formHint.textContent = String(e?.message || e);
        startBtn.disabled = false;
      }
    });

    disconnectBtn.addEventListener("click", async () => {
      disconnectBtn.disabled = true;
      await disconnect();
      disconnectBtn.style.display = "none";
      startBtn.disabled = false;
      disconnectBtn.disabled = false;
    });
  }, 0);
})();
