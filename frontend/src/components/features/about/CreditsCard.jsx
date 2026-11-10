import { Card } from "@/components/ui/card";
import { ABOUT, BUILD } from "@/constants/about.js";
import { formatDateTime } from "@/utils/dateTime.js";

function Row({ label, children }) {
  return (
    <div className='grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3'>
      <dt className='text-sm text-muted-foreground'>{label}</dt>
      <dd className='text-sm'>{children}</dd>
    </div>
  );
}

/** Who made it, whom to contact, and which build is running. */
function CreditsCard() {
  return (
    <div className='grid gap-3 lg:grid-cols-2'>
      <section className='grid content-start gap-3'>
        <h2 className='text-lg font-semibold'>Credits & support</h2>
        <Card className='px-5 py-5'>
          <dl className='grid gap-3'>
            <Row label='Developed by'>
              <span className='font-semibold'>{ABOUT.developer}</span>, {ABOUT.developerOffice}
            </Row>
            {ABOUT.support.map((s) => (
              <Row key={s.topic} label={s.topic}>
                {s.text}
              </Row>
            ))}
          </dl>
        </Card>
      </section>
      <section className='grid content-start gap-3'>
        <h2 className='text-lg font-semibold'>Version</h2>
        <Card className='px-5 py-5'>
          <dl className='grid gap-3'>
            <Row label='Version'>{BUILD.version}</Row>
            <Row label='Built'>{BUILD.date ? formatDateTime(BUILD.date) : "—"}</Row>
            <Row label='Commit'>{BUILD.commit ? <code className='font-mono text-xs'>{BUILD.commit}</code> : "—"}</Row>
            <Row label='Built with'>{ABOUT.builtWith.join(", ")}</Row>
          </dl>
        </Card>
      </section>
    </div>
  );
}

export default CreditsCard;
