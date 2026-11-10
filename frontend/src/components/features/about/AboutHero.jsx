import { Card } from "@/components/ui/card";
import { ABOUT } from "@/constants/about.js";

/** Logo, name and what the system is for. */
function AboutHero() {
  return (
    <Card className='gap-4 overflow-hidden px-5 py-6 md:px-8'>
      <img src='/logo.webp' alt='Bureau of Fire Protection, Bagong Pilipinas and BFP NCR emblems' width={375} height={110} className='h-auto w-40 dark:rounded-md dark:bg-white dark:p-1.5' />
      <div>
        <h2 className='font-condensed text-3xl font-semibold tracking-wide md:text-4xl'>{ABOUT.system}</h2>
        <div className='my-3 h-px w-16 bg-gold' />
        <p className='text-sm text-muted-foreground'>{ABOUT.office}</p>
      </div>
      <p className='max-w-3xl text-sm leading-relaxed md:text-base'>
        For a fire anywhere in Metro Manila, the system lists the nearest fire stations with an available truck, grouped into alarm levels, from live
        truck status. The radio operator of the city where the fire is dispatches the 1st Alarm, raises the alarm as the fire grows, requests special
        units such as ladders and ambulances, and closes the incident. Every city whose trucks respond is notified at once, and every step is recorded
        for the time log, statistics and audit.
      </p>
    </Card>
  );
}

export default AboutHero;
