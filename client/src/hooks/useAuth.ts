import { useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  studentId?: string;
}

export function useAuth() {
  const { data: user, isLoading, refetch, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    refetch,
  };
}
