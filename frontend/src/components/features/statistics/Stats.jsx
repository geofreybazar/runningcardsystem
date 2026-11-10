import { useMemo } from "react";
import { BarList, ChartCard, Columns, HeatGrid, StatTile } from "@/components/features/statistics/charts/Charts.jsx";
import IncidentDotsMap from "@/components/features/statistics/charts/IncidentDotsMap.jsx";
import { WEEKDAYS, bucketLabel, formatMinutes } from "@/utils/stats.js";
import Section from "./Section.jsx";
import MutualAid from "./MutualAid.jsx";

/** Every statistics section for one filter: trends, response times, workload, when and where. */
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
        {/* One KPI strip: the headline figures side by side, divided rather than boxed. */}
        <div className='grid grid-cols-2 divide-x divide-y overflow-hidden rounded-lg border bg-card lg:grid-cols-4 lg:divide-y-0 [&>*:nth-child(3)]:border-l-0 lg:[&>*:nth-child(3)]:border-l'>
          <StatTile label='Incidents' value={s.summary.incidents} hint={`${s.range.from} to ${s.range.to}`} />
          <StatTile label='Open now' value={s.summary.open} hint={`${s.summary.closed} closed`} />
          <StatTile label='Trucks sent' value={s.summary.unitsSent} hint={`${s.summary.mutualAidUnits} to another city`} />
          <StatTile
            label='Typical duration'
            value={formatMinutes(s.summary.medianDurationMin)}
            hint={`90% within ${formatMinutes(s.summary.p90DurationMin)}`}
          />
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
          <ChartCard
            title='How long incidents last'
            note='Closed incidents, dispatch to close'
            table={rowsOf(timeBuckets)}
            empty={s.summary.closed ? null : "No closed incidents in this period."}
          >
            <BarList items={timeBuckets} />
          </ChartCard>
          <ChartCard
            title='Typical duration by city'
            note='Median, closed incidents'
            table={rowsOf(durationByCity, "Median")}
            empty={durationByCity.length ? null : "No closed incidents in this period."}
          >
            <BarList items={durationByCity} />
          </ChartCard>
          <ChartCard
            title='Time to raise each alarm'
            note='Median time from dispatch to the first truck of that level'
            table={rowsOf(toAlarm, "Median")}
            empty={toAlarm.length ? null : "No alarms were raised in this period."}
          >
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

export default Stats;
