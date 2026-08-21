import { ChevronRight, Info } from "lucide-react";

const product = {
  name: "Paleta de Cerdo",
  price: 7500,
  lastPrice: 6500,
  href: "#",
  breadcrumbs: [
    { id: 1, name: "Inicio", href: "/" },
    { id: 2, name: "Cerdo", href: "/cerdo" }, //TODO: hacer link dinamico
  ],
  image: {
    src: "https://www.proveeduriapiaf.com.ar/wp-content/uploads/5K4A9827.jpg",
    alt: "Two each of gray, white, and black shirts laying flat.",
  },
  presentaciones: [
    {
      id: "milanesa",
      name: "Milanesa",
      price: 300,
      default: true,
    },
    {
      id: "churrasco",
      name: "Churrasco",
      price: 300,
      default: false,
    },
    {
      id: "bife",
      name: "Bife",
      price: 300,
      default: false,
    },
  ],
  paquetes: [
    { id: 1, value: 1.53, reservado: false },
    { id: 2, value: 1.95, reservado: false },
    { id: 3, value: 2.2, reservado: false },
    { id: 4, value: 2.68, reservado: false },
    { id: 5, value: 3.53, reservado: false },
    { id: 6, value: 4.32, reservado: true },
    { id: 7, value: 5.67, reservado: true },
    { id: 8, value: 6.24, reservado: true },
  ],
  description:
    'The Basic Tee 6-Pack allows you to fully express your vibrant personality with three grayscale options. Feeling adventurous? Put on a heather gray tee. Want to be a trendsetter? Try our exclusive colorway: "Black". Need to add an extra pop of color to your outfit? Our white tee has you covered.',
  highlights: [
    "Hand cut and sewn locally",
    "Dyed with our proprietary colors",
    "Pre-washed & pre-shrunk",
    "Ultra-soft 100% cotton",
  ],
  details:
    'The 6-Pack includes two black, two white, and two heather gray Basic Tees. Sign up for our subscription service and be the first to get new, exciting colors, like our upcoming "Charcoal Gray" limited release.',
};

export default function Example() {
  return (
    <div className="bg-white">
      <div className="flex flex-col pt-6 lg:max-w-7xl gap-4 p-4 mx-auto">
        <nav aria-label="Breadcrumb">
          <ol role="list" className="flex items-center">
            {product.breadcrumbs.map((breadcrumb) => (
              <li key={breadcrumb.id}>
                <div className="flex items-center">
                  <a
                    href={breadcrumb.href}
                    className="text-sm lg:text-base font-medium text-gray-900"
                  >
                    {breadcrumb.name}
                  </a>
                  <ChevronRight className="size-4 shrink-0 text-gray-400 mx-1" />
                </div>
              </li>
            ))}
            <li className="text-sm lg:text-base">
              <a
                href={product.href}
                aria-current="page"
                className="font-medium text-gray-500 hover:text-gray-600"
              >
                {product.name}
              </a>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Image gallery */}
          <div className="flex lg:col-span-1">
            <img
              alt={product.image.alt}
              src={product.image.src}
              className="rounded-lg w-full object-cover aspect-square h-fit"
            />
          </div>

          <div className="flex flex-col lg:col-span-2">
            <div className="flex flex-col">
              <div className="flex w-full flex-col lg:flex-row gap-8">
                {/* Nombre y precio */}
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl whitespace-nowrap">
                    {product.name}
                  </h1>

                  {/* Precio */}
                  <div className="flex flex-row gap-4 whitespace-nowrap">
                    <p className="text-3xl tracking-tight text-gray-900">
                      $ {product.price.toLocaleString("es-AR")} /kg
                    </p>

                    {/* Precio anterior (tachado) */}
                    <p className="mt-auto tracking-tight text-gray-500 line-through ">
                      $ {product.lastPrice.toLocaleString("es-AR")} /kg
                    </p>
                  </div>
                </div>

                {/* Presentaciones */}
                <fieldset className="flex flex-col w-full space-y-3 mt-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    Elegir presentación
                  </h3>

                  <div className="flex w-full gap-2">
                    {product.presentaciones.map((presentacion) => (
                      <label
                        key={presentacion.id}
                        htmlFor={presentacion.name}
                        className="flex flex-col lg:flex-row lg:px-4 w-full items-center justify-between rounded border border-gray-300 bg-white py-2 text-sm font-medium transition-colors hover:bg-gray-50 has-checked:ring-1 has-checked:ring-offset-1 has-checked:ring-main-blue"
                      >
                        <p className="text-gray-700">{presentacion.name}</p>

                        <p className="text-gray-500">
                          + ${presentacion.price.toLocaleString("es-AR")}
                        </p>

                        <input
                          type="radio"
                          name="DeliveryOption"
                          value={presentacion.name}
                          id={presentacion.name}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <form className="mt-2 lg:mt-11">
                {/* Paquetes */}
                <div className="mt-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Stock disponible
                    </h3>
                    <button type="button">
                      <Info className="size-4 shrink-0 text-neutral-400" />
                    </button>
                  </div>

                  <fieldset aria-label="Elegir paquete" className="mt-4">
                    <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
                      {product.paquetes.map((paquete) => (
                        <label
                          key={paquete.id}
                          aria-label={paquete.value}
                          type="button"
                          disabled={paquete.reservado}
                          className="group relative flex items-center justify-center rounded-md border border-gray-300 bg-white p-3 has-checked:bg-main-blue hover:bg-main-blue/10 has-checked:bg-main-blue has-disabled:border-gray-400 has-disabled:bg-gray-200 has-disabled:opacity-25 "
                        >
                          <input
                            defaultValue={paquete.value}
                            defaultChecked={
                              paquete.value === product.paquetes[0].value
                            }
                            name="size"
                            type="radio"
                            disabled={paquete.reservado}
                            className="absolute inset-0 appearance-none focus:outline-none disabled:cursor-not-allowed"
                          />
                          <span className="text-sm font-medium text-gray-900 group-has-checked:text-white">
                            {paquete.value} kg
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <button
                  type="submit"
                  className="mt-10 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
                >
                  Add to bag
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          {/* Options */}

          <div className="py-10 lg:pt-6 lg:pb-16">
            {/* Description and details */}
            <div>
              <h3 className="sr-only">Description</h3>

              <div className="space-y-6">
                <p className="text-base text-gray-900">{product.description}</p>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-sm font-medium text-gray-900">Highlights</h3>

              <div className="mt-4">
                <ul role="list" className="list-disc space-y-2 pl-4 text-sm">
                  {product.highlights.map((highlight) => (
                    <li key={highlight} className="text-gray-400">
                      <span className="text-gray-600">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-sm font-medium text-gray-900">Details</h2>

              <div className="mt-4 space-y-6">
                <p className="text-sm text-gray-600">{product.details}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
