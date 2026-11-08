import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import userService from "@/service/user.service.js";
import { displayName } from "@/utils/person.js";

/** mutate({ user, isActive }) */
const useChangeUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ user, isActive }) => userService.changeUserStatus({ id: user.id, isActive }),
    onSuccess: (_, { user, isActive }) => {
      toast.success(`${displayName(user)} ${isActive ? "enabled" : "disabled"}`);
      return queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useChangeUserStatus;
