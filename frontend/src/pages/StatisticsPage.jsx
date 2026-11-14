import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import Page from "@/components/common/Page.jsx";
import Filters from "@/components/features/statistics/Filters.jsx";
import Stats from "@/components/features/statistics/Stats.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import useGetStatistics from "@/hooks/statistics/useGetStatistics.js";
import useDownloadIncidentsCsv from "@/hooks/statistics/useDownloadIncidentsCsv.js";
import { areaDistricts, presetRange } from "@/utils/stats.js";

/** Statistics of the fires inside the viewer's area; the server applies the same limit, the filters only offer that area. */
function StatisticsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams(); // filters live in the URL, so a link reproduces the view
  const defaults = presetRange("30d");
  const from = params.get("from") ?? defaults.from;
  const to = params.get("to") ?? defaults.to;
  const districtId = params.get("districtId") ?? "";
  const cityId = params.get("cityId") ?? "";
  const query = new URLSearchParams({ from, to, ...(districtId && { districtId }), ...(cityId && { cityId }) }).toString();

  const { data: allDistricts = [] } = useGetDistricts();
  const districts = areaDistricts(allDistricts, user.areaCityIds);
  const { data: stats, isPlaceholderData: loading } = useGetStatistics(query);
  const { mutate: downloadCsv, isPending: downloading } = useDownloadIncidentsCsv();

  const set = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  return (
    <Page title='Statistics' description='Fires in your area: trends, response times, station workload, and when and where fires happen.'>
      <Filters
        from={from}
        to={to}
        districtId={districtId}
        cityId={cityId}
        districts={districts}
        onChange={set}
        onDownload={() => downloadCsv(query)}
        downloading={downloading}
      />

      {!stats ? (
        <div className='grid gap-3 sm:grid-cols-4'>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className={i < 4 ? "h-20" : "h-48 sm:col-span-2"} />
          ))}
        </div>
      ) : (
        <div className={loading ? "pointer-events-none grid gap-8 opacity-60 transition-opacity" : "grid gap-8 transition-opacity"}>
          <Stats stats={stats} />
        </div>
      )}
    </Page>
  );
}

export default StatisticsPage;
