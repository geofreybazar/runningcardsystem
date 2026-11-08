import { useQuery } from "@tanstack/react-query";
import settingsService from "@/service/settings.service.js";

/** Running card rules (alarm levels etc.). */
const useGetSettings = (options) => useQuery({ queryKey: ["settings"], queryFn: settingsService.getSettings, ...options });

export default useGetSettings;
