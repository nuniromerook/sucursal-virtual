import React from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * Breadcrumb dinámico basado en la ruta actual.
 *
 * No sabe nada de "catálogo" ni de "producto" — solo arma las migas según
 * un array de configuración (`routes`) que le pasás. Así el mismo
 * componente sirve para el admin y para la ecommerce: cada app define su
 * propio archivo de rutas (ver breadcrumbRoutes.js) y lo pasa acá.
 *
 * @param {Object}   props
 * @param {Array}    props.routes      - [{ path: "/catalogo/editar/:id", crumbs: (ctx) => [...] }]
 * @param {Object}   [props.extra]     - datos dinámicos (ej: nombre real del producto)
 *                                       disponibles como ctx.extra dentro de cada crumbs()
 * @param {string}   [props.homeLabel] - texto de la primera miga (default "Inicio")
 * @param {string}   [props.homeHref]  - link de la primera miga (default "/")
 */
const Breadcrumb = ({
  routes = [],
  extra = {},
  homeLabel = "Inicio",
  homeHref = "/",
}) => {
  const location = useLocation();

  const matchedRoute = routes.find((route) =>
    matchPath({ path: route.path, end: true }, location.pathname),
  );

  const match = matchedRoute
    ? matchPath({ path: matchedRoute.path, end: true }, location.pathname)
    : null;

  const dynamicCrumbs = matchedRoute
    ? matchedRoute.crumbs({ params: match.params, extra })
    : [];

  const crumbs = [{ name: homeLabel, href: homeHref }, ...dynamicCrumbs];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 p-4">
        <Home className="size-4 shrink-0 text-gray-900 mx-1" />
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${crumb.name}-${index}`} className="flex items-center">
              {isLast || !crumb.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="text-sm lg:text-base font-medium text-gray-500"
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-sm lg:text-base font-medium text-gray-900 transition-colors hover:text-gray-700"
                >
                  {crumb.name}
                </Link>
              )}

              {!isLast && (
                <ChevronRight className="size-4 shrink-0 text-gray-400 mx-1" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
