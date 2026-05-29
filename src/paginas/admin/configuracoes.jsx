import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { useConfig } from '../../contextos/contexto_configuracao';
import { ServicoConfiguracoes } from '../../servicos/servico_configuracoes';
import { ServicoCupons } from '../../servicos/servico_cupons';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Check, X, Tag } from 'lucide-react';

export default function Configuracoes() {
  const { eAdmin } = useAuth();
  const { config, recarregar } = useConfig();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nome_loja: '', link_discord: '', link_suporte: '' });
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const [cupons, setCupons] = useState([]);
  const [novoCupomCodigo, setNovoCupomCodigo] = useState('');
  const [novoCupomPorc, setNovoCupomPorc] = useState('');

  useEffect(() => {
    if (!eAdmin) { navigate('/'); return; }
  }, [eAdmin]);

  useEffect(() => {
    if (config) {
      setForm({
        nome_loja: config.nome_loja || '',
        link_discord: config.link_discord || '',
        link_suporte: config.link_suporte || '',
      });
    }
  }, [config]);

  useEffect(() => {
    ServicoCupons.listar().then(setCupons);
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    const res = await ServicoConfiguracoes.salvar({
      ...config,
      nome_loja: form.nome_loja,
      link_discord: form.link_discord,
      link_suporte: form.link_suporte,
    });
    if (res.sucesso) {
      await recarregar();
      setSucesso('Configurações salvas!');
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(res.message);
    }
    setSalvando(false);
  };

  const criarCupom = async () => {
    if (!novoCupomCodigo.trim() || !novoCupomPorc) return;
    const res = await ServicoCupons.criar(novoCupomCodigo, parseFloat(novoCupomPorc) / 100);
    if (res.sucesso) {
      setNovoCupomCodigo('');
      setNovoCupomPorc('');
      setSucesso('Cupom criado!');
      setTimeout(() => setSucesso(''), 3000);
      ServicoCupons.listar().then(setCupons);
    } else {
      setErro(res.message);
    }
  };

  const ativarCupom = async (cupom) => {
    if (cupom.ativo) return;
    await ServicoCupons.alternarAtivo(cupom.id, true);
    await ServicoConfiguracoes.salvar({ ...config, cupom_ativo: true, cupom_codigo: cupom.codigo, cupom_porcentagem: cupom.porcentagem });
    await recarregar();
    ServicoCupons.listar().then(setCupons);
  };

  const desativarCupom = async (cupom) => {
    await ServicoCupons.alternarAtivo(cupom.id, false);
    await ServicoConfiguracoes.salvar({ ...config, cupom_ativo: false, cupom_codigo: '', cupom_porcentagem: 0 });
    await recarregar();
    ServicoCupons.listar().then(setCupons);
  };

  const deletarCupom = async (id) => {
    await ServicoCupons.deletar(id);
    ServicoCupons.listar().then(setCupons);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-white">Configurações do Site</h1>
      </div>

      {sucesso && <p className="text-success text-sm mb-4 bg-success/10 border border-success/30 rounded-lg px-4 py-2">{sucesso}</p>}
      {erro && <p className="text-danger text-sm mb-4 bg-danger/10 border border-danger/30 rounded-lg px-4 py-2">{erro}</p>}

      <form onSubmit={salvar} className="space-y-6 mb-10">
        <div className="card-padrao bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Informações da Loja</h2>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nome da Loja</label>
            <input
              type="text"
              value={form.nome_loja}
              onChange={e => setForm({ ...form, nome_loja: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Link do Discord</label>
            <input
              type="text"
              value={form.link_discord}
              onChange={e => setForm({ ...form, link_discord: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              placeholder="https://discord.gg/..."
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Link do Suporte (Telegram)</label>
            <input
              type="text"
              value={form.link_suporte}
              onChange={e => setForm({ ...form, link_suporte: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              placeholder="https://t.me/..."
            />
          </div>

          <button type="submit" disabled={salvando} className="botao-primario text-xs uppercase flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors">
            <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      <div className="card-padrao bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Tag size={14} /> Gerenciar Cupons
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={novoCupomCodigo}
            onChange={e => setNovoCupomCodigo(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            value={novoCupomPorc}
            onChange={e => setNovoCupomPorc(e.target.value)}
            placeholder="%"
            className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          />
          <button onClick={criarCupom} className="botao-primario text-xs px-3 py-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors flex items-center gap-1">
            <Plus size={14} /> Criar
          </button>
        </div>

        <div className="space-y-2">
          {cupons.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">Nenhum cupom criado ainda</p>
          ) : (
            cupons.map(c => (
              <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${c.ativo ? 'bg-primary/5 border-primary/30' : 'bg-zinc-800/30 border-zinc-800'}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-bold ${c.ativo ? 'text-primary' : 'text-zinc-400'}`}>{c.codigo}</span>
                  <span className="text-xs text-zinc-500">{Math.round(c.porcentagem * 100)}% OFF</span>
                  {c.ativo && <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded font-bold">ATIVO NO SITE</span>}
                </div>
                <div className="flex items-center gap-1">
                  {c.ativo ? (
                    <button onClick={() => desativarCupom(c)} className="text-zinc-500 hover:text-warning p-1.5 hover:bg-zinc-800 rounded transition-colors" title="Desativar">
                      <X size={14} />
                    </button>
                  ) : (
                    <button onClick={() => ativarCupom(c)} className="text-zinc-500 hover:text-success p-1.5 hover:bg-zinc-800 rounded transition-colors" title="Ativar no site">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => deletarCupom(c.id)} className="text-zinc-500 hover:text-danger p-1.5 hover:bg-zinc-800 rounded transition-colors" title="Deletar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
