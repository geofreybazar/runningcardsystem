import { Bell, CalendarRange, ChartColumn, Flame, Siren, UserPlus } from "lucide-react";
import Panel from "@/components/common/Panel.jsx";

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
    <Panel title='What it does' flush>
      <ul className='grid sm:grid-cols-2 xl:grid-cols-3'>
        {FEATURES.map((f) => (
          <li key={f.title} className='flex items-start gap-3 border-b px-4 py-3 sm:border-r'>
            <f.icon className='mt-0.5 size-5 shrink-0 text-primary' aria-hidden='true' />
            <div>
              <h3 className='text-sm font-semibold'>{f.title}</h3>
              <p className='text-sm text-muted-foreground'>{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default FeatureGrid;
