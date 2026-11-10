import Panel from "@/components/common/Panel.jsx";
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
    <div className='grid gap-4 lg:grid-cols-2'>
      <Panel title='Credits & support' className='self-start'>
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
      </Panel>
      <Panel title='Version' className='self-start'>
          <dl className='grid gap-3'>
            <Row label='Version'>{BUILD.version}</Row>
            <Row label='Built'>{BUILD.date ? formatDateTime(BUILD.date) : "—"}</Row>
            <Row label='Commit'>{BUILD.commit ? <code className='font-mono text-xs'>{BUILD.commit}</code> : "—"}</Row>
            <Row label='Built with'>{ABOUT.builtWith.join(", ")}</Row>
          </dl>
      </Panel>
    </div>
  );
}

export default CreditsCard;
