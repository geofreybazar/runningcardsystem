import { useQueryClient } from "@tanstack/react-query";

/** Reloads one incident (and its next-alarm card) and the incident lists; resolves when the incident is back. */
const useRefreshIncident = () => {
  const queryClient = useQueryClient();
  return async (id) => {
    queryClient.invalidateQueries({ queryKey: ["incidents"] });
    await queryClient.invalidateQueries({ queryKey: ["incident", id] });
  };
};

export default useRefreshIncident;
