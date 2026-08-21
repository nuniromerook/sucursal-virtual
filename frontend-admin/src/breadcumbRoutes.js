// Define, para cada patrón de ruta del admin, qué migas de pan mostrar
// después de "Inicio". Usa los mismos patrones que App.jsx.
export const ADMIN_BREADCRUMB_ROUTES = [
  {
    path: "/catalogo",
    crumbs: () => [{ name: "Catálogo" }],
  },
  {
    path: "/catalogo/nuevo-producto",
    crumbs: () => [
      { name: "Catálogo", href: "/catalogo" },
      { name: "Nuevo producto" },
    ],
  },
  {
    path: "/catalogo/editar/:id",
    // extra.productName lo setea ProductEditor una vez que trae el
    // producto por su slug/id. Mientras carga, muestra el genérico.
    crumbs: ({ extra }) => [
      { name: "Catálogo", href: "/catalogo" },
      {
        name: extra.productName
          ? `Editar producto - ${extra.productName}`
          : "Editar producto",
      },
    ],
  },
  {
    path: "/sucursal/:id",
    crumbs: ({ extra }) => [
      { name: "Sucursal", href: "/sucursales" },
      {
        name: extra.sucursalName ? `${extra.sucursalName}` : "Sucursal",
      },
    ],
  },
  {
    path: "/sucursal/:id/stock",
    crumbs: ({ extra }) => [
      { name: "Sucursal", href: "/sucursales" },
      {
        name: extra.sucursalName ? `${extra.sucursalName}` : "Sucursal",
      },
      { name: "Stock" },
    ],
  },
  {
    path: "/sucursal/:id/stock/:catalogoProducto/paquetes",
    crumbs: ({ extra }) => [
      { name: "Sucursal", href: "/sucursales" },
      {
        name: extra.sucursalName ? `${extra.sucursalName}` : "Sucursal",
      },
      { name: "Stock" },
      { name: `${extra.productName}` },
    ],
  },
  {
    path: "/sucursal/:id/empleados",
    crumbs: ({ extra }) => [
      { name: "Sucursal", href: "/sucursales" },
      {
        name: extra.sucursalName ? `${extra.sucursalName}` : "Sucursal",
      },
      { name: "Empleados" },
    ],
  },
  {
    path: "/sucursal/:id/ajustes",
    crumbs: ({ extra }) => [
      { name: "Sucursal", href: "/sucursales" },
      {
        name: extra.sucursalName ? `${extra.sucursalName}` : "Sucursal",
      },
      { name: "Ajustes" },
    ],
  },
  {
    path: "/sucursales/nueva",
    crumbs: () => [{ name: "Sucursales" }, { name: "Nueva sucursal" }],
  },
  {
    path: "/sucursales/editar/:id",
    crumbs: ({ extra }) => [
      { name: "Sucursales" },
      {
        name: extra.sucursalName ? `${extra.sucursalName}` : "Sucursal",
        href: `/sucursal/${extra.slug}`,
      },
      { name: "Editar sucursal" },
    ],
  },
  {
    path: "/nuevo-pedido",
    crumbs: () => [{ name: "Nuevo pedido" }],
  },
  {
    path: "/historial-pedidos",
    crumbs: () => [{ name: "Historial de pedidos" }],
  },
  {
    path: "/gestionar-usuarios",
    crumbs: () => [{ name: "Gestionar usuarios" }],
  },
];
