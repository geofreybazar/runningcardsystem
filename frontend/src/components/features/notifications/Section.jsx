import Panel from "@/components/common/Panel.jsx";

/** A notifications page column: a Panel whose body is a divided list. */
function Section({ title, meta, actions, children }) {
  return (
    <Panel title={title} meta={meta} actions={actions} flush className='self-start'>
      {children}
    </Panel>
  );
}

export default Section;
