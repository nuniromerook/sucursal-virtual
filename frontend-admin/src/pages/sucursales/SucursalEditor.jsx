import React, { useEffect, useState } from "react";
import Input from "../../components/ui/Input";
import ButtonLoader from "../../components/ui/ButtonLoader";
import { useAppContext } from "../../context/AppContext";
import { API_URL } from "../../config/api";

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
    <div className="flex flex-col h-fit gap-y-4 lg:gap-y-8 p-4 lg:p-6">
      <h1 className="text-2xl font-bold text-gray-900">Nueva sucursal</h1>

      <form
        id="sucursal-editor-form"
        className="rounded-lg border border-gray-200 bg-white p-6"
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
              placeholder="Luis Guillón"
              value={formValues.nombre}
              setOnChange={handleNombreChange}
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
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Dirección"
              id="direccion"
              inputName="direccion"
              inputType="text"
              autoComplete="off"
              placeholder="Av. Siempre Viva 742"
              value={formValues.direccion}
              setOnChange={handleChange}
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
              placeholder="Lun a sáb 9 a 20hs"
              value={formValues.horario_atencion}
              setOnChange={handleChange}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Latitud (opcional)"
              id="latitud"
              inputName="latitud"
              inputType="text"
              autoComplete="off"
              placeholder="-34.7963"
              value={formValues.latitud}
              setOnChange={handleChange}
            />

            <Input
              label="Longitud (opcional)"
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
          value="Guardar sucursal"
          loadingValue="Guardando la sucursal..."
          classNames="w-full bg-emerald-700 transition hover:bg-emerald-600 text-white text-lg mt-6"
          loaderColor="text-white"
          buttonType="submit"
          isLoading={isLoading}
        />
      </form>
    </div>
  );
};

export default SucursalEditor;
