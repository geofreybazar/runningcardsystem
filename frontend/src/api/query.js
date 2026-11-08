import { QueryCache, QueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./client.js";

export const queryClient = new QueryClient({
  // A failed load shows its message once, after the retry; pages only handle the loading and empty states.
  queryCache: new QueryCache({ onError: (e, query) => !query.meta?.silent && toast.error(e.message) }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Only network and server errors are worth one more try; a 4xx answer won't change.
      retry: (count, e) => count < 1 && !(e.status >= 400 && e.status < 500),
    },
  },
});

/** Districts with their cities; changes only with a re-seed. */
export const useDistricts = () => useQuery({ queryKey: ["districts"], queryFn: () => api("/districts"), staleTime: Infinity });

/** Running card rules (alarm levels etc.). */
export const useSettings = (options) => useQuery({ queryKey: ["settings"], queryFn: () => api("/settings"), ...options });
