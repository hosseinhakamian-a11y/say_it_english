import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useContent() {
  return useQuery({
    queryKey: [api.content.list.path],
    queryFn: async () => {
      const res = await fetch(api.content.list.path);
      if (!res.ok) throw new Error("Failed to fetch content");
      return await res.json();
    },
  });
}
