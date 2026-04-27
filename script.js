async function loadFlights() {
  const response = await fetch("flights.json");
  const flights = await response.json();

  renderTable(flights);
  renderGroups(flights);
  renderMap(flights);
}

function renderTable(flights) {
  const container = document.getElementById("flightTable");

  let html = `
    <table>
      <tr>
        <th>Name</th>
        <th>Route</th>
        <th>Flight</th>
        <th>Arrival</th>
        <th>Notes</th>
      </tr>
  `;

  flights.forEach(flight => {
    html += `
      <tr>
        <td>${flight.name}</td>
        <td>${flight.departureCity} → ${flight.layover || "Direct"} → ${flight.arrivalCity}</td>
        <td>${flight.airline} ${flight.flightNumber}</td>
        <td>${flight.arrivalDate} at ${flight.arrivalTime}</td>
        <td>${flight.notes || ""}</td>
      </tr>
    `;
  });

  html += `</table>`;
  container.innerHTML = html;
}

function renderGroups(flights) {
  const container = document.getElementById("groups");
  const groups = {};

  flights.forEach(flight => {
    const hour = Number(flight.arrivalTime.split(":")[0]);
    const blockStart = Math.floor(hour / 2) * 2;
    const blockEnd = blockStart + 2;

    const key = `${flight.arrivalCity} — ${flight.arrivalDate} — ${formatHour(blockStart)} to ${formatHour(blockEnd)}`;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(flight);
  });

  let html = "";

  Object.keys(groups).forEach(groupName => {
    html += `
      <div class="card">
        <div class="group-title">${groupName}</div>
        <ul>
    `;

    groups[groupName].forEach(flight => {
      html += `
        <li>
          <strong>${flight.name}</strong> arrives at ${flight.arrivalTime}
          from ${flight.departureCity}
        </li>
      `;
    });

    html += `
        </ul>
      </div>
    `;
  });

  container.innerHTML = html;
}

function formatHour(hour) {
  const adjusted = hour % 24;
  const suffix = adjusted >= 12 ? "PM" : "AM";
  const display = adjusted % 12 === 0 ? 12 : adjusted % 12;
  return `${display}:00 ${suffix}`;
}

function renderMap(flights) {
  const map = L.map("map").setView([41.3851, 2.1734], 3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  flights.forEach(flight => {
    const departure = [flight.departureLat, flight.departureLng];
    const arrival = [flight.arrivalLat, flight.arrivalLng];

    L.marker(departure)
      .addTo(map)
      .bindPopup(`<strong>${flight.name}</strong><br>${flight.departureCity}`);

    L.marker(arrival)
      .addTo(map)
      .bindPopup(`<strong>${flight.arrivalCity}</strong><br>${flight.name} arrives ${flight.arrivalTime}`);

    L.polyline([departure, arrival], {
      weight: 3,
      opacity: 0.7
    }).addTo(map);
  });
}

loadFlights();
