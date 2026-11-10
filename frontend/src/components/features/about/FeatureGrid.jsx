import { Bell, CalendarRange, ChartColumn, Flame, Siren, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  { icon: Flame, title: "Running Card", text: "Nearest stations with an available truck for any location, grouped by alarm level." },
  { icon: Siren, title: "Dispatch & Alarms", text: "Dispatch the 1st Alarm, raise it level by level, and close the incident; trucks are never double-booked." },
  { icon: UserPlus, title: "Special Units", text: "Ladders, rescue and CSSR trucks, and ambulances sent on the fire city's request." },
  { icon: CalendarRange, title: "Special Deployments", text: "Trucks assigned to planned events such as SONA or ASEAN stay off the running card until released." },
  { icon: Bell, title: "Live Notifications", text: "Cities, districts and the Regional office hear the moment their trucks are sent or released." },
  { icon: ChartColumn, title: "Statistics & Audit Log", text: "Trends, response times and workload, with a record of who did what and when." },
];

function FeatureGrid() {
  return (
    <section className='grid gap-3'>
      <h2 className='text-lg font-semibold'>What it does</h2>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {FEATURES.map((f) => (
          <Card key={f.title} className='flex-row items-start gap-3 px-4 py-4'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary'>
              <f.icon className='size-5' />
            </span>
            <div>
              <h3 className='text-sm font-semibold'>{f.title}</h3>
              <p className='text-sm text-muted-foreground'>{f.text}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default FeatureGrid;
