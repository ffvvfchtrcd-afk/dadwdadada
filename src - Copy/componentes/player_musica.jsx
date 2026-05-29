import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Plus, MoreHorizontal, Volume2, VolumeX } from "lucide-react";
import { CONFIGURACOES } from "../configuracoes/config";
import { ServicoLogs } from "../servicos/servico_logs";

export default function PlayerMusica() {
  const musicas = CONFIGURACOES.musicas;
  const [musicaIndice, setMusicaIndice] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0); // em segundos
  const [duracao, setDuracao] = useState(314); // default 05:14 = 314s
  const [volume, setVolume] = useState(0.4);
  const [mudo, setMudo] = useState(false);

  const audioRef = useRef(null);
  const playTimerRef = useRef(null);

  const musicaAtual = musicas[musicaIndice];

  // Configura áudio elemento
  useEffect(() => {
    // Cria ou atualiza elemento de áudio
    if (!audioRef.current) {
      audioRef.current = new Audio(musicaAtual.url);
      audioRef.current.loop = true;
    } else {
      audioRef.current.src = musicaAtual.url;
    }

    audioRef.current.volume = mudo ? 0 : volume;

    // Sincroniza metadados
    const aoCarregarMetadados = () => {
      setDuracao(Math.floor(audioRef.current.duration) || 314);
    };

    const aoAtualizarTempo = () => {
      setTempoAtual(Math.floor(audioRef.current.currentTime));
    };

    audioRef.current.addEventListener("loadedmetadata", aoCarregarMetadados);
    audioRef.current.addEventListener("timeupdate", aoAtualizarTempo);

    // Se estava tocando antes de mudar de faixa, toca a nova
    if (tocando) {
      audioRef.current.play().catch(erro => {
        console.warn("Autoplay bloqueado pelo navegador, rodando simulação visual:", erro);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("loadedmetadata", aoCarregarMetadados);
        audioRef.current.removeEventListener("timeupdate", aoAtualizarTempo);
      }
    };
  }, [musicaIndice]);

  // Sincroniza Play/Pause do Áudio
  useEffect(() => {
    if (!audioRef.current) return;

    if (tocando) {
      audioRef.current.play().catch(erro => {
        console.warn("Autoplay bloqueado, simulando progresso:", erro);
        // Fallback: se o áudio falhar (ex: CORS ou interação pendente), simula a barra de progresso rodando
        iniciarSimulacaoProgresso();
      });
      ServicoLogs.adicionarLog("MUSICA_PLAY", `Música reproduzindo: ${musicaAtual.titulo}`, "info");
    } else {
      audioRef.current.pause();
      pararSimulacaoProgresso();
      ServicoLogs.adicionarLog("MUSICA_PAUSE", `Música pausada: ${musicaAtual.titulo}`, "info");
    }
  }, [tocando]);

  // Sincroniza Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = mudo ? 0 : volume;
    }
  }, [volume, mudo]);

  // Simulação de Progresso (Fallback para quando o som falha por CORS ou autoplay)
  const iniciarSimulacaoProgresso = () => {
    pararSimulacaoProgresso();
    playTimerRef.current = setInterval(() => {
      setTempoAtual((prev) => {
        if (prev >= duracao) {
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const pararSimulacaoProgresso = () => {
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
  };

  const alternarReproducao = () => {
    setTocando(!tocando);
  };

  const alternarMudo = () => {
    setMudo(!mudo);
  };

  const formatarMinutos = (segundosTotais) => {
    const minutos = Math.floor(segundosTotais / 60);
    const segundos = segundosTotais % 60;
    return `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
  };

  // Pula para a próxima música
  const proximaMusica = () => {
    setTempoAtual(0);
    setMusicaIndice((prev) => (prev + 1) % musicas.length);
  };

  return (
    <div 
      id="player_musica_container"
      className="fixed bottom-4 right-4 z-40 bg-[#0d091e] border-3 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex items-center gap-4 w-80 max-w-[calc(100vw-32px)] border-b-4 select-none"
    >
      {/* Cartoon CD Rotating Image */}
      <div 
        onClick={proximaMusica}
        className={`w-12 h-12 bg-black border-2 border-black rounded-full flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000] flex-shrink-0 relative overflow-hidden group ${tocando ? "animate-spin" : ""}`}
        style={{ animationDuration: "6s" }}
        title="Clique para mudar de música"
      >
        {/* Retro CD pattern */}
        <div className="absolute inset-2 border-2 border-dashed border-[#b92cff]/60 rounded-full" />
        <div className="w-4 h-4 bg-[#ffe600] rounded-full border border-black z-10" />
        <div className="absolute inset-0 bg-[#00f0ff] opacity-10 group-hover:opacity-30 transition-opacity" />
      </div>

      {/* Track Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-[#b92cff] font-extrabold uppercase tracking-wider block leading-tight">
              Chatão Tocando
            </span>
            <h5 className="font-extrabold text-xs text-white truncate leading-tight mt-0.5">
              {musicaAtual.titulo}
            </h5>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {musicaAtual.artistas}
            </p>
          </div>
          
          <div className="flex gap-1">
            <button className="text-gray-400 hover:text-white p-0.5 rounded">
              <Plus size={14} />
            </button>
            <button className="text-gray-400 hover:text-white p-0.5 rounded">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Progress scrub bar */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[9px] font-mono text-gray-400 w-7">
            {formatarMinutos(tempoAtual)}
          </span>
          <div className="flex-1 h-1.5 bg-black border border-gray-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-[#00f0ff] rounded-full" 
              style={{ width: `${(tempoAtual / duracao) * 100}%` }}
            ></div>
          </div>
          <span className="text-[9px] font-mono text-gray-400 w-7 text-right">
            {formatarMinutos(duracao)}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <button
          id="musica_play_pause"
          onClick={alternarReproducao}
          className="w-8 h-8 rounded-full bg-[#b92cff] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000] hover:bg-[#c74cff] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all"
        >
          {tocando ? <Pause size={14} className="fill-white" /> : <Play size={14} className="fill-white ml-0.5" />}
        </button>

        {/* volume icon */}
        <button 
          onClick={alternarMudo}
          className="text-gray-400 hover:text-white"
        >
          {mudo ? <VolumeX size={14} className="text-red-500" /> : <Volume2 size={14} />}
        </button>
      </div>

    </div>
  );
}
