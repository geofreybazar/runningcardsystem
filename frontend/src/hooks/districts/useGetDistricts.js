import { useQuery } from "@tanstack/react-query";
import districtService from "@/service/district.service.js";

/** Districts with their cities; changes only with a re-seed. */
const useGetDistricts = () => useQuery({ queryKey: ["districts"], queryFn: districtService.getDistricts, staleTime: Infinity });

export default useGetDistricts;
