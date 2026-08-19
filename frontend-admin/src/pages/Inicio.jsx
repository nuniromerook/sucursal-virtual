import { useEffect } from "react";
import { useAppContext } from "../context/AppContext";

export default function Inicio() {
  const { setNavbarTitle } = useAppContext();

  useEffect(() => {
    setNavbarTitle("Hola Juan!");
  }, []);

  return (
    <>
      <div>Hola!</div>
    </>
  );
}
