import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Page from "@/components/Page.jsx";
import SimpleSelect from "@/components/SimpleSelect.jsx";
import { BarList, ChartCard, Columns, HeatGrid, StatTile } from "@/components/charts/Charts.jsx";
import IncidentDotsMap from "@/components/charts/IncidentDotsMap.jsx";
import { api, download } from "@/api/client.js";
import { useDistricts } from "@/api/query.js";
import { districtName } from "@/auth/permissions.js";
import { WEEKDAYS, bucketLabel, formatMinutes, presetRange } from "@/lib/stats.js";

const PRESETS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "year", label: "This year" },
];

function Section({ title, children }) {
  return (
    <section className='grid gap-3'>
      <h2 className='text-base font-semibold'>{title}</h2>
      {children}
    </section>
  );
}

/** Incident statistics for the viewer's area (the server applies the same visibility as the Incidents page). */
function StatisticsPage() {
  const [params, setParams] = useSearchParams(); // filters live in the URL, so a link reproduces the view
  const defaults = presetRange("30d");
  const from = params.get("from") ?? defaults.from;
  const to = params.get("to") ?? defaults.to;
  const districtId = params.get("districtId") ?? "";
  const cityId = params.get("cityId") ?? "";
  const query = new URLSearchParams({ from, to, ...(districtId && { districtId }), ...(cityId && { cityId }) }).toString();

  const { data: districts = [] } = useDistricts();
  // The previous filter's charts stay (dimmed) while the new ones load.
  const { data: stats, isPlaceholderData: loading } = useQuery({
    queryKey: ["statistics", query],
    queryFn: () => api(`/statistics?${query}`),
    placeholderData: keepPreviousData,
  });
  const [downloading, setDownloading] = useState(false);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    setParams(next, { replace: true });
  };
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.value);
    return r.from === from && r.to === to;
  })?.value;
  const district = districts.find((d) => String(d.id) === districtId);

  const csv = async () => {
    setDownloading(true);
    try {
      await download(`/statistics/incidents.csv?${query}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Page title='Statistics' description='Incidents in your area: trends, response times, station workload, and when and where fires happen.'>
      {/* One filter row above everything. */}
      <div className='flex flex-wrap items-end gap-3'>
        <Tabs value={activePreset ?? ""} onValueChange={(p) => set(presetRange(p))}>
          <TabsList>
            {PRESETS.map((p) => (
              <TabsTrigger key={p.value} value={p.value}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label className='grid gap-1 text-xs text-muted-foreground'>
          From
          <Input type='date' className='h-9 w-40 bg-card' value={from} max={to} onChange={(e) => e.target.value && set({ from: e.target.value })} />
        </label>
        <label className='grid gap-1 text-xs text-muted-foreground'>
          To
          <Input type='date' className='h-9 w-40 bg-card' value={to} min={from} onChange={(e) => e.target.value && set({ to: e.target.value })} />
        </label>
        <SimpleSelect
          className='h-9 w-56 bg-card'
          aria-label='District'
          value={districtId}
          onChange={(v) => set({ districtId: v === "all" ? "" : String(v), cityId: "" })}
          options={[{ value: "all", label: "All districts" }, ...districts.map((d) => ({ value: String(d.id), label: districtName(d) }))]}
          placeholder='All districts'
        />
        {district && district.cities.length > 1 && (
          <SimpleSelect
            className='h-9 w-44 bg-card'
            aria-label='City'
            value={cityId}
            onChange={(v) => set({ cityId: v === "all" ? "" : String(v) })}
            options={[{ value: "all", label: "All cities" }, ...district.cities.map((c) => ({ value: String(c.id), label: c.name }))]}
            placeholder='All cities'
          />
        )}
        <Button variant='outline' className='h-9 sm:ml-auto' onClick={csv} disabled={downloading}>
          {downloading ? <LoaderCircle className='animate-spin' /> : <Download />} Download CSV
        </Button>
      </div>

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

function Stats({ stats: s }) {
  const none = s.summary.incidents === 0 ? "No incidents in this period. Try a longer date range." : null;
  const trend = useMemo(() => s.trend.map((b) => ({ label: bucketLabel(b.bucket, s.range.bucket), value: b.count })), [s]);
  const cities = s.byCity.map((c) => ({ label: c.name, value: c.count }));
  const alarms = s.byAlarm.map((a) => ({ label: a.level, value: a.count }));
  const timeBuckets = s.duration.histogram.map((b) => ({ label: b.label, value: b.count }));
  const durationByCity = s.duration.byCity.map((c) => ({ label: c.name, value: c.minutes, display: formatMinutes(c.minutes) }));
  const toAlarm = s.duration.toAlarm.map((a) => ({ label: a.level, value: a.minutes, display: formatMinutes(a.minutes) }));
  const stations = s.workload.stations.map((st) => ({ label: `${st.name}${st.city ? `, ${st.city}` : ""}`, value: st.count }));
  const trucks = s.workload.trucks.map((t) => ({ label: `${t.callSign} (${t.station})`, value: t.count, display: `${t.count} (${t.hours} h)` }));
  const barangays = s.when.barangays.map((b) => ({ label: b.name, value: b.count }));
  const busiest = s.when.grid.flatMap((row, d) => row.map((v, h) => ({ v, d, h }))).sort((a, b) => b.v - a.v)[0];
  const rowsOf = (items, valueLabel = "Incidents") => ({
    columns: [
      { key: "label", label: "" },
      { key: "display", label: valueLabel, align: "right" },
    ],
    rows: items.map((i) => ({ label: i.label, display: i.display ?? i.value })),
  });

  return (
    <>
      <Section title='Incident trends'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <StatTile label='Incidents' value={s.summary.incidents} hint={`${s.range.from} to ${s.range.to}`} />
          <StatTile label='Open now' value={s.summary.open} hint={`${s.summary.closed} closed`} />
          <StatTile label='Trucks sent' value={s.summary.unitsSent} hint={`${s.summary.mutualAidUnits} to another city`} />
          <StatTile label='Typical duration' value={formatMinutes(s.summary.medianDurationMin)} hint={`90% within ${formatMinutes(s.summary.p90DurationMin)}`} />
        </div>
        <ChartCard title={s.range.bucket === "week" ? "Incidents per week" : "Incidents per day"} table={rowsOf(trend)} empty={none}>
          <Columns items={trend} />
        </ChartCard>
        <div className='grid gap-3 lg:grid-cols-2'>
          <ChartCard title='By city' table={rowsOf(cities)} empty={none}>
            <BarList items={cities} />
          </ChartCard>
          <ChartCard title='Highest alarm reached' note='Each incident counted once, at its highest level' table={rowsOf(alarms)} empty={none}>
            <BarList items={alarms} />
          </ChartCard>
        </div>
      </Section>

      <Section title='Response and duration'>
        <div className='grid gap-3 lg:grid-cols-3'>
          <ChartCard title='How long incidents last' note='Closed incidents, dispatch to close' table={rowsOf(timeBuckets)} empty={s.summary.closed ? null : "No closed incidents in this period."}>
            <BarList items={timeBuckets} />
          </ChartCard>
          <ChartCard title='Typical duration by city' note='Median, closed incidents' table={rowsOf(durationByCity, "Median")} empty={durationByCity.length ? null : "No closed incidents in this period."}>
            <BarList items={durationByCity} />
          </ChartCard>
          <ChartCard title='Time to raise each alarm' note='Median time from dispatch to the first truck of that level' table={rowsOf(toAlarm, "Median")} empty={toAlarm.length ? null : "No alarms were raised in this period."}>
            <BarList items={toAlarm} />
          </ChartCard>
        </div>
      </Section>

      <Section title='Station and truck workload'>
        <div className='grid gap-3 lg:grid-cols-2'>
          <ChartCard title='Busiest stations' note='Trucks dispatched, top 10' table={rowsOf(stations, "Dispatches")} empty={none}>
            <BarList items={stations} />
          </ChartCard>
          <ChartCard title='Busiest trucks' note='Dispatches and hours responding, top 10' table={rowsOf(trucks, "Dispatches (hours)")} empty={none}>
            <BarList items={trucks} />
          </ChartCard>
        </div>
        <ChartCard
          title='Mutual aid between cities'
          note='Trucks a city sent to fires in other cities, and trucks it received'
          empty={s.workload.mutualAid.length ? null : "No trucks crossed city lines in this period."}
        >
          <MutualAid rows={s.workload.mutualAid} />
        </ChartCard>
      </Section>

      <Section title='When and where'>
        <ChartCard
          title='Busiest times'
          note={busiest?.v ? `Busiest hour: ${WEEKDAYS[busiest.d]} ${String(busiest.h).padStart(2, "0")}:00 (${busiest.v})` : undefined}
          table={{
            columns: [{ key: "day", label: "" }, ...Array.from({ length: 24 }, (_, h) => ({ key: h, label: String(h).padStart(2, "0"), align: "right" }))],
            rows: s.when.grid.map((row, d) => ({ day: WEEKDAYS[d], ...row })),
          }}
          empty={none}
        >
          <HeatGrid grid={s.when.grid} />
        </ChartCard>
        <div className='grid gap-3 lg:grid-cols-2'>
          <ChartCard title='Top barangays' table={rowsOf(barangays)} empty={barangays.length ? null : "No incidents with a barangay in this period."}>
            <BarList items={barangays} />
          </ChartCard>
          <ChartCard
            title='Fire locations'
            note={s.pointsTruncated ? `Showing the first ${s.points.length} incidents` : "Darker where fires cluster"}
            empty={none}
          >
            <IncidentDotsMap points={s.points} />
          </ChartCard>
        </div>
      </Section>
    </>
  );
}

function MutualAid({ rows }) {
  return (
    <div className='max-h-80 overflow-auto'>
      <table className='w-full text-sm'>
        <thead className='text-xs text-muted-foreground'>
          <tr>
            <th className='py-1 text-left font-medium'>City</th>
            <th className='py-1 text-right font-medium'>Sent out</th>
            <th className='py-1 text-right font-medium'>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className='border-t'>
              <td className='py-1.5'>{r.name}</td>
              <td className='py-1.5 text-right font-condensed tabular-nums'>{r.sent}</td>
              <td className='py-1.5 text-right font-condensed tabular-nums'>{r.received}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StatisticsPage;
