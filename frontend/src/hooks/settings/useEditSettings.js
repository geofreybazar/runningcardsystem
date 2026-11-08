import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import settingsService from "@/service/settings.service.js";

/** mutateAsync(body) → saved settings. Errors are shown in the form. */
const useEditSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsService.editSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(["settings"], saved); // alarm badge colours follow too
      toast.success("Saved. New running cards use these rules.");
    },
  });
};

export default useEditSettings;
