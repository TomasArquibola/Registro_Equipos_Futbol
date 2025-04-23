
const DB_NAME = "RegistroMundial";
const DB_VERSION = 1;
const STORE_NAME = "selecciones";
let db = null;

document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = () => alert("IndexedDB no disponible");
  request.onsuccess = e => {
    db = e.target.result;
    cargarEquipos();
  };

  request.onupgradeneeded = e => {
    db = e.target.result;
    const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    store.createIndex("confederacion", "confederacion", { unique: false });
    store.createIndex("grupo", "grupo", { unique: false });
  };

  document.querySelector("#registro-form").addEventListener("submit", guardarDatos);
  document.querySelector("#cancelar").addEventListener("click", reiniciarFormulario);
  document.querySelector("#nuevo").addEventListener("click", () => alternarFormulario(true));
});

function guardarDatos(e) {
  e.preventDefault();

  const equipo = {
    pais: document.getElementById("pais").value,
    confederacion: document.getElementById("confederacion").value,
    grupo: document.getElementById("grupo").value,
    tecnico: document.getElementById("tecnico").value,
    debut: parseInt(document.getElementById("debut").value),
    apariciones: parseInt(document.getElementById("apariciones").value),
    logro: document.getElementById("logro").value,
    escudo: document.getElementById("escudo").value,
    bandera: document.getElementById("bandera").value
  };

  const id = document.getElementById("id").value;
  const trans = db.transaction([STORE_NAME], "readwrite");
  const store = trans.objectStore(STORE_NAME);
  const req = id ? store.put({ ...equipo, id: parseInt(id) }) : store.add(equipo);

  req.onsuccess = () => {
    cargarEquipos();
    reiniciarFormulario();
  };
}

function reiniciarFormulario() {
  document.querySelector("#registro-form").reset();
  document.getElementById("id").value = "";
  alternarFormulario(false);
}

function alternarFormulario(mostrar) {
  document.querySelector("#panel-registro").style.display = mostrar ? "block" : "none";
  document.querySelector("#panel-listado").style.display = mostrar ? "none" : "block";
}

function cargarEquipos() {
  const trans = db.transaction([STORE_NAME], "readonly");
  const store = trans.objectStore(STORE_NAME);
  const req = store.getAll();

  req.onsuccess = () => {
    const datos = req.result;
    const cuerpo = document.getElementById("contenido-tabla");
    cuerpo.innerHTML = "";

    if (!datos.length) {
      cuerpo.innerHTML = "<tr><td colspan='10'>No hay datos disponibles</td></tr>";
      return;
    }

    datos.forEach(e => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${e.pais}</td>
        <td>${e.confederacion}</td>
        <td>${e.grupo}</td>
        <td>${e.tecnico}</td>
        <td>${e.debut}</td>
        <td>${e.apariciones}</td>
        <td>${e.logro}</td>
        <td><img src="${e.escudo}" width="30"></td>
        <td><img src="${e.bandera}" width="30"></td>
        <td>
          <button onclick="editar(${e.id})">✏️</button>
          <button onclick="eliminar(${e.id})">🗑️</button>
        </td>`;
      cuerpo.appendChild(fila);
    });
  };
}

function editar(id) {
  const trans = db.transaction([STORE_NAME], "readonly");
  const store = trans.objectStore(STORE_NAME);
  const req = store.get(id);

  req.onsuccess = () => {
    const d = req.result;
    document.getElementById("id").value = d.id;
    document.getElementById("pais").value = d.pais;
    document.getElementById("confederacion").value = d.confederacion;
    document.getElementById("grupo").value = d.grupo;
    document.getElementById("tecnico").value = d.tecnico;
    document.getElementById("debut").value = d.debut;
    document.getElementById("apariciones").value = d.apariciones;
    document.getElementById("logro").value = d.logro;
    document.getElementById("escudo").value = d.escudo;
    document.getElementById("bandera").value = d.bandera;
    alternarFormulario(true);
  };
}

function eliminar(id) {
  if (!confirm("¿Eliminar este equipo?")) return;
  const trans = db.transaction([STORE_NAME], "readwrite");
  trans.objectStore(STORE_NAME).delete(id).onsuccess = cargarEquipos;
}
