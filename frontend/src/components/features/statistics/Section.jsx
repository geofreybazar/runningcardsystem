function Section({ title, children }) {
  return (
    <section className='grid gap-3'>
      <h2 className='text-base font-semibold'>{title}</h2>
      {children}
    </section>
  );
}

export default Section;
