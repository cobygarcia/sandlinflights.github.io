async function loadFlights() {
  const response = await fetch("flights.json");
  const flights = await response.json();

  const outboundFlights = flights.filter(flight => flight.tripType === "outbound");
  const returnFlights = flights.filter(flight => flight.tripType === "return");

  renderGroups(outboundFlights, "outboundGroups", "arrival");
  renderMap(outboundFlights, "outboundMap");
  renderTable(outboundFlights, "outboundFlights", "arrival");

  renderGroups(returnFlights, "returnGroups", "departure");
  renderMap(returnFlights, "returnMap");
  renderTable(returnFlights, "returnFlights", "departure");
}

function formatDate(dateString) {
  if (!dateString) return "";

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

function renderGroups(flights, containerId, mode) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (flights.length === 0) {
    container.innerHTML = "";
    return;
  }

  const groups = {};

  flights.forEach(flight => {
    const date = mode === "arrival" ? flight.arrivalDate : flight.departureDate;
    const time = mode === "arrival" ? flight.arrivalTime : flight.departureTime;
    const city = mode === "arrival" ? flight.arrivalCity : flight.departureCity;

    if (!date || !time) return;

    const hour = Number(time.split(":")[0]);
    const blockStart = Math.floor(hour / 2) * 2;
    const blockEnd = blockStart + 2;

    const key = `${city} — ${formatDate(date)} — ${formatHour(blockStart)} to ${formatHour(blockEnd)}`;

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
      const time = mode === "arrival" ? flight.arrivalTime : flight.departureTime;
      const city = mode === "arrival" ? flight.departureCity : flight.arrivalCity;
      const phrase = mode === "arrival" ? "arrives" : "leaves";

      html += `
        <li>
          <strong>${flight.name}</strong> ${phrase} at ${time}
          ${mode === "arrival" ? "from" : "to"} ${city}
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

function renderTable(flights, containerId, mode) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (flights.length === 0) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Name</th>
        <th>Route</th>
        <th>Flights</th>
        <th>${mode === "arrival" ? "Arrives" : "Leaves"}</th>
        <th>Notes</th>
      </tr>
  `;

  flights.forEach(flight => {
    const route = getRouteText(flight);
    const flightNumbers = getFlightNumbers(flight);

    const date = mode === "arrival" ? flight.arrivalDate : flight.departureDate;
    const time = mode === "arrival" ? flight.arrivalTime : flight.departureTime;

    html += `
      <tr>
        <td>${flight.name}</td>
        <td>${route}</td>
        <td>${flightNumbers}</td>
        <td>${formatDate(date)} at ${time}</td>
        <td>${flight.notes || ""}</td>
      </tr>
    `;
  });

  html += `</table>`;
  container.innerHTML = html;
}

function getRouteText(flight) {
  if (!flight.segments || flight.segments.length === 0) {
    return `${flight.departureCity} → ${flight.arrivalCity}`;
  }

  const route = [];

  flight.segments.forEach((segment, index) => {
    if (index === 0) {
      route.push(segment.fromCity);
    }
    route.push(segment.toCity);
  });

  return route.join(" → ");
}

function getFlightNumbers(flight) {
  if (!flight.segments || flight.segments.length === 0) {
    return "";
  }

  return flight.segments
    .map(segment => `${segment.airline} ${segment.flightNumber}`)
    .join(", ");
}

function renderMap(flights, mapId) {
  const mapContainer = document.getElementById(mapId);
  if (!mapContainer) return;

  if (flights.length === 0) {
    mapContainer.innerHTML = "";
    return;
  }

  const map = L.map(mapId).setView([42, -35], 3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  flights.forEach(flight => {
    if (!flight.segments || flight.segments.length === 0) return;

    const routePoints = [];

    flight.segments.forEach(segment => {
      const fromPoint = [segment.fromLat, segment.fromLng];
      const toPoint = [segment.toLat, segment.toLng];

      routePoints.push(fromPoint);
      routePoints.push(toPoint);

      L.marker(fromPoint)
        .addTo(map)
        .bindPopup(`
          <strong>${flight.name}</strong><br>
          ${segment.fromCity} (${segment.fromAirport})<br>
          Leaves ${formatDate(segment.departureDate)} at ${segment.departureTime}
        `);

      L.marker(toPoint)
        .addTo(map)
        .bindPopup(`
          <strong>${flight.name}</strong><br>
          ${segment.toCity} (${segment.toAirport})<br>
          Arrives ${formatDate(segment.arrivalDate)} at ${segment.arrivalTime}
        `);
    });

    L.polyline(routePoints, {
      weight: 3,
      opacity: 0.7
    }).addTo(map);
  });
}

loadFlights();
