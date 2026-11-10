/** Trucks each city sent to fires elsewhere, and received from other cities. */
function MutualAid({ rows }) {
  return (
    <div className='max-h-80 overflow-auto'>
      <table className='w-full text-sm'>
        <thead className='text-xs text-muted-foreground'>
          <tr>
            <th className='py-1 text-left font-medium'>City</th>
            <th className='py-1 text-right font-medium'>Sent out</th>
            <th className='py-1 text-right font-medium'>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className='border-t'>
              <td className='py-1.5'>{r.name}</td>
              <td className='py-1.5 text-right font-data'>{r.sent}</td>
              <td className='py-1.5 text-right font-data'>{r.received}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MutualAid;
