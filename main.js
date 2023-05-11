/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true,
}).setView([ibk.lat, ibk.lng], 11);

// thematische Layer
let themaLayer = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    windVelocity: L.featureGroup(),
}

// Hintergrundlayer
let layerControl = L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://lawinen.report">CC BY avalanche.report</a>`,
        maxZoom: 12,
    }).addTo(map),
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur": themaLayer.temperature,
    "Windgeschwindigkeit": themaLayer.windVelocity.addTo(map),
}).addTo(map);

layerControl.expand();

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

//Funktion um die Farben zu bekommen: ramp für colorramp
function getColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}

function writeStationLayer(jsondata) {
    //Wetterstationen mit Icons und Popups implementieren
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'icons/icons.png',
                    popupAnchor: [0, -37],
                    iconAnchor: [16, 37],
                })
            });
        },
        onEachFeature: function (feature, layer) {
            let prop = feature.properties;
            let pointInTime = new Date(prop.date);
            layer.bindPopup(`
            <h4>${prop.name}, ${feature.geometry.coordinates[2]}m</h4>
            <ul>
                <li>Lufttemperatur in °C: ${prop.LT || "keine Angabe"}</li>
                <li>Relative Feuchte in %: ${prop.RH || "keine Angabe"}</li>
                <li>Windgeschwindigkeit in km/h: ${prop.WG ? (prop.WG * 3.6).toFixed(1) : "keine Angabe"} </li>
                <li>Schneehöhe in cm: ${prop.HS || "keine Angabe"}</li>
            </ul>
            <span>${pointInTime.toLocaleString()}</span>;
            `);
        }
    }).addTo(themaLayer.stations);
}

function writeTemperatureLayer(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.LT > -50 && feature.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            console.log("Color: ", color);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon", //css-Klasse vergeben, um danach stylen zu können
                    html: `<span style="background-color: ${color}">${feature.properties.LT.toFixed(1)}</span>`,
                })
            });
        },
    }).addTo(themaLayer.temperature);
}

function writeWindLayer(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.WG > 0 && feature.properties.WG < 500) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let windKmh = feature.properties.WG * 3.6;
            let color = getColor(windKmh, COLORS.windVelocity);
            console.log("Color: ", color);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon", //css-Klasse vergeben, um danach stylen zu können
                    html: `<span style="background-color: ${color}">${windKmh.toFixed(1)}</span>`,
                })
            });
        },
    }).addTo(themaLayer.windVelocity);
}

// Vienna Sightseeing Haltestellen
async function loadStations(url) {
    let response = await fetch(url);
    let jsondata = await response.json();
    writeStationLayer(jsondata);
    writeTemperatureLayer(jsondata);
    writeWindLayer(jsondata);
}
loadStations("https://static.avalanche.report/weather_stations/stations.geojson");