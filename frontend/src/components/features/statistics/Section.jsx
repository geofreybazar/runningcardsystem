function Section({ title, children }) {
  return (
    <section className='grid gap-3'>
      <h2 className='flex items-center gap-3 text-label text-muted-foreground after:h-px after:flex-1 after:bg-border'>{title}</h2>
      {children}
    </section>
  );
}

export default Section;
