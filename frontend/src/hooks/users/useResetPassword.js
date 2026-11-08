import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import userService from "@/service/user.service.js";

/** mutateAsync(user) → { temporaryPassword } */
const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user) => userService.resetPassword(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: (e) => toast.error(e.message),
  });
};

export default useResetPassword;
