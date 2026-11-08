import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
