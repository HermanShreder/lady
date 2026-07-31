export async function onRequest(context) {

    const ua = context.request.headers.get("user-agent") || "";

    const TG = "https://t.me/MilaNoirOF";

    if (/Android/i.test(ua)) {

        const intent =
            "intent://t.me/MilaNoirOF#Intent;" +
            "scheme=https;" +
            "package=org.telegram.messenger;" +
            "S.browser_fallback_url=" + encodeURIComponent(TG) +
            ";end";

        return Response.redirect(intent,302);
    }

    return Response.redirect(TG,302);
}
