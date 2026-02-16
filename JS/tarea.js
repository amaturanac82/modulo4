// js/tarea.js
export class Tarea {
  constructor({
    id,
    descripcion,
    estado = false,
    fechaCreacion = new Date().toISOString(),
    userId = 1,
    fechaLimite = null,
  }) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.userId = userId;
    this.fechaLimite = fechaLimite;
  }

  toggleEstado() {
    this.estado = !this.estado;
  }

  setDescripcion(nuevaDescripcion) {
    this.descripcion = nuevaDescripcion;
  }
}
