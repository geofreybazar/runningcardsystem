function Section({ title, children }) {
  return (
    <section className='grid content-start gap-2'>
      <h2 className='text-sm font-semibold text-muted-foreground'>{title}</h2>
      {children}
    </section>
  );
}

export default Section;
