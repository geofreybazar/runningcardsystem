import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import userService from "@/service/user.service.js";
import { displayName } from "@/utils/person.js";

/** mutate(user) */
const useRemoveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user) => userService.removeUser(user.id),
    onSuccess: (_, user) => {
      toast.success(`${displayName(user)} removed`);
      return queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useRemoveUser;
