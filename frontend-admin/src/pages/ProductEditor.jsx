import React, { useState } from "react";
import Input from "../components/ui/Input";
import TextArea from "../components/ui/TextArea";
import BasicDropdown from "../components/ui/BasicDropdown";
import ButtonLoader from "../components/ui/ButtonLoader";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ProductEditor = () => {
  const [formValues, setFormValues] = useState({
    activo: true,
    nombre_producto: "",
    slug: "",
    especie: "vacuno",
    categoria: "cortes",
    descripcion: "",
    proteinas: "",
    calorias: "",
    grasas: "",
    imagen_url: "",
    unidad_medida: "kilogramo",
    destacado: false,
  });

  const { isLoading, setIsLoading, navigate } = useAppContext();

  const itemsEspecie = [
    { value: "vacuno", label: "Vacuno" },
    { value: "cerdo", label: "Cerdo" },
    { value: "pollo", label: "Pollo" },
  ];

  const itemsCategoria = [
    { value: "media", label: "Media" },
    { value: "troceos", label: "Troceos" },
    { value: "cortes", label: "Cortes" },
    { value: "embutidos", label: "Embutidos" },
    { value: "preparados", label: "Preparados" },
    { value: "achuras", label: "Achuras" },
    { value: "despensa", label: "Despensa" },
  ];

  const itemsUnidadMedida = [
    { value: "kilogramo", label: "Kilogramo" },
    { value: "unidad", label: "Unidad" },
    { value: "gancho", label: "Gancho" },
    { value: "paquete", label: "Paquete" },
    { value: "caja", label: "Caja" },
    { value: "cajon", label: "Cajón" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formValues);

    setIsLoading(true);

    const res = await fetch("http://localhost:3000/products", {
      method: "POST",
      body: JSON.stringify(formValues),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log(data);

    setIsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-y-4 lg:gap-y-8 p-2 lg:p-4">
        <nav aria-label="Breadcrumb" className="flex items-center h-fit w-full">
          <ol className="flex items-center gap-1 text-sm text-gray-700">
            <li>
              <Link
                to="/"
                className="block transition-colors hover:text-gray-900"
              >
                Inicio
              </Link>
            </li>

            <li>
              <ChevronRight className="stroke-1 shrink-0 text-neutral-700 size-5" />
            </li>

            <li>
              <Link
                to="/catalogo"
                className="block transition-colors hover:text-gray-900"
              >
                Catálogo
              </Link>
            </li>

            <li>
              <ChevronRight className="stroke-1 shrink-0 text-neutral-700 size-5" />
            </li>

            <li>
              <Link
                to="/catalogo/nuevo-producto"
                className="block transition-colors hover:text-gray-900"
              >
                Nuevo producto
              </Link>
            </li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">
          Nuevo producto - ID: #1
        </h1>

        <form
          id="product-editor-form"
          className="rounded-lg border border-gray-200 bg-white p-6"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center w-full justify-between">
            <h2 className="hidden sm:block text-lg font-bold text-gray-900">
              Información del nuevo producto
            </h2>

            <li className="flex items-center justify-between gap-4 ml-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                Estado:
                <p
                  className={`inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-white ${
                    formValues.productActive ? "bg-emerald-700" : "bg-red-700"
                  }`}
                >
                  <span className="text-sm whitespace-nowrap">
                    {formValues.productActive ? "Activo" : "Inactivo"}
                  </span>
                </p>
              </div>

              <label
                htmlFor="productActive"
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-gray-200 transition has-checked:bg-main-blue"
              >
                <input
                  type="checkbox"
                  id="productActive"
                  name="productActive"
                  className="peer sr-only"
                  checked={formValues.activo}
                  onChange={handleChange}
                />

                <span className="size-4 translate-x-1 rounded-full bg-white transition peer-checked:translate-x-6"></span>
              </label>
            </li>
          </div>

          <div className="flex flex-col mt-6 gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                label="Nombre del producto"
                id="productName"
                inputName="productName"
                inputType="text"
                autoComplete="productName"
                placeholder="Bife Ancho"
                value={formValues.nombre_producto}
                setOnChange={handleChange}
              />

              <Input
                label="Slug (URL)"
                id="productSlug"
                inputName="productSlug"
                inputType="text"
                autoComplete="productSlug"
                placeholder="bife-ancho"
                value={formValues.slug}
                setOnChange={handleChange}
              />

              <BasicDropdown
                label="Especie:"
                id="productEspecie"
                items={itemsEspecie}
                value={formValues.especie}
                setOnChange={handleChange}
              />

              <BasicDropdown
                label="Categoría:"
                id="productCategoria"
                items={itemsCategoria}
                value={formValues.categoria}
                setOnChange={handleChange}
              />

              <BasicDropdown
                label="Unidad de medida:"
                id="productUnidadMedida"
                items={itemsUnidadMedida}
                value={formValues.unidad_medida}
                setOnChange={handleChange}
              />
            </div>

            <TextArea
              label="Descripción del producto"
              id="productDescription"
              inputName="productDescription"
              autoComplete="productDescription"
              placeholder="Agregá una descripción corta"
              classNames={`col-span-2 ${isLoading && "bg-gray-100"}`}
              value={formValues.descripcion}
              setOnChange={handleChange}
            />

            <div className="flex flex-col md:flex-row gap-4">
              <Input
                label="Proteínas (g) (cada 100gr)"
                id="productProteins"
                inputName="productProteins"
                inputType="number"
                autoComplete="productProteins"
                placeholder="20"
                value={formValues.proteinas}
                setOnChange={handleChange}
              />

              <Input
                label="Calorías (kcal) (cada 100gr)"
                id="productCalories"
                inputName="productCalories"
                inputType="number"
                autoComplete="productCalories"
                placeholder="205"
                value={formValues.calorias}
                setOnChange={handleChange}
              />

              <Input
                label="Grasas (g) (cada 100gr)"
                id="productFats"
                inputName="productFats"
                inputType="number"
                autoComplete="productFats"
                placeholder="13"
                value={formValues.grasas}
                setOnChange={handleChange}
              />
            </div>

            <div>
              <li className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Destacar producto
                  </p>
                  <p className="text-xs text-gray-600">
                    Si el producto se marca como destacado, se mostrará con
                    prioridad en la página principal.
                  </p>
                </div>

                <label
                  htmlFor="productFeatured"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-gray-200 transition has-checked:bg-main-blue"
                >
                  <input
                    type="checkbox"
                    id="productFeatured"
                    name="productFeatured"
                    className="peer sr-only"
                    checked={formValues.destacado}
                    onChange={handleChange}
                  />

                  <span className="size-4 translate-x-1 rounded-full bg-white transition peer-checked:translate-x-6"></span>
                </label>
              </li>
            </div>
          </div>

          <label
            htmlFor="Images"
            className="flex flex-col items-center rounded-md border border-gray-200 p-4 text-gray-900 sm:p-6 mt-4"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"
              />
            </svg>

            <span className="mt-4 font-medium">Subir imágen del producto</span>

            <span className="mt-2 inline-block rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-100">
              Buscar en la bibloteca
            </span>

            <input
              multiple
              type="file"
              accept="image/*"
              id="Images"
              className="sr-only"
            />
          </label>

          <ButtonLoader
            value="Guardar producto"
            loadingValue="Guardando el producto..."
            classNames="w-full bg-emerald-700 transition hover:bg-emerald-600 text-white text-lg mt-6"
            loaderColor="text-white"
            buttonType="submit"
            isLoading={isLoading}
          />
        </form>

        <div className="rounded-lg border border-red-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Ajustes delicados</h2>

          <p className="mt-2 text-sm text-gray-600">
            Eliminar el producto eliminará todas sus variaciones y podría
            afectar al stock actual. <br /> Es recomendable desactivar el
            producto.
          </p>

          <button
            type="button"
            className="mt-4 inline-block rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Eliminar producto del catálogo
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductEditor;
