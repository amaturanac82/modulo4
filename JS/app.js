// js/app.js
import { GestorTareas } from "./gestorTareas.js";

const API_URL = "https://dummyjson.com/c/a67a-2f2d-4402-b94b";
const STORAGE_KEY = "taskflow_tareas";

const gestor = new GestorTareas({ storageKey: STORAGE_KEY, apiUrl: API_URL });

// DOM (app)
const formTarea = document.querySelector("#formTarea");
const txtDescripcion = document.querySelector("#txtDescripcion");
const txtFechaLimite = document.querySelector("#txtFechaLimite");
const btnCargar = document.querySelector("#btnCargar");
const listaTareas = document.querySelector("#listaTareas");
const alertas = document.querySelector("#alertas");
const txtBuscar = document.querySelector("#txtBuscar");

// DOM (modal)
const modalEditarEl = document.querySelector("#modalEditar");
const formEditar = document.querySelector("#formEditar");
const editId = document.querySelector("#editId");
const editDescripcion = document.querySelector("#editDescripcion");
const editFechaLimite = document.querySelector("#editFechaLimite");

// Instancia del modal (Bootstrap)
const modalEditar = new bootstrap.Modal(modalEditarEl);

// UI helpers
function mostrarAlerta(mensaje, tipo = "info") {
  alertas.innerHTML = `
    <div class="alert alert-${tipo} py-2" role="alert">
      ${mensaje}
    </div>
  `;
  setTimeout(() => (alertas.innerHTML = ""), 2000);
}

function notificarEn2Segundos(mensaje) {
  setTimeout(() => mostrarAlerta(mensaje, "info"), 2000);
}

// Date helpers
function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Countdown helpers
function msAFormato(ms) {
  if (ms <= 0) return "Vencida";

  const totalSeg = Math.floor(ms / 1000);
  const dias = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const min = Math.floor((totalSeg % 3600) / 60);
  const seg = totalSeg % 60;

  if (dias > 0) return `${dias}d ${horas}h ${min}m ${seg}s`;
  if (horas > 0) return `${horas}h ${min}m ${seg}s`;
  if (min > 0) return `${min}m ${seg}s`;
  return `${seg}s`;
}

function actualizarCountdowns() {
  const ahora = Date.now();

  gestor.getAll().forEach((t) => {
    if (!t.fechaLimite) return;

    const el = document.querySelector(`[data-countdown-id="${t.id}"]`);
    if (!el) return;

    const ms = new Date(t.fechaLimite).getTime() - ahora;
    el.textContent = `Faltan: ${msAFormato(ms)}`;
  });
}

// Render
function renderTareas(tareasParaMostrar) {
  listaTareas.innerHTML = "";

  tareasParaMostrar.forEach((t) => {
    const li = document.createElement("li");
    li.className = `list-group-item d-flex justify-content-between align-items-center ${
      t.estado ? "tarea-completa" : ""
    }`;

    const countdownHtml = t.fechaLimite
      ? `<small class="text-muted" data-countdown-id="${t.id}">Calculando...</small>`
      : `<small class="text-muted">Sin fecha límite</small>`;

    li.innerHTML = `
      <div class="me-2">
        <div>${t.descripcion}</div>
        ${countdownHtml}
      </div>

      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" data-accion="edit" data-id="${t.id}">
          Editar
        </button>
        <button class="btn btn-outline-success" data-accion="toggle" data-id="${t.id}">
          ${t.estado ? "Desmarcar" : "Completar"}
        </button>
        <button class="btn btn-outline-danger" data-accion="delete" data-id="${t.id}">
          Eliminar
        </button>
      </div>
    `;

    listaTareas.appendChild(li);
  });

  actualizarCountdowns();
}

function aplicarFiltroYRender() {
  const filtradas = gestor.filterByText(txtBuscar.value);
  renderTareas(filtradas);
}

// API
async function cargarTareasDesdeApi() {
  try {
    mostrarAlerta("Cargando tareas desde la API...", "warning");
    await gestor.fetchFromApi();
    aplicarFiltroYRender();
    mostrarAlerta(`Listo: cargadas ${gestor.getAll().length} tareas.`, "success");
  } catch (error) {
    mostrarAlerta("Error cargando tareas. Revisa tu conexión o la consola.", "danger");
    console.error(error);
  }
}

// Abrir modal con datos
function abrirModalEdicion(id) {
  const tarea = gestor.getAll().find((t) => t.id === id);
  if (!tarea) return;

  editId.value = String(tarea.id);
  editDescripcion.value = tarea.descripcion;
  editFechaLimite.value = toDatetimeLocalValue(tarea.fechaLimite);

  modalEditar.show();
  setTimeout(() => editDescripcion.focus(), 0);
}

// Eventos
btnCargar.addEventListener("click", cargarTareasDesdeApi);
txtBuscar.addEventListener("keyup", aplicarFiltroYRender);

// submit: agregar tarea (retardo + fecha límite opcional)
formTarea.addEventListener("submit", (event) => {
  event.preventDefault();

  const descripcion = txtDescripcion.value.trim();
  if (!descripcion) {
    mostrarAlerta("Escribe una descripción primero.", "danger");
    return;
  }

  const fechaLimite = txtFechaLimite.value
    ? new Date(txtFechaLimite.value).toISOString()
    : null;

  mostrarAlerta("Agregando tarea (simulando retardo)...", "warning");

  setTimeout(() => {
    gestor.add(descripcion, fechaLimite);
    aplicarFiltroYRender();

    txtDescripcion.value = "";
    txtFechaLimite.value = "";

    mostrarAlerta("Tarea agregada.", "success");
    notificarEn2Segundos("Tip: si agregas fecha límite verás un contador.");
  }, 600);
});

// click (delegación): abrir modal / toggle / delete
listaTareas.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;

  const accion = btn.dataset.accion;
  const id = Number(btn.dataset.id);

  if (accion === "edit") {
    abrirModalEdicion(id);
  }

  if (accion === "toggle") {
    gestor.toggle(id);
    aplicarFiltroYRender();
  }

  if (accion === "delete") {
    gestor.remove(id);
    aplicarFiltroYRender();
    mostrarAlerta("Tarea eliminada.", "info");
  }
});

// submit del modal: guardar cambios
formEditar.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = Number(editId.value);
  const desc = editDescripcion.value.trim();
  if (!desc) {
    mostrarAlerta("La descripción no puede quedar vacía.", "danger");
    return;
  }

  const fechaIso = editFechaLimite.value
    ? new Date(editFechaLimite.value).toISOString()
    : null;

  gestor.updateDescripcion(id, desc);
  gestor.updateFechaLimite(id, fechaIso);

  aplicarFiltroYRender();
  mostrarAlerta("Tarea actualizada.", "success");

  modalEditar.hide();
});

// Mouseover/mouseout
listaTareas.addEventListener("mouseover", (event) => {
  const li = event.target.closest("li");
  if (!li) return;
  li.classList.add("bg-warning-subtle");
});

listaTareas.addEventListener("mouseout", (event) => {
  const li = event.target.closest("li");
  if (!li) return;
  li.classList.remove("bg-warning-subtle");
});

// Init
(function init() {
  if (gestor.load()) {
    aplicarFiltroYRender();
    mostrarAlerta("Tareas cargadas desde localStorage.", "info");
  }
})();

// setInterval: contador regresivo
setInterval(actualizarCountdowns, 1000);
