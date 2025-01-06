import FireTruckIcon from '@mui/icons-material/FireTruck';
import {  Table, 
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow} from '@mui/material/';

function Card({runningCard}) {
  return (
    <div className='flex flex-col gap-5'>
            {runningCard?.map((alarm,index) => (
                index % 2 === 0 ? (
                    <div key={index} className='flex gap-12'>
                        <TableContainer className='border'>
                            <Table sx={{ width: '100%' }} aria-label="simple table" size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={3}>{alarm.alarmLevel}</TableCell>
                                </TableRow>
                            </TableHead>
                                <TableBody>
                                {alarm.stations.map((station,index) => ( 
                                    <TableRow>
                                        <TableCell sx={{ padding: '8px' }} key={index}>
                                            <p  className={station.district === "firedistrict1" ? 'bg-orange-400 rounded-full h-16 w-16 flex justify-center items-center' :
                                            station.district === "firedistrict2" ? 'bg-blue-500 rounded-full h-16 w-16 flex justify-center items-center' :
                                            station.district === "firedistrict3" ? 'bg-yellow-500 rounded-full h-16 w-16 flex justify-center items-center' :
                                            station.district === "firedistrict4" ? 'bg-red-600 rounded-full h-16 w-16 flex justify-center items-center' :
                                            station.district === "firedistrict5" ? 'bg-green-500 rounded-full h-16 w-16 flex justify-center items-center' : ''}>
                                                <FireTruckIcon/>
                                            </p>
                                        </TableCell>
                                        <TableCell sx={{ padding: '8px' }} align="left">{station.name.toUpperCase()}</TableCell>
                                        <TableCell sx={{ padding: '8px' }} align="left">{station.distance}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {runningCard[index+1] && (
                        <TableContainer className='border'>
                            <Table sx={{ width: '100%' }} aria-label="simple table" size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={3}>{runningCard[index+1].alarmLevel}</TableCell>
                                </TableRow>
                            </TableHead>
                                <TableBody>
                                {runningCard[index+1].stations.map((station,index) => ( 
                                    <TableRow>
                                        <TableCell sx={{ padding: '8px' }} key={index}>
                                            <p  className={station.district === "firedistrict1" ? 'bg-orange-400 p-1 rounded-full h-16 w-16  flex justify-center items-center' :
                                            station.district === "firedistrict2" ? 'bg-blue-500 rounded-full h-16 w-16  flex justify-center items-center' :
                                            station.district === "firedistrict3" ? 'bg-yellow-500 rounded-full h-16 w-16  flex justify-center items-center' :
                                            station.district === "firedistrict4" ? 'bg-red-600 rounded-full h-16 w-16  flex justify-center items-center' :
                                            station.district === "firedistrict5" ? 'bg-green-500 rounded-full h-16 w-16  flex justify-center items-center' : ''}>
                                                <FireTruckIcon/>
                                            </p>
                                        </TableCell>
                                        <TableCell sx={{ padding: '8px' }} align="left">{station.name.toUpperCase()}</TableCell>
                                        <TableCell sx={{ padding: '8px' }} align="left">{station.distance}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        )}
                    </div>                    
                ) : null
                
            ))}
        </div>
  )
}

export default Card