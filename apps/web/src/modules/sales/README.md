# Gestión de Ventas

CU7 dispensadores, CU11 ventas y CU12 descuentos.

Paquete reservado para un ciclo posterior. No expone rutas ni operaciones funcionales.

- presentation: pantallas/DTO/controladores del paquete.
- application: casos de uso y coordinación.
- domain: reglas y contratos propios.
- infrastructure: adaptadores de persistencia o HTTP.

Reportes consultará contratos públicos de Inventario, Compras y Ventas. No escribirá sus tablas.
