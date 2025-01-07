const fireStations = [
    // { name: "San Nicolas Fire Sub-Station", long: 120.9704885, lat: 14.59726023, district: "firedistrict1" },
    // { name: "Tanduay Fire Sub Station", long: 120.9896486, lat: 14.5982888, district: "firedistrict1" },
    // { name: "Paco Fire Sub-Station", long: 120.988127, lat: 14.5807174, district: "firedistrict1" },
    // { name: "Intramuros Fire Sub-Station", long: 120.97226, lat: 14.59221415, district: "firedistrict1" },
    { name: "Tondo Fire Sub-Station", long: 120.966613, lat: 14.607579, district: "firedistrict1" },
    // { name: "Sta Mesa Fire Sub-Station", long: 121.008152, lat: 14.601803, district: "firedistrict1" },
    { name: "Gagalangin Fire Sub-station", long: 120.97303, lat: 14.6248, district: "firedistrict1" },
    // { name: "Sta. Ana Fire Sub-Station", long: 121.0081588, lat: 14.5802295, district: "firedistrict1" },
    // { name: "Arroceros Fire Sub-Station", long: 120.9818336, lat: 14.59321163, district: "firedistrict1" },
    // { name: "Sampaloc Fire Sub-Station", long: 120.9949955, lat: 14.60785049, district: "firedistrict1" },
    // { name: "Malacañang Fire Sub-station", long: 120.9926611, lat: 14.59303333 , district: "firedistrict1"},
    { name: "Bacood Fire Sub-Station", long: 121.0201339, lat: 14.5925976, district: "firedistrict1" },
    { name: "Pandacan Fire Station", long: 121.0119364, lat: 14.5920162, district: "firedistrict1" }, 
    // { name: "San Lazaro Fire Station", long: 120.9823968, lat: 14.6129367, district: "firedistrict1" },
    //fd2
    { name: "CALOOCAN CENTRAL FIRE STATION", long: 120.9743163, lat: 14.6577816, district: "firedistrict2" },
    { name: "Maypajo Fire Sub-Station", long: 120.9736746, lat: 14.6379998, district: "firedistrict2" },
    { name: "Talipapa Fire Sub station", long: 121.0172964, lat: 14.6900432, district: "firedistrict2" },
    { name: "Barrio San Jose Fire Sub-Station", long: 120.989145, lat: 14.6399895, district: "firedistrict2" },
    // { name: "BF HOMES FIRE SUBSTATION", long: 121.0197344, lat: 14.7321625, district: "firedistrict2" },\
    //augmented to tanduay fs
    { name: "BF HOMES FIRE SUBSTATION (AUGMENTED TO TANDUAY FSS FD-1)", long: 120.9896486, lat: 14.5982888, district: "firedistrict2" }, 
    { name: "Caloocan City North Fire Sub. Station", long: 121.0330668, lat: 14.7497722, district: "firedistrict2" },
    { name: "CIC Kaybiga Fire Station", long: 121.0164925, lat: 14.7236458, district: "firedistrict2" },
    { name: "Malaria Fire Sub-Station", long: 121.0796712, lat: 14.7695139, district: "firedistrict2" },
    { name: "Amparo Fire Sub Station Caloocan", long: 121.0685469, lat: 14.7512875, district: "firedistrict2" },
    { name: "Bagong Silang Fire Sub Station", long: 121.0371573, lat: 14.7812628, district: "firedistrict2" },
    { name: "Caloocan North City Hall Fire Sub-Station", long: 121.0538992, lat: 14.7508282, district: "firedistrict2" },
    { name: "Kaybiga Fire Sub-Station", long: 121.0071654, lat: 14.7190711, district: "firedistrict2" },
    { name: "Bagong Barrio Fire Station", long: 120.997324, lat: 14.66528, district: "firedistrict2" },
    { name: "Malabon Central Fire Station", long: 120.9760183, lat: 14.6690827, district: "firedistrict2" },
    { name: "Panghulo Fire Sub-Station", long: 120.9540284, lat: 14.6868622, district: "firedistrict2" },
    { name: "Bayan Fire Sub-Station", long: 120.951079, lat: 14.658047, district: "firedistrict2" },
    { name: "Navotas Fire Station", long: 120.9480052, lat: 14.6568702, district: "firedistrict2" },
    { name: "Tangos Fire Sub Station", long: 120.9324715, lat: 14.67524772, district: "firedistrict2" },
    { name: "Dagat-Dagatan Fire Sub Station", long: 120.9619282, lat: 14.64476265, district: "firedistrict2" },
    { name: "Tanza Fire Sub Station", long: 120.9397316, lat: 14.6749853, district: "firedistrict2" },
    // { name: "VALENZUELA CITY CENTRAL FIRE STATION", long: 120.9688537, lat: 14.69315043, district: "firedistrict2" },
    //augmented to san nicoals fss fd-1
    { name: "VALENZUELA CITY CENTRAL FIRE STATION (AUGMENTED TO SAN NICOLAS FD-1)", long: 120.9704885, lat: 14.59726023, district: "firedistrict2" },
    { name: "Karuhatan Fire Station", long: 120.9781937, lat: 14.689649, district: "firedistrict2" },
    { name: "MARULAS FIRE SUB-STATION", long: 120.9828305, lat: 14.67372313, district: "firedistrict2" },
    { name: "POLO FIRE SUB-STATION", long: 120.9463363, lat: 14.70811914, district: "firedistrict2" },
    { name: "Wawang Pulo Fire Sub Station", long: 120.9277959, lat: 14.7337078, district: "firedistrict2" },
    { name: "Paso De Blas Fire Sub Station", long: 120.9925994, lat: 14.7077694, district: "firedistrict2" },
    { name: "DALANDANAN FIRE SUB-STATION", long: 120.9612571, lat: 14.70441349, district: "firedistrict2" },
    { name: "CANUMAY FIRE SUB-STATION", long: 120.9834141, lat: 14.70559586, district: "firedistrict2" },
    { name: "Mapulang Lupa Fire Sub Station", long: 121.0009289, lat: 14.7025971, district: "firedistrict2" },
    { name: "Bagbaguin Fire Sub Station", long: 121.0008684, lat: 14.7139121, district: "firedistrict2" },
    { name: "Ugong Fire Station", long: 121.0090087, lat: 14.6940854, district: "firedistrict2" },
    { name: "Gen. T. De Leon Fire Station", long: 120.9909988, lat: 14.6854875, district: "firedistrict2" },
    { name: "Punturin Fire Station", long: 120.9903109, lat: 14.7410278, district: "firedistrict2" },
    { name: "Bignay Fire Sub Station", long: 120.9968496, lat: 14.7479033, district: "firedistrict2" },
    { name: "Lawang Bato Fire Sub Station", long: 120.9939605, lat: 14.7303781, district: "firedistrict2" },
    { name: "Malinta Fire Sub-Station", long: 120.9658555, lat: 14.6863348, district: "firedistrict2" },
    { name: "BANGKAL FIRE STATION", long: 121.011986, lat: 14.54145805, district: "firedistrict3" },
    { name: "Pio Del Pilar Fire Sub Station", long: 121.0072598, lat: 14.5505498, district: "firedistrict3" },
    { name: "PALANAN FIRE SUBSTATION", long: 121.005845, lat: 14.560408, district: "firedistrict3" },
    { name: "LA PAZ FIRE SUBSTATION", long: 121.0073846, lat: 14.56852114, district: "firedistrict3" },
    // { name: "TEJEROS FIRE SUBSTATION", long: 121.01433, lat: 14.57448, district: "firedistrict3" },
    //augmendted to sta ana fd1
    { name: "TEJEROS FIRE SUBSTATION (AUGMENTED STA. ANA FD1)", long: 121.0081588, lat: 14.5802295, district: "firedistrict3" },
    { name: "VALENZUELA FIRE SUBSTATION", long: 121.0245, lat: 14.5719, district: "firedistrict3" },
    { name: "POBLACION FIRE SUBSTATION", long: 121.0329623, lat: 14.56739838, district: "firedistrict3" },
    { name: "GUADALUPE FIRE SUBSTATION", long: 121.0448334, lat: 14.56064583, district: "firedistrict3" },
    { name: "Ayala Satellite Fire Station", long: 121.0267756, lat: 14.5506354, district: "firedistrict3" },
    { name: "Makati Central Fire Station", long: 121.0151878, lat: 14.5624549, district: "firedistrict3" },
    { name: "MUNTINLUPA CENTRAL FIRE STATION", long: 121.04343, lat: 14.41884, district: "firedistrict3" },
    { name: "TUNASA FIRE SUBSTATION", long: 121.04201, lat: 14.38349, district: "firedistrict3" },
    { name: "AYALA ALABANG FIRE STATION", long: 121.0309143, lat: 14.4082578, district: "firedistrict3" },
    { name: "SUCAT FIRE SUBSTATION", long: 121.05154, lat: 14.4513, district: "firedistrict3" },
    { name: "BILIBID FIRE SUBSTATION", long: 121.0230973, lat: 14.3781568, district: "firedistrict3" },
    // { name: "CUPANG FIRE SUB STATION", long: 121.0508879, lat: 14.4387282, district: "firedistrict3" }, // wala pang firetruck hindi activated
    { name: "PASAY CENTRAL FIRE STATION", long: 121.00419, lat: 14.54934, district: "firedistrict3" },
    // augmented to intramuros fd1
    { name: "PASAY CENTRAL FIRE STATION (AUGMENTED TO INTRAMUROS FD1)", long: 120.97226, lat: 14.59221415, district: "firedistrict3" },
    { name: "MALIBAY FIRE SUBSTATION", long: 121.009444, lat: 14.533889, district: "firedistrict3" },
    { name: "VILLAMOR FIRE SUBSTATION", long: 121.0179, lat: 14.5200, district: "firedistrict3" },
    { name: "SENATE FIRE SUBSTATION", long: 120.982655, lat: 14.54553492, district: "firedistrict3" },
    { name: "KALAYAAN FIRE SUBSTATION", long: 121.029062, lat: 14.50771, district: "firedistrict3" },
    // { name: "PARAÑAQUE CENTRAL FIRE STATION", long: 120.991675, lat: 14.48659722, district: "firedistrict3" },
    // augmented to sta mesa fs fd-1
    { name: "PARAÑAQUE CENTRAL FIRE STATION", long: 121.008152, lat: 14.601803, district: "firedistrict3" },
    { name: "BF Homes Fire Sub-Station", long: 121.0272222, lat: 14.4455556, district: "firedistrict3" },
    { name: "Merville Fire Sub-Station", long: 120.9969444, lat: 14.50472222, district: "firedistrict3" },
    { name: "Don Bosco Fire Station", long: 121.0381882, lat: 14.4818249, district: "firedistrict3" },
    // { name: "SRF Base - Parañaque City", long: 121.0218554, lat: 14.4712071, district: "firedistrict3" },
    { name: "BAMBOO FIRE SUBSTATION", long: 120.9816218, lat: 14.48094532, district: "firedistrict3" },
    { name: "C5 VILLAR SIPAG FIRE SUB-STATION", long: 120.983056, lat: 14.476858, district: "firedistrict3" },
    { name: "Gatchalian Fire Sub-Station", long: 120.9918917, lat: 14.4707348, district: "firedistrict3" },
    { name: "CAA Fire Substation", long: 120.9974001, lat: 14.4614806, district: "firedistrict3" },
    { name: "BFRV Fire Station", long: 120.9839307, lat: 14.4339744, district: "firedistrict3" },
    { name: "Manuela Fire Substation", long: 120.975039, lat: 14.454633, district: "firedistrict3" },
    { name: "Hansuyin Fire Substation", long: 121.000984, lat: 14.43277293, district: "firedistrict3" },
    { name: "Pilar Fire Station", long: 121.0083291, lat: 14.4166162, district: "firedistrict3" },
    { name: "CRM Fire Substation", long: 121.0133073, lat: 14.4180667, district: "firedistrict3" },
    { name: "TS Cruz Fire Substation", long: 121.01796, lat: 14.41594, district: "firedistrict4" },
    { name: "IVC Fire Substation", long: 121.0797707, lat: 14.627106, district: "firedistrict4" },
    { name: "Pugad Lawin Fire Station", long: 121.1307955, lat: 14.6584345, district: "firedistrict4" },
    { name: "Parang Fire Substation", long: 121.1081547, lat: 14.6575103, district: "firedistrict4" },
    { name: "Marikina Central Fire Station", long: 121.0975105, lat: 14.632936, district: "firedistrict4" },
    { name: "Concepcion Fire Station (BFP)", long: 121.1091109, lat: 14.6480091, district: "firedistrict4" },
    { name: "Nangka Fire Substation", long: 121.1066667, lat: 14.66638889, district: "firedistrict4" },
    { name: "Maybunga Fire Substation", long: 121.095722, lat: 14.580488, district: "firedistrict4" },
    { name: "Kapitolyo Fire Substation", long: 121.0596142, lat: 14.5716756, district: "firedistrict4" },
    { name: "Pinagbuhatan Fire Substation", long: 121.1037306, lat: 14.548833, district: "firedistrict4" },
    { name: "Meralco Rescue Fire Substation", long: 121.066884, lat: 14.590167, district: "firedistrict4" },
    { name: "Manggahan Fire Substation", long: 121.1024912, lat: 14.6030352, district: "firedistrict4" },
    { name: "Sta Lucia Fire Substation", long: 121.1038052, lat: 14.5886118, district: "firedistrict4" },
    { name: "Pasig City Central Fire Station", long: 121.081884, lat: 14.5620972, district: "firedistrict4" },
    { name: "Bagong Ilog Fire Substation", long: 121.069355, lat: 14.5676039, district: "firedistrict4" },
    { name: "Meralco Fire Substation", long: 121.063529, lat: 14.579157, district: "firedistrict4" },
    { name: "Pateros Central Fire Station", long: 121.0734278, lat: 14.55163457, district: "firedistrict4" },
    { name: "Sta Ana Fire Substation - Pateros", long: 121.070189, lat: 14.544016, district: "firedistrict4" },
    { name: "Taguig Central Fire Station", long: 121.043008, lat: 14.5027825, district: "firedistrict4" },
    { name: "Central Signal Fire Substation", long: 121.0571817, lat: 14.5109644, district: "firedistrict4" },
    { name: "BFP Tipas Fire Sub-Station", long: 121.0883286, lat: 14.5406866, district: "firedistrict4" },
    { name: "Bagumbayan Fire Sub Station", long: 121.0591192, lat: 14.4738314, district: "firedistrict4" },
    { name: "North Signal Fire Station", long: 121.0589118, lat: 14.5138765, district: "firedistrict4" },
    { name: "BFP Taguig City Cuasay Fire Station 8", long: 121.0513916, lat: 14.518856, district: "firedistrict4" },
    { name: "Wawa Fire Station", long: 121.08078, lat: 14.52067, district: "firedistrict4" },
    { name: "Palingon Fire Substation", long: 121.080213, lat: 14.53823713, district: "firedistrict4" },
    { name: "West Rembo Fire Station", long: 121.0603611, lat: 14.5627689, district: "firedistrict4" },
    { name: "Comembo Fire Station", long: 121.0652659, lat: 14.5490427, district: "firedistrict4" },
    { name: "Mandaluyong Central Fire Station", long: 121.0333742, lat: 14.5771935, district: "firedistrict4" },
    { name: "Mauway Fire Substation", long: 121.0441925, lat: 14.5803048, district: "firedistrict4" },
    { name: "Greenfield District Fire Sub-Station", long: 121.053504, lat: 14.5777418, district: "firedistrict4" },
    { name: "Hulo Fire Sub Station", long: 121.0317822, lat: 14.570132, district: "firedistrict4" },
    // { name: "Kalentong Fire Substation", long: 121.0253071, lat: 14.59131551, district: "firedistrict4" },
    // augmented to paco fs fd1
    { name: "Kalentong Fire Substation", long: 120.988127, lat: 14.5807174, district: "firedistrict4" },
    { name: "P1 Fire Station", long: 121.040074, lat: 14.60839, district: "firedistrict4" },
    { name: "San Juan City Central Fire Station", long: 121.0329397, lat: 14.6049558, district: "firedistrict4" },
    // { name: "Agora Fire Sub Station", long: 121.0231674, lat: 14.6061314, district: "firedistrict4" },
    // augmented to san lazaro fd1
    { name: "Agora Fire Sub Station", long: 120.9823968, lat: 14.6129367, district: "firedistrict4" },
    { name: "Greenhills Fire Substation", long: 121.0504187, lat: 14.6030979, district: "firedistrict4" },
    { name: "Addition Hills Fire Substation", long: 121.033531, lat: 14.5919569, district: "firedistrict4" },
    // { name: "La Loma Fire Station", long: 120.9947656, lat: 14.63190561, district: "firedistrict5" },
    //augmented to malacañang fd1
    { name: "La Loma Fire Station", long: 120.9926611, lat: 14.59303333, district: "firedistrict5" },   
    { name: "San Antonio F/SSTN (Frisco)", long: 121.0187448, lat: 14.6546921, district: "firedistrict5" },
    { name: "Project 6 F/SSTN", long: 121.040788, lat: 14.662106, district: "firedistrict5" },
    { name: "Bahay Toro F/SSTN", long: 121.01966, lat: 14.66496, district: "firedistrict5"  },
    { name: "Ramon Magsaysay F/SSTN", long: 121.021673, lat: 14.659508, district: "firedistrict5" },
    { name: "Masambong F/SSTN", long: 121.0121447, lat: 14.64036028, district: "firedistrict5" },
    { name: "Congress F/SSTN", long: 121.0957726, lat: 14.6946212 , district: "firedistrict5"},
    { name: "Commonwealth F/SSTN", long: 121.07771, lat: 14.6968, district: "firedistrict5" },
    { name: "Holy Spirit F/SSTN", long: 121.0763411, lat: 14.68435854, district: "firedistrict5" },
    { name: "Rolling Hills F/SSTN", long: 121.1152839, lat: 14.7270284, district: "firedistrict5" },
    { name: "Batasan FSS", long: 121.098555, lat: 14.6887, district: "firedistrict5" },
    { name: "Bagong Silangan F/SSTN", long: 121.11048, lat: 14.697208, district: "firedistrict5" },
    { name: "Marilag F/SSTN", long: 121.0679406, lat: 14.62289266, district: "firedistrict5" },
    { name: "Eastwood F/SSTN", long: 121.0766626, lat: 14.61003052, district: "firedistrict5" },
    { name: "Quirino 2A F/SSTN", long: 121.0564718, lat: 14.6314021, district: "firedistrict5" },
    { name: "PINAGKAISAHAN FSS", long: 121.046285, lat: 14.627912, district: "firedistrict5" },
    { name: "Galas F/SSTN", long: 121.0090167, lat: 14.61194567, district: "firedistrict5" },
    // { name: "Paligsahan F/SSTN", long: 121.0225786, lat: 14.6294061, district: "firedistrict5" },
    //augmented to arroceros fd1
    { name: "Paligsahan F/SSTN", long: 120.9818336, lat: 14.59321163, district: "firedistrict5" },
    { name: "Central F/SSTN", long: 121.05187, lat: 14.64702, district: "firedistrict5" },
    { name: "Krus na Ligas F/SSTN", long: 121.0622653, lat: 14.6472596, district: "firedistrict5" },
    { name: "Laging Handa FSS", long: 121.03266, lat: 14.63225, district: "firedistrict5" },
    { name: "Novaliches F/SSTN", long: 121.0354246, lat: 14.72127794 , district: "firedistrict5"},
    { name: "San Bartolome F/SSTN", long: 121.0281342, lat: 14.71089209, district: "firedistrict5" },
    { name: "Lagro F/SSTN", long: 121.0681894, lat: 14.7224805, district: "firedistrict5" },
    { name: "Sta. Lucia F/SSTN", long: 121.0537196, lat: 14.70781355, district: "firedistrict5" },
    { name: "Fairview F/SSTN", long: 121.0730149, lat: 14.70741657, district: "firedistrict5" },
    { name: "Pasong Putik F/SSTN", long: 121.05567, lat: 14.72875, district: "firedistrict5" },
    { name: "Kingspoint F/SSTN", long: 121.0246046, lat: 14.70056341, district: "firedistrict5" },
    { name: "BAESA FSS", long: 121.0135009, lat: 14.673543, district: "firedistrict5" },
    { name: "Talipapa F/SSTN", long: 121.02549, lat: 14.68794, district: "firedistrict5" },
    { name: "New Era F/SSTN", long: 121.0600877, lat: 14.66707753, district: "firedistrict5" },
    { name: "Pasong Tamo F/SSTN", long: 121.0471213, lat: 14.68639302, district: "firedistrict5" },
    { name: "Agham Fire Station", long: 121.0383664, lat: 14.6518808, district: "firedistrict5" },
    { name: "Loyola Heights Fire Sub Station", long: 121.0744281, lat: 14.6415892, district: "firedistrict5" },
    { name: "Tandang Sora Fire Sub Station QCFD", long: 121.0387274, lat: 14.686462 , district: "firedistrict5"},
];

const alarms = [
    "1st Alarm",
    "2nd Alarm",
    "3rd Alarm",
    "4th Alarm",
    "5th Alarm",
    "Task Force Alpha",
    "Task Force Bravo",
    "Task Force Charlie",
    "Task Force Delta",
    "General Alarm",
];

const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const delta_phi = ((lat2 - lat1) * Math.PI) / 180;
    const delta_lambda = ((lon2 - lon1) * Math.PI) / 180;
  
    const a =
      Math.sin(delta_phi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(delta_lambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; 
  };

const categorizeAlarm = (stations) => {
    const stationPerAlarm = [];      
    for (let i = 0; i < stations.length; i += 4) {
      const group = stations.slice(i, i + 4);
      const alarmLevel = alarms[stationPerAlarm.length % alarms.length]; 
      stationPerAlarm.push({alarmLevel: alarmLevel, stations: group}); 
    }      
    return stationPerAlarm;
  };

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '50%',
    height:'50%',
    bgcolor: 'background.paper',
    p: 0,
  };

export default {
    fireStations,
    alarms,
    haversine,
    categorizeAlarm,
    modalStyle
}