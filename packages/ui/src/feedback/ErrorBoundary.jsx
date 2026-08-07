import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary detectó un error crítico:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center font-poppins bg-[#F8F9FA]">
          <h2 className="text-3xl font-black uppercase text-slate-900 mb-4 tracking-tighter">Algo no salió como esperábamos 🍷</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-md">Hubo un error al cargar este módulo. No te preocupes, el resto de la cava sigue intacto.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-brand-orange transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;