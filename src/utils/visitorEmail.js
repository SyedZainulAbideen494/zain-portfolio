import emailjs from "@emailjs/browser";

export async function sendVisitorEmail() {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return;
  }

  if (window.location.pathname.startsWith("/dev")) {
    return;
  }

  try {
    const ipData = await fetch("https://api.ipify.org?format=json").then(r =>
      r.json()
    );

    await emailjs.send(
      "service_pek4tcv",
      "template_bfaicga",
      {
        time: new Date().toLocaleString(),
        page: window.location.href,
        ip: ipData.ip,
        browser: navigator.userAgent,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer || "Direct",
        platform: navigator.platform,
      },
      "oiGY-u7t8BC8uN_Zf"
    );

    console.log("Visitor email sent");
  } catch (err) {
    console.error("Email failed:", err);
  }
}