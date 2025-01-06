import { useState } from 'react';
import variables from '../variables/variables.js';
import Card from './Card.jsx';
import {Button, TextField, IconButton} from '@mui/material/';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import ModalComponent from '../reusablecomponent/ModalComponent.jsx'
import MapComponent from './MapComponent.jsx';

const fireStations = variables.fireStations;
const haversine = variables.haversine;
const categorizeAlarm = variables.categorizeAlarm;
const style = variables.modalStyle;

function Home() {
    
    const [latitude, setLatitude] = useState("");
    const [longtitude, setLongtitude] = useState("");
    const [runningCard, setRunningCard] = useState(null);
    const [openMap, setOpenMap] = useState(false);
    const handleCloseMap = () => setOpenMap(false);

      //14.591623362180677
      //121.00309176478918

    const handleGenerateRunningCard = (e) => {
    e.preventDefault()
    const filtered = fireStations.filter((station) => {
        const distance = haversine(latitude, longtitude, station.lat, station.long);
        return distance <= 100;
        }).map((station) => ({
        name: station.name,
        long: station.long,
        lat: station.lat,
        district: station.district,
        distance: haversine(latitude, longtitude, station.lat, station.long),
        }));
        const sortedStations = filtered.sort((a, b) => a.distance - b.distance);
        const categorizedAlarms = categorizeAlarm(sortedStations);
        const firsst40Stations = categorizedAlarms.slice(0,10)
        setRunningCard(firsst40Stations)
    };

    const handleGenerateRunningCardFromMap = () => {        
        console.log(latitude)
        const filtered = fireStations.filter((station) => {
            const distance = haversine(latitude, longtitude, station.lat, station.long);
            return distance <= 100;
            }).map((station) => ({
            name: station.name,
            long: station.long,
            lat: station.lat,
            district: station.district,
            distance: haversine(latitude, longtitude, station.lat, station.long),
            }));
            const sortedStations = filtered.sort((a, b) => a.distance - b.distance);
            const categorizedAlarms = categorizeAlarm(sortedStations);
            const firsst40Stations = categorizedAlarms.slice(0,10)
            setRunningCard(firsst40Stations)
        };

        // console.log(runningCard)
        // console.log(`${latitude}, ${longtitude}`)
  return (
    <div className='w-full flex flex-col items-center p-10 gap-5' >
        <div className='w-1/3 '> 
            <form className='flex justify-center items-center gap-2' onSubmit={handleGenerateRunningCard}>
                <TextField
                    fullWidth
                    label="Latitude"
                    variant="outlined"
                    size="small"
                    type="string"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                /> 
                <TextField
                    fullWidth
                    label="Longtiture"
                    variant="outlined"
                    size="small"
                    type="string"
                    value={longtitude}
                    onChange={(e) =>setLongtitude(e.target.value)}
                />
                <IconButton onClick={() => setOpenMap(true)}>
                    <EditLocationIcon />
                </IconButton>                
                <Button variant='contained' type='submit'>Submit</Button>  
            </form>
        </div>
        
        <Card runningCard={runningCard} />        
        <ModalComponent open={openMap} handleClose={handleCloseMap} style={style}>
            <MapComponent setLatitude={setLatitude} setLongtitude={setLongtitude} handleGenerateRunningCardFromMap={handleGenerateRunningCardFromMap}/>
        </ModalComponent>
    </div>
  )
}

export default Home