const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }) {
  const email = String((await request.json().catch(() => ({})))?.email || "")
    .trim()
    .toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const apiKey = env.FIREBASE_WEB_API_KEY;
  const continueUrl = env.PASSWORD_RESET_CONTINUE_URL;
  if (!apiKey || !continueUrl) {
    console.error("FIREBASE_WEB_API_KEY or PASSWORD_RESET_CONTINUE_URL is not configured.");
    return Response.json({ message: "Password reset is not configured." }, { status: 500 });
  }

  try {
    const firebaseResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
        continueUrl,
      }),
    });

    const result = await firebaseResponse.json().catch(() => ({}));

    // Do not reveal whether an account exists.
    if (result?.error?.message === "EMAIL_NOT_FOUND") {
      return Response.json({ sent: true });
    }

    if (!firebaseResponse.ok) {
      console.error("Firebase password reset request failed:", result);
      return Response.json({ message: "Unable to send the password reset email." }, { status: 500 });
    }

    return Response.json({ sent: true });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return Response.json({ message: "Unable to send the password reset email." }, { status: 500 });
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
}
