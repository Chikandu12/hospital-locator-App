import React from "react";
import {
    Combobox,
    ComboboxInput,
    ComboboxPopover,
    ComboboxList,
    ComboboxOption,
  } from "@reach/combobox";

import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import { formatRelative } from "date-fns";
import "@reach/combobox/styles.css";
import $ from "jquery"

const libraries = ["places"];
const mapContainerStyle = {
  height: "100vh",
  width: "100vw",
};
const options = {
  zoomControl: true,
};
const center = {
  lat: 6.442430,
  lng: 3.342080,
};

export default function App() {

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey:'AIzaSyCaXlowrUnI0bXbOdA0A8XXlg8q0K0k7PY', 
    libraries,
  });
  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  //const [hospitalResults, setHospitalResults] = React.useState([]);

  const onMapClick = React.useCallback((e) => {
    setMarkers((current) => [
      ...current,
      {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);
 
  
  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
   
  }, []);

  
     
  
  

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <h1>
        
        Hospital{" "}
        <span role="img" aria-label="tent">
          🏥
        </span>
      </h1>

      <Locate panTo={panTo} />
      <Search panTo={panTo} />
      <div id="ResultDiv">
                <table id="tblResult" class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">name</th>
                            <th scope="col">Address</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
     
      <GoogleMap
        id="map"
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {markers.map((marker) => (
          <Marker
            key={`${marker.lat}-${marker.lng}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => {
              setSelected(marker);
            }}
            icon={{
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
              scaledSize: new window.google.maps.Size(30, 30),
            }}
          />
        ))}

        {selected ? (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => {
              setSelected(null);
            }}
          >
            <div>
              <h2>
                Location Details 
              </h2>
              <p>Spotted {formatRelative(selected.time, new Date())}</p>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}

function componentDidMount(lat, lng) {
  let YOUR_API_KEY = "AIzaSyCaXlowrUnI0bXbOdA0A8XXlg8q0K0k7PY"
  let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ','+ lng + '&radius=20000&type=hospital&keyword=clinic|hospital|health&key= ' + YOUR_API_KEY;
  fetch(url, {
    method: 'GET',
    headers:{
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    let dataResponse = data.results;
    
    //Function to Loop through the data and bind it on the Page 
    //console.log(hospitalResults);
     mapListOfHospitals(dataResponse)
 
  })
  .catch(console.log)
}

function mapListOfHospitals(dataResponse){
  console.log("List of Hospitals around 20 mile radius***");
  var hospitalResultTable = $('#tblResult tbody');
  $.each(dataResponse, function (index, val) {   
    let name = val.name;
    let address = val.vicinity;
    hospitalResultTable.append('<tr><td>' + name + '</td><td>' + address + '</td></tr>')   
});


}

function Locate({ panTo }) {
  return (
    <button
      className="locate"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => null
        );
      }}
    >
      <img src="/compass.svg" alt="compass" />
    </button>
  );
}

function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 43.6532, lng: () => -79.3832 },
      radius: 100 * 1000,
    },
  });

  function getNearbyHospitals(lat,lng){
    componentDidMount(lat, lng);

  }

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      getNearbyHospitals(lat,lng);
      panTo({ lat, lng });
    } catch (error) {
      
    }
  };

  return (
    <div className="search">
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Search your location"
        />
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}
