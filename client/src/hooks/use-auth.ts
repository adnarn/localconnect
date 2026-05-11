import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { createApiUrl } from "@/lib/api";
import type { User } from "@/lib/validation";

async function fetchUser(): Promise<User | null> {
  const token = localStorage.getItem("authToken");
  console.log("Token from localStorage:", token); // Debug

  if (!token) {
    console.log("No token found in localStorage"); // Debug
    return null;
  }

  const response = await fetch(createApiUrl("/api/auth/user"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Auth response status:", response.status); // Debug

  if (response.status === 401) {
    console.log("401 Unauthorized response"); // Debug
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem("authToken");
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
