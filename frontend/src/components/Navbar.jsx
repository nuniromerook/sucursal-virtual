import SearchInput from "@/components/SearchInput";
import { Link } from "react-router-dom";
import { Bell, Menu, ShoppingCart } from "lucide-react";
import EnvioNavbar from "@/components/EnvioNavbar";

const Navbar = () => {
  return (
    <header className="flex sticky top-0 left-0 w-full bg-main-blue z-100">
      <div className="flex w-full items-center max-w-6xl h-14 lg:h-26 gap-6 lg:mx-auto pr-6 pl-4 lg:px-0">
        {/*Logo*/}
        <div className="hidden lg:block size-25 aspect-square">
          <img
            src="/favicon.svg"
            alt="Abastecedora Valette"
            className="aspect-square"
          />
        </div>
        {/*Menu hamburguesa mobile*/}
        <div className="flex lg:hidden size-10 aspect-square">
          <button type="button" aria-label="Menu">
            <Menu className="size-6 stroke-1 text-white" />
          </button>
        </div>

        {/*Buscador y links desktop*/}
        <div className="flex flex-row-reverse lg:flex-col h-fit w-full items-center lg:gap-3">
          <div className="flex w-full h-fit lg:gap-6">
            <div className="hidden lg:flex w-full h-fit">
              <SearchInput />
            </div>
            {/*Carrito, Notificaciones y Cuenta*/}
            <div className="flex w-fit h-fit text-white gap-7 lg:gap-8 items-center ml-auto lg:ml-0">
              <button
                type="button"
                aria-label="Carrito"
                className="relative mt-2"
              >
                <ShoppingCart className="size-6 stroke-1" />
                <p className="flex size-5 lg:size-5.5 items-center justify-center absolute -top-2 lg:-top-3 -right-2 lg:-right-3 bg-red-500 rounded-full text-xs p-1">
                  0
                </p>
              </button>
              <button
                type="button"
                aria-label="Notificaciones"
                className="relative mt-2"
              >
                <Bell className="size-6 stroke-1" />
                <p className="flex size-5 lg:size-5.5 items-center justify-center absolute -top-2 lg:-top-3 -right-2 lg:-right-3 bg-red-500 rounded-full text-xs p-1">
                  10
                </p>
              </button>
              {/*Cuenta desktop*/}
              <div className="hidden lg:flex size-9 rounded-full bg-white text-neutral-800 items-center justify-center">
                JN
              </div>
            </div>
          </div>

          {/*Envio y links*/}
          <div className="flex w-full h-fit items-center lg:gap-6">
            {/*Envio*/}
            <div className="hidden lg:block">
              <EnvioNavbar />
            </div>
            {/*Links desktop (oculto en mobile)*/}
            <nav
              aria-label="Navegación principal"
              className="hidden lg:flex w-fit ml-auto gap-4 items-center text-white"
            >
              <Link to="/categorias" aria-label="Categorías">
                Categorías
              </Link>
              <Link to="/productos" aria-label="Productos">
                Productos
              </Link>
              <Link to="/ofertas" aria-label="Ofertas">
                Ofertas
              </Link>
              <Link to="/sucursales" aria-label="Sucursales">
                Sucursales
              </Link>
              <Link to="/envios" aria-label="Envíos">
                Envíos
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
