import { useMutation, useQueryClient } from "@tanstack/react-query";
import districtService from "@/service/district.service.js";

/** First use of a barangay: save its geocoded pin so the next lookup is instant. Best effort, so failures stay silent. */
const useSaveBarangayPin = (cityId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: districtService.saveBarangayPin,
    onSuccess: (saved) => queryClient.setQueryData(["barangays", cityId], (list) => list?.map((b) => (b.id === saved.id ? saved : b))),
  });
};

export default useSaveBarangayPin;
