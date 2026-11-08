import useGetSettings from "@/hooks/settings/useGetSettings.js";

/** Position of an alarm level name in the settings (for its colour), or null while loading. */
function useAlarmIndex() {
  const { data } = useGetSettings({ meta: { silent: true } }); // badges just stay neutral if this fails
  return (name) => {
    const i = data?.alarmLevels.indexOf(name) ?? -1;
    return i < 0 ? null : i;
  };
}

export default useAlarmIndex;
