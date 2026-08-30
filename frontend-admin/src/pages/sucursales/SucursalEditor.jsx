import React, { useEffect, useState } from "react";
import Input from "../../components/ui/Input";
import ButtonLoader from "../../components/ui/ButtonLoader";
import { useAppContext } from "../../context/AppContext";
import { API_URL } from "../../config/api";
import { Store } from "lucide-react";

const SucursalEditor = () => {
  const [formValues, setFormValues] = useState({
    nombre: "",
    slug: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    horario_atencion: "",
    latitud: "",
    longitud: "",
  });

  const { isLoading, setIsLoading, navigate, setNavbarTitle } = useAppContext();

  useEffect(() => {
    setNavbarTitle("Nueva sucursal");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // Autocompleta el slug a partir del nombre mientras el usuario no lo haya
  // tocado a mano — mismo criterio que usás para productos, solo que ahí
  // lo cargás manual; acá te ahorra el paso mientras el nombre es simple.
  const handleNombreChange = (e) => {
    const { value } = e.target;

    setFormValues((prev) => ({
      ...prev,
      nombre: value,
      slug: prev.slugTouched
        ? prev.slug
        : value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // saca tildes
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleSlugChange = (e) => {
    const { value } = e.target;

    setFormValues((prev) => ({ ...prev, slug: value, slugTouched: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { slugTouched, ...payload } = formValues;

      const res = await fetch(`${API_URL}/sucursales`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.error) {
        console.error(data.error);
        return;
      }

      navigate(`/sucursal/${data.slug}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Encabezado en formato módulo ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-white border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 aspect-square rounded-lg bg-main-blue/10 flex items-center justify-center text-main-blue font-black shrink-0">
            <Store className="size-5" />
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg text-neutral-900 tracking-tight">
              Nueva Sucursal en la Red
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Registrá una nueva carnicería para habilitar comandas locales,
              control de stock y equipo.
            </p>
          </div>
        </div>
      </div>

      <form
        id="sucursal-editor-form"
        className="rounded-lg border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-2xs"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Nombre de la sucursal"
              id="nombre"
              inputName="nombre"
              inputType="text"
              autoComplete="off"
              placeholder="Ej: Luis Guillón"
              value={formValues.nombre}
              setOnChange={handleNombreChange}
              isRequired={true}
            />

            <Input
              label="Slug (URL)"
              id="slug"
              inputName="slug"
              inputType="text"
              autoComplete="off"
              placeholder="luis-guillon"
              value={formValues.slug}
              setOnChange={handleSlugChange}
              isRequired={true}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Dirección"
              id="direccion"
              inputName="direccion"
              inputType="text"
              autoComplete="off"
              placeholder="Av. Luciano Valette 3910"
              value={formValues.direccion}
              setOnChange={handleChange}
              isRequired={true}
            />

            <Input
              label="Ciudad"
              id="ciudad"
              inputName="ciudad"
              inputType="text"
              autoComplete="off"
              placeholder="Luis Guillón"
              value={formValues.ciudad}
              setOnChange={handleChange}
              isRequired={true}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Teléfono"
              id="telefono"
              inputName="telefono"
              inputType="text"
              autoComplete="off"
              placeholder="11 2345-6789"
              value={formValues.telefono}
              setOnChange={handleChange}
            />

            <Input
              label="Horario de atención"
              id="horario_atencion"
              inputName="horario_atencion"
              inputType="text"
              autoComplete="off"
              placeholder="Lun a sáb 7 a 15hs"
              value={formValues.horario_atencion}
              setOnChange={handleChange}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Latitud (opcional para cálculo de cobertura)"
              id="latitud"
              inputName="latitud"
              inputType="text"
              autoComplete="off"
              placeholder="-34.7963"
              value={formValues.latitud}
              setOnChange={handleChange}
            />

            <Input
              label="Longitud (opcional para cálculo de cobertura)"
              id="longitud"
              inputName="longitud"
              inputType="text"
              autoComplete="off"
              placeholder="-58.4448"
              value={formValues.longitud}
              setOnChange={handleChange}
            />
          </div>
        </div>

        <ButtonLoader
          value="Crear Sucursal"
          loadingValue="Guardando la sucursal..."
          classNames="w-full bg-main-blue transition hover:bg-main-blue/90 text-white font-bold text-sm rounded-lg py-3 mt-6 shadow-2xs cursor-pointer"
          loaderColor="text-white"
          buttonType="submit"
          isLoading={isLoading}
        />
      </form>
    </div>
  );
};

export default SucursalEditor;
