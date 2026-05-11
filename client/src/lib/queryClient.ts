import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createApiUrl } from "./api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error("Server response:", text);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = createApiUrl(url);
  const headers: HeadersInit = data
    ? { "Content-Type": "application/json" }
    : {};

  // Include JWT token for authenticated endpoints
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = (options: { on401: UnauthorizedBehavior }) => {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }: any) => {
    const fullUrl = createApiUrl(
      Array.isArray(queryKey) ? queryKey.join("/") : queryKey,
    );

    // For admin endpoints and authenticated endpoints, include JWT token
    const isAdminEndpoint = fullUrl.includes("/admin/");
    const isAuthEndpoint =
      fullUrl.includes("/mine") || fullUrl.includes("/auth/");
    const headers: HeadersInit = {};

    if (isAdminEndpoint || isAuthEndpoint) {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes instead of Infinity
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors, retry 2 times on 5xx errors
        if (error instanceof Error && error.message.includes("4")) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});
