const dbName = "EquiposMundialDB";
const dbVersion = 1;
const storeName = "selecciones";
let db = null;

document.addEventListener("DOMContentLoaded", () => {
  const req = indexedDB.open(dbName, dbVersion);
  req.onerror = () => alert("IndexedDB no disponible");
  req.onsuccess = e => {
    db = e.target.result;
    renderTeams();
  };
  req.onupgradeneeded = e => {
    db = e.target.result;
    const store = db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    store.createIndex("zone", "zone", { unique: false });
    store.createIndex("pool", "pool", { unique: false });
    store.createIndex("achievement", "achievement", { unique: false });
  };

  document.getElementById("toggle-form").onclick = () => {
    document.getElementById("team-form").classList.toggle("hidden");
  };

  document.getElementById("cancel-btn").onclick = () => {
    document.getElementById("team-form").reset();
    document.getElementById("team-id").value = "";
    document.getElementById("team-form").classList.add("hidden");
  };

  document.getElementById("team-form").onsubmit = saveTeam;
});

function saveTeam(e) {
  e.preventDefault();
  const team = {
    country: document.getElementById("country").value,
    zone: document.getElementById("zone").value,
    pool: document.getElementById("pool").value,
    coach: document.getElementById("coach").value,
    year: parseInt(document.getElementById("year").value),
    appearances: parseInt(document.getElementById("appearances").value),
    achievement: document.getElementById("achievement").value,
    crest: document.getElementById("crest").value,
    flag: document.getElementById("flag").value
  };

  const id = document.getElementById("team-id").value;
  const tx = db.transaction([storeName], "readwrite");
  const store = tx.objectStore(storeName);

  const req = id ? store.put({ ...team, id: parseInt(id) }) : store.add(team);
  req.onsuccess = () => {
    renderTeams();
    document.getElementById("team-form").reset();
    document.getElementById("team-id").value = "";
    document.getElementById("team-form").classList.add("hidden");
  };
}

function renderTeams() {
  const tx = db.transaction([storeName], "readonly");
  const store = tx.objectStore(storeName);
  const req = store.getAll();

  req.onsuccess = () => {
    const teams = req.result;
    const tbody = document.getElementById("team-table");
    tbody.innerHTML = "";

    if (teams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10">No hay registros</td></tr>`;
      return;
    }

    const stats = { zones: {}, champs: [], totalApps: 0 };
    teams.forEach(t => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.country}</td><td>${t.zone}</td><td>${t.pool}</td><td>${t.coach}</td>
        <td>${t.year}</td><td>${t.appearances}</td><td>${t.achievement}</td>
        <td><img src="${t.crest}" alt="escudo" /></td>
        <td><img src="${t.flag}" alt="bandera" /></td>
        <td>
          <button onclick="editTeam(${t.id})">✏️</button>
          <button onclick="deleteTeam(${t.id})">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);

      stats.zones[t.zone] = (stats.zones[t.zone] || 0) + 1;
      stats.totalApps += t.appearances;
      if (t.achievement === "Campeón") stats.champs.push(t.country);
    });

    document.getElementById("stat-zones").textContent = `Equipos por confederación: ${JSON.stringify(stats.zones)}`;
    document.getElementById("stat-average").textContent = `Promedio de participaciones: ${(stats.totalApps / teams.length).toFixed(2)}`;
    document.getElementById("stat-champs").textContent = `Equipos campeones: ${stats.champs.join(", ") || "Ninguno"}`;
  };
}

function editTeam(id) {
  const tx = db.transaction([storeName], "readonly");
  const store = tx.objectStore(storeName);
  const req = store.get(id);
  req.onsuccess = () => {
    const t = req.result;
    document.getElementById("team-id").value = t.id;
    document.getElementById("country").value = t.country;
    document.getElementById("zone").value = t.zone;
    document.getElementById("pool").value = t.pool;
    document.getElementById("coach").value = t.coach;
    document.getElementById("year").value = t.year;
    document.getElementById("appearances").value = t.appearances;
    document.getElementById("achievement").value = t.achievement;
    document.getElementById("crest").value = t.crest;
    document.getElementById("flag").value = t.flag;
    document.getElementById("team-form").classList.remove("hidden");
  };
}

function deleteTeam(id) {
  if (!confirm("¿Eliminar este equipo?")) return;
  const tx = db.transaction([storeName], "readwrite");
  const store = tx.objectStore(storeName);
  store.delete(id).onsuccess = renderTeams;
}
