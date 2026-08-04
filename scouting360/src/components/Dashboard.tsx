import React from 'react';

// Interfaz para tipar correctamente las props y evitar errores en TypeScript
interface DashboardProps {
  rol: 'admin' | 'colaborador' | 'suscriptor' | string;
  onNavegar: (nuevaVista: string) => void;
  onAbrirNuevoInforme?: () => void; // Prop para abrir el modal de nuevo informe
}

export default function Dashboard({ rol, onNavegar, onAbrirNuevoInforme }: DashboardProps) {
  return (
    <div className="space-y-8 p-6 text-slate-200">
      
      {/* Saludo inicial y resumen de rol */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">¡Hola de nuevo! 👋</h1>
          <p className="text-sm text-slate-400">
            Estás conectado como <span className="font-semibold text-emerald-400 capitalize">{rol}</span>
          </p>
        </div>

      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Partidos Analizados</p>
          <p className="text-3xl font-extrabold text-white mt-2">24</p>
          <span className="text-xs text-emerald-400 mt-1 inline-block">↑ 4 este mes</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Jugadores Destacados</p>
          <p className="text-3xl font-extrabold text-white mt-2">12</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Promedio Nota: 7.8</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Puntaje Global Equipo</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">6.8 / 10</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Rendimiento general</span>
        </div>
      </div>

      {/* Sección de Últimos Partidos y Actividad */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Últimos Partidos Analizados</h2>
          <button 
            onClick={() => onNavegar('jugadores')} 
            className="text-xs text-emerald-400 hover:underline cursor-pointer"
          >
            Ver todos →
          </button>
        </div>

        {/* Lista corta de informes recientes */}
        <div className="space-y-3">
          {[
            { id: 1, rival: 'vs. Rosario Central', fecha: '24 Jul 2026', resultado: '2 - 1', destacado: 'Mateo Retegui' },
            { id: 2, rival: 'vs. San Lorenzo', fecha: '18 Jul 2026', resultado: '0 - 0', destacado: 'Ignacio Miramón' },
          ].map((partido) => (
            <div key={partido.id} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
              <div>
                <p className="font-semibold text-white">{partido.rival}</p>
                <p className="text-xs text-slate-400">Fecha: {partido.fecha} | Destacado: {partido.destacado}</p>
              </div>
              <span className="bg-slate-800 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg">
                {partido.resultado}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}