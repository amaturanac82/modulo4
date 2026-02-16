import { Tarea } from "./tarea.js";

export class GestorTareas {
  constructor({ storageKey = "taskflow_tareas", apiUrl } = {}) {
    this.storageKey = storageKey;
    this.apiUrl = apiUrl;
    this.tareas = [];
  }

  static fromApiItem(item) {
    return new Tarea({
      id: item.id,
      descripcion: item.todo ?? item.title ?? "(Sin título)",
      estado: Boolean(item.completed),
      fechaCreacion: new Date().toISOString(),
      userId: item.userId ?? 1,
      fechaLimite: item.fechaLimite ?? null,
    });
  }

  static fromStorageItem(item) {
    return new Tarea({
      id: item.id,
      descripcion: item.descripcion,
      estado: Boolean(item.estado),
      fechaCreacion: item.fechaCreacion ?? new Date().toISOString(),
      userId: item.userId ?? 1,
      fechaLimite: item.fechaLimite ?? null,
    });
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tareas));
  }

  load() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return false;

      this.tareas = parsed.map(GestorTareas.fromStorageItem);
      return true;
    } catch (e) {
      console.error("JSON inválido en localStorage", e);
      return false;
    }
  }

  async fetchFromApi() {
    const res = await fetch(this.apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const data = await res.json();

    // Soporta: [...], {todos:[...]}, {tasks:[...]}, y tu caso {Tareas:[...]}
    const lista = Array.isArray(data)
      ? data
      : (data.tasks ?? data.Tareas ?? data.todos ?? []);

    if (!Array.isArray(lista)) {
      throw new Error("Formato inválido: no llegó un array en tasks/Tareas/todos");
    }

    this.tareas = lista.map(GestorTareas.fromApiItem);
    this.save();
    return this.tareas;
  }

  getAll() {
    return this.tareas;
  }

  filterByText(q) {
    const query = q.toLowerCase().trim();
    if (!query) return this.tareas;
    return this.tareas.filter((t) => t.descripcion.toLowerCase().includes(query));
  }

  add(descripcion, fechaLimite = null) {
    const tarea = new Tarea({
      id: Date.now(),
      descripcion,
      estado: false,
      fechaCreacion: new Date().toISOString(),
      userId: 1,
      fechaLimite,
    });

    this.tareas = [tarea, ...this.tareas];
    this.save();
    return tarea;
  }

  toggle(id) {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return false;

    tarea.toggleEstado();
    this.save();
    return true;
  }

  updateDescripcion(id, nuevaDescripcion) {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return false;

    tarea.setDescripcion(nuevaDescripcion);
    this.save();
    return true;
  }

  updateFechaLimite(id, fechaLimite = null) {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return false;

    tarea.fechaLimite = fechaLimite;
    this.save();
    return true;
  }

  remove(id) {
    const before = this.tareas.length;
    this.tareas = this.tareas.filter((t) => t.id !== id);
    this.save();
    return this.tareas.length !== before;
  }
}
