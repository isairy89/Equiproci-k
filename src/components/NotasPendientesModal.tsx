import React from 'react';
import { DecisionPendiente } from '../types';
import { AlertTriangle, CheckCircle2, Clock, X, HelpCircle } from 'lucide-react';

interface NotasPendientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisiones: DecisionPendiente[];
  onToggleEstado: (id: string) => void;
}

export const NotasPendientesModal: React.FC<NotasPendientesModalProps> = ({
  isOpen,
  onClose,
  decisiones,
  onToggleEstado
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Información Pendiente de Definición de Negocio
              </h2>
              <p className="text-xs text-slate-400">
                Puntos identificados según Reglas #8 y #9 para definir antes de futuras integraciones.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Decisiones Pendientes */}
        <div className="space-y-4">
          {decisiones.map((item) => {
            const esResuelto = item.estado === 'resuelto';
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                  esResuelto
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400'
                    : 'bg-slate-800/60 border-amber-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold text-sm ${esResuelto ? 'line-through text-slate-500' : 'text-amber-400'}`}>
                    {item.titulo}
                  </span>
                  <button
                    onClick={() => onToggleEstado(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      esResuelto
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    {esResuelto ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Definido / Aclarado
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Marcar Aclarado
                      </>
                    )}
                  </button>
                </div>

                <p className="leading-relaxed text-slate-300">
                  {item.descripcion}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400">
                  <span>Impacto: <strong className="text-white uppercase">{item.impacto}</strong></span>
                  <span>•</span>
                  <span>Estado actual: <strong className="text-amber-300 capitalize">{item.estado.replace('_', ' ')}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
