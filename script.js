async function loadFlights() {
  const response = await fetch("flights.json");
  const flights = await response.json();

  renderTable(flights);
  renderGroups(flights);
  renderMap(flights);
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();

  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  if (day % 10 === 2 && day !== 12) suffix = "nd";
  if (day % 10 === 3 && day !== 13) suffix = "rd";

  return `${month} ${day}${suffix}`;
}

function formatHour(hour) {
  const adjusted = hour % 24;
  const suffix = adjusted >= 12 ? "PM" : "AM";
  const display = adjusted % 12 === 0 ? 12 : adjusted % 12;
  return `${display}:00 ${suffix}`;
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
    const layoverText = flight.layovers && flight.layovers.length > 0
      ? flight.layovers.map(l => l.city).join(" → ")
      : "Direct";

    html += `
      <tr>
        <td>${flight.name}</td>
        <td>${flight.departureCity} → ${layoverText} → ${flight.arrivalCity}</td>
        <td>${flight.airline} ${flight.flightNumber}</td>
        <td>${formatDate(flight.arrivalDate)} at ${flight.arrivalTime}</td>
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

    const key = `${flight.arrivalCity} — ${formatDate(flight.arrivalDate)} — ${formatHour(blockStart)} to ${formatHour(blockEnd)}`;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(flight);
  });

  let html = "";

  Object.keys(groups).forEach(groupName => {
    if (groups[groupName].length === 0) return;

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

function renderMap(flights) {
  const map = L.map("map").setView([42, -35], 3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  flights.forEach(flight => {
    const route = [
      {
        city: flight.departureCity,
        lat: flight.departureLat,
        lng: flight.departureLng
      },
      ...(flight.layovers || []),
      {
        city: flight.arrivalCity,
        lat: flight.arrivalLat,
        lng: flight.arrivalLng
      }
    ];

    route.forEach((stop, index) => {
      L.marker([stop.lat, stop.lng])
        .addTo(map)
        .bindPopup(`
          <strong>${flight.name}</strong><br>
          ${index === 0 ? "Departure" : index === route.length - 1 ? "Arrival" : "Layover"}: ${stop.city}
        `);
    });

    const linePoints = route.map(stop => [stop.lat, stop.lng]);

    L.polyline(linePoints, {
      weight: 3,
      opacity: 0.7
    }).addTo(map);
  });
}

loadFlights();
