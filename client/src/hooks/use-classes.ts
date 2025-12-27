import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useClasses() {
  return useQuery({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path);
      if (!res.ok) throw new Error("Failed to fetch classes");
      return await res.json();
    },
  });
}
