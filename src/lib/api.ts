export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3420";

/**
 * Safe JSON parse that handles non-JSON responses
 */
export async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // If it's not JSON, return an error object with the text
    return {
      success: false,
      error: text || `HTTP ${response.status}: ${response.statusText}`,
    };
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const url = `${BACKEND_URL}${path}`;
    console.log(`[API-FETCH] Requesting: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      const data = await response
        .clone()
        .text()
        .then((text) => {
          try {
            return JSON.parse(text);
          } catch {
            return {};
          }
        });
      if (data.error === "Token expired" && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("token-expired"));
      }
    }

    // Handle rate limiting
    if (response.status === 429) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return response;
  } catch (error: any) {
    // Network error - return a mock response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Network error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Helper to safely get JSON from a response
 */
export async function getJsonSafely(response: Response) {
  return safeJsonParse(response);
}
