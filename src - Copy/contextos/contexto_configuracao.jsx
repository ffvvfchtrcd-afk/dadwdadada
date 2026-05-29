import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServicoConfiguracoes } from '../servicos/servico_configuracoes';

const ContextoConfig = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    ServicoConfiguracoes.carregar().then(data => {
      setConfig(data);
      setCarregando(false);
    });
  }, []);

  const recarregar = async () => {
    const data = await ServicoConfiguracoes.carregar();
    setConfig(data);
  };

  return (
    <ContextoConfig.Provider value={{ config, carregando, recarregar }}>
      {children}
    </ContextoConfig.Provider>
  );
}

export function useConfig() {
  const context = useContext(ContextoConfig);
  if (!context) throw new Error('useConfig deve ser usado dentro de ConfigProvider');
  return context;
}
