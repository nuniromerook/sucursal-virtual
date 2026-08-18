import React from "react";
import EnvioNavbar from "../../components/EnvioNavbar";
import SearchInput from "../../components/SearchInput";
import { categories } from "../../assets/assets.js";

export default function Home() {
  return (
    <>
      <div className="w-full">
        <div className="flex flex-col lg:hidden">
          <div className="bg-main-blue pt-4 pb-2 px-4">
            <EnvioNavbar />
          </div>
          <div className="py-6 w-19/20 mx-auto">
            <SearchInput />
          </div>
        </div>
        <img
          src="/dummy-promo-mobile.jpg"
          alt=""
          className="flex lg:hidden w-19/20 mx-auto aspect-120/41 rounded-md"
        />
        <img
          src="/dummy-promo-desktop.jpg"
          alt=""
          className="hidden lg:flex w-full h-[calc(100vh-300px)] object-cover object-top"
        />
        <div className="flex lg:hidden w-19/20 mx-auto gap-4 items-center mt-10">
          <div className="bg-neutral-300 w-full h-px rounded-full" />
          <h1 className="text-xl font-bold text-neutral-800 text-center uppercase">
            Categorías
          </h1>
          <div className="bg-neutral-300 w-full h-px rounded-full" />
        </div>
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:flex w-19/20 lg:w-full h-fit gap-4 lg:px-4 lg:pt-20 mx-auto mt-5 lg:-mt-30 bg-linear-to-b from-transparent via-neutral-100 to-neutral-100 z-1">
          {categories.map((category, index) => (
            <div
              key={index}
              className="flex relative items-center w-full select-none hover:scale-105 active:scale-105 transition-all border border-neutral-300 lg:shadow-md rounded-md overflow-hidden"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute flex w-full h-full bg-radial from-black/50 to-transparent" />
              <p className="absolute text-lg lg:text-xl inset-0 self-center font-extrabold uppercase text-white text-center text-shadow-md text-shadow-black/30">
                {category.nameId}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
