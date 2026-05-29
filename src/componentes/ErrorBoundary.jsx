import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0618] text-white p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Algo deu errado</h1>
            <p className="text-zinc-400 text-sm mb-4">{this.state.error?.message || 'Erro inesperado'}</p>
            <button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg text-sm transition-colors">
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
