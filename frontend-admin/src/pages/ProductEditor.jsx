import React, { useEffect, useState } from "react";
import Input from "../components/ui/Input";
import TextArea from "../components/ui/TextArea";
import BasicDropdown from "../components/ui/BasicDropdown";
import ButtonLoader from "../components/ui/ButtonLoader";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

import { API_URL } from "../config/api";

const ProductEditor = () => {
  const [formValues, setFormValues] = useState({
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
  });

  const { isLoading, setIsLoading, navigate, setNavbarTitle } = useAppContext();

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

    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      body: JSON.stringify(formValues),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log(data);

    setIsLoading(false);
    navigate("/catalogo");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  useEffect(() => {
    setNavbarTitle("Nuevo producto");
  }, []);

  return (
    <>
      <div className="flex flex-col h-fit gap-y-4 lg:gap-y-8 p-4 lg:p-6">
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
          </div>

          <div className="flex flex-col mt-6 gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                label="Nombre del producto"
                id="nombre_producto"
                inputName="nombre_producto"
                inputType="text"
                autoComplete="nombre_producto"
                placeholder="Bife Ancho"
                value={formValues.nombre_producto}
                setOnChange={handleChange}
              />

              <Input
                label="Slug (URL)"
                id="slug"
                inputName="slug"
                inputType="text"
                autoComplete="slug"
                placeholder="bife-ancho"
                value={formValues.slug}
                setOnChange={handleChange}
              />

              <BasicDropdown
                label="Especie:"
                id="especie"
                items={itemsEspecie}
                value={formValues.especie}
                setOnChange={handleChange}
              />

              <BasicDropdown
                label="Categoría:"
                id="categoria"
                items={itemsCategoria}
                value={formValues.categoria}
                setOnChange={handleChange}
              />

              <BasicDropdown
                label="Unidad de medida:"
                id="unidad_medida"
                items={itemsUnidadMedida}
                value={formValues.unidad_medida}
                setOnChange={handleChange}
              />
            </div>

            <TextArea
              label="Descripción del producto"
              id="descripcion"
              inputName="descripcion"
              autoComplete="descripcion"
              placeholder="Agregá una descripción corta"
              classNames={`col-span-2 ${isLoading && "bg-gray-100"}`}
              value={formValues.descripcion}
              setOnChange={handleChange}
            />

            <div className="flex flex-col md:flex-row gap-4">
              <Input
                label="Proteínas (g) (cada 100gr)"
                id="proteinas"
                inputName="proteinas"
                inputType="number"
                autoComplete="proteinas"
                placeholder="20"
                value={formValues.proteinas}
                setOnChange={handleChange}
              />

              <Input
                label="Calorías (kcal) (cada 100gr)"
                id="calorias"
                inputName="calorias"
                inputType="number"
                autoComplete="calorias"
                placeholder="205"
                value={formValues.calorias}
                setOnChange={handleChange}
              />

              <Input
                label="Grasas (g) (cada 100gr)"
                id="grasas"
                inputName="grasas"
                inputType="number"
                autoComplete="grasas"
                placeholder="13"
                value={formValues.grasas}
                setOnChange={handleChange}
              />
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
