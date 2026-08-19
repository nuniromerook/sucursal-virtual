import React from "react";
import EnvioNavbar from "../../components/EnvioNavbar";
import SearchInput from "../../components/SearchInput";
import { categories } from "../../assets/assets.js";

export default function Home() {
  const products = [
    {
      id: 1,
      name: "Asado de Tira",
      slug: "asado-de-tira",
      imageSrc:
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
      imageAlt: "Asado de tira vacuno",
      price: 8500,
      unidad_medida: "Kg",
      stockFrom: 1.2,
    },
    {
      id: 2,
      name: "Pechuga de Pollo",
      slug: "pechuga-de-pollo",
      imageSrc:
        "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=800",
      imageAlt: "Pechuga de pollo fresca",
      price: 4200,
      unidad_medida: "Kg",
      stockFrom: 0.9,
    },
    {
      id: 3,
      name: "Vacío de Ternera",
      slug: "vacio-de-ternera",
      imageSrc:
        "https://dcdn-us.mitiendanube.com/stores/002/558/768/products/ingredientes-del-vacio-de-ternera-a-la-plancha1-6c82cdd03849e7fc6a16908073107018-480-0.webp",
      imageAlt: "Vacío de ternera",
      price: 17200,
      unidad_medida: "Kg",
      stockFrom: 2.1,
    },
  ];

  return (
    <div className="w-full bg-gray-50/50 min-h-screen">
      {/* Header Mobile */}
      <div className="flex flex-col lg:hidden">
        <div className="bg-main-blue pt-4 pb-2 px-4">
          <EnvioNavbar />
        </div>
        <div className="py-4 w-11/12 mx-auto">
          <SearchInput />
        </div>
      </div>

      {/* Banners Promocionales */}
      <div className="w-full">
        <img
          src="/dummy-promo-mobile.jpg"
          alt="Promoción Abastecedora Valette"
          className="flex lg:hidden w-11/12 mx-auto aspect-[12/4] object-cover rounded-xl shadow-sm"
        />
        <img
          src="/dummy-promo-desktop.jpg"
          alt="Promoción Abastecedora Valette"
          className="hidden lg:flex w-full h-[380px] object-cover object-center"
        />
      </div>

      {/* SECCIÓN DE PRODUCTOS DESTACADOS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
          Productos destacados
        </h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {products.map((product) => (
            <div key={product.id} className="group relative flex flex-col">
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-200 group-hover:opacity-90 transition-opacity">
                <img
                  alt={product.imageAlt}
                  src={product.imageSrc}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="mt-3 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    <a href={`/producto/${product.slug}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </a>
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Disponible desde {product.stockFrom} {product.unidad_medida}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  ${product.price.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN DE CATEGORÍAS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Categorías
          </h2>
        </div>

        {/* Grid consistente con productos */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {categories.map((category, index) => (
            <a
              key={index}
              href={`/categoria/${category.nameId?.toLowerCase() || ""}`}
              className="group relative flex aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all hover:shadow-md"
            >
              {/* Imagen de fondo */}
              <img
                src={category.image}
                alt={category.name || category.nameId}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />

              {/* Sombra gradual solo en la parte inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Nombre de la categoría */}
              <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end">
                <span className="text-base sm:text-lg font-bold text-white uppercase tracking-wide group-hover:text-blue-200 transition-colors">
                  {category.nameId || category.name}
                </span>
                <span className="text-xs text-gray-300 font-medium">
                  Ver productos →
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
