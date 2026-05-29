import React from "react";
import { useConfig } from "../contextos/contexto_configuracao";
import { CONFIGURACOES } from "../configuracoes/config";

export default function FlutuanteDiscord() {
  const { config } = useConfig();
  return (
    <a
      id="discord_flutuante"
      href={config?.link_discord || CONFIGURACOES.links.discord}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-[#0d091e] hover:bg-[#5865F2] hover:text-white text-gray-400 border-3 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] hover:shadow-[4px_4px_0px_#5865F2] hover:border-[#5865F2] transition-all hover:-translate-y-[calc(50%+4px)] select-none flex items-center justify-center cursor-pointer group"
      title="Entrar no Discord"
    >
      <svg
        viewBox="0 0 127.14 96.36"
        className="w-6 h-6 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,2-1.5,2.92-2.3a75.45,75.45,0,0,0,72.1,0c.92.8,1.9,1.57,2.92,2.3a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,48.12,123.63,25.37,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
      </svg>
    </a>
  );
}
