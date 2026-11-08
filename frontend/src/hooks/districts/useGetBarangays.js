import { useQuery } from "@tanstack/react-query";
import districtService from "@/service/district.service.js";

const useGetBarangays = (cityId) => useQuery({ queryKey: ["barangays", cityId], queryFn: () => districtService.getBarangays(cityId), enabled: !!cityId });

export default useGetBarangays;
