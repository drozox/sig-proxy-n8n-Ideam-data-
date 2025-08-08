const API_URL = 'https://www.datos.gov.co/resource/57sv-p2fu.json';

// Function to fetch data from the API
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Data fetched successfully:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to initialize the map
function initMap(data) {
    // Center of Colombia
    const map = L.map('map').setView([4.7110, -74.0721], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    data.forEach(station => {
        if (station.latitud && station.longitud) {
            const lat = parseFloat(station.latitud);
            const lon = parseFloat(station.longitud);

            if (!isNaN(lat) && !isNaN(lon)) {
                const marker = L.marker([lat, lon]).addTo(map);
                marker.bindPopup(`
                    <b>${station.nombreestacion}</b><br>
                    ${station.municipio}, ${station.departamento}<br>
                    <hr>
                    <b>Sensor:</b> ${station.descripcionsensor}<br>
                    <b>Valor:</b> ${station.valorobservado} ${station.unidadmedida}
                `);
            }
        }
    });
}

function initDashboard(data) {
    // 1. Stations per department chart
    const stationsByDept = data.reduce((acc, station) => {
        const dept = station.departamento;
        if (!acc[dept]) {
            acc[dept] = new Set();
        }
        acc[dept].add(station.codigoestacion);
        return acc;
    }, {});

    const deptLabels = Object.keys(stationsByDept);
    const deptData = deptLabels.map(dept => stationsByDept[dept].size);

    const deptCtx = document.getElementById('departamentoChart').getContext('2d');
    new Chart(deptCtx, {
        type: 'bar',
        data: {
            labels: deptLabels,
            datasets: [{
                label: 'Número de Estaciones por Departamento',
                data: deptData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });

    // 2. Sensor types distribution chart
    const sensorsByType = data.reduce((acc, station) => {
        const sensorType = station.descripcionsensor || 'No especificado';
        acc[sensorType] = (acc[sensorType] || 0) + 1;
        return acc;
    }, {});

    const sensorLabels = Object.keys(sensorsByType);
    const sensorData = Object.values(sensorsByType);

    const sensorCtx = document.getElementById('sensorChart').getContext('2d');
    new Chart(sensorCtx, {
        type: 'pie',
        data: {
            labels: sensorLabels,
            datasets: [{
                label: 'Distribución de Tipos de Sensores',
                data: sensorData,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribución de Tipos de Sensores'
                }
            }
        }
    });
}


// Main function to initialize the application
async function main() {
    const data = await fetchData();
    if (data) {
        initMap(data);
        initDashboard(data);
    }
}

main();
