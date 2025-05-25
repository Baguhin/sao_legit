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
  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
