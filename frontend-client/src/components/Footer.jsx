import React from "react";
import icons from "../assets/icons/icons";

const Footer = () => {
  return (
    <footer className="flex flex-col items-center justify-center w-full py-20 bg-white text-neutral-900/70">
      <img
        src="/favicon.svg"
        alt="Abastecedora Valette Logo"
        className="size-40 aspect-square"
      />
      <p className="mt-4 text-center">
        Copyright © 2026 Abastecedora Valette. <br className="lg:hidden" />{" "}
        Todos los derechos reservados.
      </p>
      <div className="flex items-center gap-4 mt-5">
        <a
          href="#"
          className="hover:-translate-y-0.5 transition-all duration-300"
        >
          <img src={icons.facebook} alt="facebook" className="size-7" />
        </a>
        <a
          href="#"
          className="hover:-translate-y-0.5 transition-all duration-300"
        >
          <img src={icons.instagram} alt="instagram" className="size-7" />
        </a>
        <a
          href="#"
          className="hover:-translate-y-0.5 transition-all duration-300"
        >
          <img src={icons.tiktok} alt="tiktok" className="size-7" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
