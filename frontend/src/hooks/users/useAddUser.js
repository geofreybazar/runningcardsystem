import { useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "@/service/user.service.js";

/** mutateAsync(body) → { user, temporaryPassword }. Errors are shown in the form. */
const useAddUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.addUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export default useAddUser;
