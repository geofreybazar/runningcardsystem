import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import userService from "@/service/user.service.js";

/** mutateAsync({ id, ...body }). Errors are shown in the form. */
const useEditUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.editUser,
    onSuccess: () => {
      toast.success("User updated");
      return queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export default useEditUser;
