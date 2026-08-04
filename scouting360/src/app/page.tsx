'use client'

import Dashboard from '@/components/Dashboard'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Search, Filter, UserCheck, Shield, Flame, Activity,
  Globe, Trophy, Building2, X, Video, FileText, BarChart3, Award, LogOut, Check, Star, ArrowRight, Calendar
} from 'lucide-react'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface Jugador {
  id: string
  nombre_completo: string
  foto_url?: string
  fecha_nacimiento?: string
  club_id?: string
  clubes?: {
    nombre: string
  }
  posicion_principal: string
  perfil: string
  altura_cm?: number
  peso_kg?: number
  estado?: string
  proyeccion?: string
  pais?: string
  liga?: string
  goles?: number
  asistencias?: number
  created_at?: string
}

interface EventoLineaTiempo {
  minuto: string
  equipo: string
  evento: string
  jugador: string
  detalle?: string
}

interface JugadorDestacado {
  nombre: string
  posicion: string
  evaluacion: string
  general: number
  fisico: number
  tecnico: number
  tactico: number
  potencia: number
  [key: string]: any
}

const datosRadarEjemplo = [
  { atributo: 'Técnica', A: 82 },
  { atributo: 'Físico', A: 75 },
  { atributo: 'Táctica', A: 88 },
  { atributo: 'Mental', A: 80 },
  { atributo: 'Pase/Visión', A: 85 },
  { atributo: 'Velocidad', A: 78 },
]

export default function Home() {
  // --- HELPER PARA CALCULAR EDAD ---
  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return 'No registrada'
    const hoy = new Date()
    const cumple = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - cumple.getFullYear()
    const m = hoy.getMonth() - cumple.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--
    }
    return isNaN(edad) ? 'No registrada' : `${edad} años`
  }

  // --- ESTADOS DE AUTENTICACIÓN Y ROLES ---
  const [usuario, setUsuario] = useState<any>(null)
  const [rolUsuario, setRolUsuario] = useState<'admin' | 'colaborador' | 'suscriptor'>('suscriptor')
  const [cargandoAuth, setCargandoAuth] = useState(true)

  // Modos de pantalla pública: 'landing' (portada) | 'login' | 'registro'
  const [modoPublico, setModoPublico] = useState<'landing' | 'login' | 'registro'>('landing')
  const [planSeleccionado, setPlanSeleccionado] = useState<string | null>(null)

  // Formulario Login / Registro
  const [emailAuth, setEmailAuth] = useState('')
  const [passwordAuth, setPasswordAuth] = useState('')
  const [errorAuth, setErrorAuth] = useState('')
  const [procesandoAuth, setProcesandoAuth] = useState(false)

  // --- ESTADOS PRINCIPALES DE LA APLICACIÓN ---
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'jugadores'>('dashboard')
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [cargando, setCargando] = useState(true)
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Jugador | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroPais, setFiltroPais] = useState('')
  const [filtroLiga, setFiltroLiga] = useState('')
  const [filtroClub, setFiltroClub] = useState('')
  const [filtroPosicion, setFiltroPosicion] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')
  const [filtroGolesMin, setFiltroGolesMin] = useState('')
  const [filtroAsistenciasMin, setFiltroAsistenciasMin] = useState('')

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [idJugadorEditando, setIdJugadorEditando] = useState<string | null>(null)

  const [nuevoJugador, setNuevoJugador] = useState({
    nombre_completo: '',
    posicion_principal: 'Delantero',
    perfil: 'Diestro',
    altura_cm: '',
    peso_kg: '',
    fecha_nacimiento: '',
    club_id: '',
    proyeccion: 'Primera Nacional',
    pais: 'Argentina',
    liga: 'Promocional Amateur'
  })

  const [pestañaActiva, setPestañaActiva] = useState<'jugadores' | 'informes'>('jugadores')

  const [modalInformeJugador, setModalInformeJugador] = useState(false)
  const [modalInformePartido, setModalInformePartido] = useState(false)

  const [informesJugadores, setInformesJugadores] = useState<any[]>([])
  const [informesPartidos, setInformesPartidos] = useState<any[]>([])

  const [jugadoresDestacados, setJugadoresDestacados] = useState<JugadorDestacado[]>([
    { nombre: '', posicion: '', evaluacion: '', general: 5, fisico: 5, tecnico: 5, tactico: 5, potencia: 5 }
  ])

  const [lineaTiempo, setLineaTiempo] = useState<EventoLineaTiempo[]>([
    { minuto: '', equipo: 'Local', evento: 'Gol', jugador: '', detalle: '' }
  ])

  // --- ACCIÓN PARA ABRIR EL PANEL DE CARGA DE JUGADOR ---
  const abrirModalCrearJugador = () => {
    setIdJugadorEditando(null)
    setNuevoJugador({
      nombre_completo: '',
      posicion_principal: 'Delantero',
      perfil: 'Diestro',
      altura_cm: '',
      peso_kg: '',
      fecha_nacimiento: '',
      club_id: '',
      proyeccion: 'Primera Nacional',
      pais: 'Argentina',
      liga: 'Promocional Amateur'
    })
    setModalCrearAbierto(true)
  }

  // --- EFECTO DE AUTENTICACIÓN ---
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUsuario(user)
        const rolGuardado = user.user_metadata?.role || 'suscriptor'
        setRolUsuario(rolGuardado)
      } else {
        setUsuario(null)
      }
      setCargandoAuth(false)
    }

    verificarSesion()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuario(session.user)
        const rolGuardado = session.user.user_metadata?.role || 'suscriptor'
        setRolUsuario(rolGuardado)
      } else {
        setUsuario(null)
      }
      setCargandoAuth(false)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // --- OBTENCIÓN DE DATOS DE BASE DE DATOS ---
  useEffect(() => {
    if (!usuario) return

    async function obtenerJugadores() {
      // JOIN CON LA TABLA CLUBES PARA OBTENER EL NOMBRE
      const { data, error } = await supabase
        .from('jugadores')
        .select(`
          *,
          clubes (
            nombre
          )
        `)
        console.log("DATA:", data)
console.log("ERROR:", error)

      if (error) {
        console.error('Error cargando jugadores:', error)
      } else {
        setJugadores(data || [])
      }
      
setCargando(false)
    }

    obtenerJugadores()
    cargarInformes()
  }, [usuario])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorAuth('')
    setProcesandoAuth(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: emailAuth,
      password: passwordAuth,
    })

    if (error) {
      setErrorAuth('Credenciales inválidas. Por favor verifique e intente nuevamente.')
    }
    setProcesandoAuth(false)
  }

  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorAuth('')
    setProcesandoAuth(true)

    const { error } = await supabase.auth.signUp({
      email: emailAuth,
      password: passwordAuth,
      options: {
        data: {
          plan_interes: planSeleccionado || 'Mensual'
        }
      }
    })

    if (error) {
      setErrorAuth(error.message)
    } else {
      alert('¡Cuenta creada con éxito! Ya podés ingresar a la plataforma.')
      setModoPublico('login')
    }
    setProcesandoAuth(false)
  }

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    setModoPublico('landing')
  }

  const cargarInformes = async () => {
    const { data: dataJugadores } = await supabase
      .from('informes_jugadores')
      .select('*, jugadores(nombre_completo)')
      .order('created_at', { ascending: false })

    const { data: dataPartidos } = await supabase
      .from('informes_partidos')
      .select('*')
      .order('created_at', { ascending: false })

    if (dataJugadores) setInformesJugadores(dataJugadores)
    if (dataPartidos) setInformesPartidos(dataPartidos)
  }

  // Extraer lista de nombres únicos de clubes para el filtro
  const clubesDisponibles = Array.from(
    new Set(jugadores.map((j) => j.clubes?.nombre).filter(Boolean))
  ) as string[]

  const jugadoresFiltrados = jugadores.filter((j) => {
    const nombre = j.nombre_completo || ''
    const pais = j.pais || ''
    const liga = j.liga || ''
    const club = j.clubes?.nombre || ''
    const posicion = j.posicion_principal || ''
    const perfil = j.perfil || ''

    const coincideNombre = nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincidePais = filtroPais === '' || pais.toLowerCase() === filtroPais.toLowerCase()
    const coincideLiga = filtroLiga === '' || liga.toLowerCase().includes(filtroLiga.toLowerCase())
    const coincideClub = filtroClub === '' || club.toLowerCase() === filtroClub.toLowerCase()
    const coincidePosicion = filtroPosicion === '' || posicion.toLowerCase().includes(filtroPosicion.toLowerCase())
    const coincidePerfil = filtroPerfil === '' || perfil.toLowerCase() === filtroPerfil.toLowerCase()

    const goles = j.goles || 0
    const asistencias = j.asistencias || 0
    const coincideGoles = filtroGolesMin === '' || goles >= Number(filtroGolesMin)
    const coincideAsistencias = filtroAsistenciasMin === '' || asistencias >= Number(filtroAsistenciasMin)

    return coincideNombre && coincidePais && coincideLiga && coincideClub && coincidePosicion && coincidePerfil && coincideGoles && coincideAsistencias
  })

  const guardarNuevoJugador = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoJugador.nombre_completo.trim()) return alert('El nombre es obligatorio')

    setGuardando(true)

    const datosPayload = {
      nombre_completo: nuevoJugador.nombre_completo,
      posicion_principal: nuevoJugador.posicion_principal,
      perfil: nuevoJugador.perfil,
      altura_cm: nuevoJugador.altura_cm ? Number(nuevoJugador.altura_cm) : null,
      peso_kg: nuevoJugador.peso_kg ? Number(nuevoJugador.peso_kg) : null,
      fecha_nacimiento: nuevoJugador.fecha_nacimiento || null,
      club_id: nuevoJugador.club_id || null,
      proyeccion: nuevoJugador.proyeccion,
      pais: nuevoJugador.pais,
      liga: nuevoJugador.liga
    }

    if (idJugadorEditando) {
      const { data, error } = await supabase
        .from('jugadores')
        .update(datosPayload)
        .eq('id', idJugadorEditando)
        .select(`*, clubes(nombre)`)

      if (error) {
        console.error('Error editando:', error)
        alert('Hubo un error al actualizar el jugador.')
      } else if (data) {
        setJugadores(jugadores.map(j => j.id === idJugadorEditando ? data[0] : j))
        setModalCrearAbierto(false)
        setIdJugadorEditando(null)
      }
    } else {
      const { data, error } = await supabase
        .from('jugadores')
        .insert([datosPayload])
        .select(`*, clubes(nombre)`)

      if (error) {
        console.error('Error creando jugador:', error)
        alert('Hubo un error al guardar el jugador.')
      } else if (data) {
        setJugadores([...jugadores, data[0]])
        setModalCrearAbierto(false)
      }
    }

    setNuevoJugador({
      nombre_completo: '',
      posicion_principal: 'Delantero',
      perfil: 'Diestro',
      altura_cm: '',
      peso_kg: '',
      fecha_nacimiento: '',
      club_id: '',
      proyeccion: 'Primera Nacional',
      pais: 'Argentina',
      liga: 'Promocional Amateur'
    })
    setGuardando(false)
  }

  const eliminarJugador = async (id: string, nombre: string) => {
    const confirmar = confirm(`¿Estás seguro de que querés eliminar a ${nombre}? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    const { error } = await supabase.from('jugadores').delete().eq('id', id)

    if (error) {
      console.error('Error al eliminar:', error)
      alert('Ocurrió un error al intentar eliminar el jugador.')
    } else {
      setJugadores(jugadores.filter(j => j.id !== id))
      if (jugadorSeleccionado?.id === id) setJugadorSeleccionado(null)
    }
  }

  const abrirEditarJugador = (j: Jugador) => {
    setIdJugadorEditando(j.id)
    setNuevoJugador({
      nombre_completo: j.nombre_completo || '',
      posicion_principal: j.posicion_principal || 'Delantero',
      perfil: j.perfil || 'Diestro',
      altura_cm: j.altura_cm ? String(j.altura_cm) : '',
      peso_kg: j.peso_kg ? String(j.peso_kg) : '',
      fecha_nacimiento: j.fecha_nacimiento || '',
      club_id: j.club_id || '',
      proyeccion: j.proyeccion || 'Primera Nacional',
      pais: j.pais || 'Argentina',
      liga: j.liga || 'Promocional Amateur'
    })
    setModalCrearAbierto(true)
  }

  const agregarDestacado = () => {
    if (jugadoresDestacados.length < 4) {
      setJugadoresDestacados([...jugadoresDestacados, { nombre: '', posicion: '', evaluacion: '', general: 5, fisico: 5, tecnico: 5, tactico: 5, potencia: 5 }])
    }
  }

  const quitarDestacado = (index: number) => {
    if (jugadoresDestacados.length > 1) {
      setJugadoresDestacados(jugadoresDestacados.filter((_, i) => i !== index))
    }
  }

  const agregarEvento = () => {
    setLineaTiempo([...lineaTiempo, { minuto: '', equipo: 'Local', evento: 'Gol', jugador: '', detalle: '' }])
  }

  const quitarEvento = (index: number) => {
    setLineaTiempo(lineaTiempo.filter((_, i) => i !== index))
  }

  const guardarAnalisisPartido = async (
    informePartidoId: string,
    lineaTiempoEventos: EventoLineaTiempo[]
  ) => {
    if (!lineaTiempoEventos || lineaTiempoEventos.length === 0) return

    const eventosPayload = lineaTiempoEventos
      .filter(e => e.jugador && e.evento)
      .map(e => ({
        informe_partido_id: informePartidoId,
        jugador_nombre: e.jugador,
        equipo: e.equipo,
        minuto: e.minuto ? parseInt(e.minuto, 10) : null,
        tipo_evento: e.evento
      }))

    if (eventosPayload.length === 0) return

    const { error } = await supabase.from('eventos_partido').insert(eventosPayload)

    if (error) {
      console.error('Error insertando eventos de la línea de tiempo:', error)
      throw error
    }
  }

  // --- PANTALLA DE CARGA ---
  if (cargandoAuth) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p className="animate-pulse text-sm text-slate-400">Cargando plataforma...</p>
      </main>
    )
  }

  // --- SECCIÓN PÚBLICA (LANDING / MUESTRA / LOGIN / SUSCRIPCIÓN) ---
  if (!usuario) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        {/* NAV PÚBLICO */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setModoPublico('landing')}>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-wider text-white">SCOUTING <span className="text-emerald-400">360</span></span>
            </div>

            <div className="flex items-center gap-3">
              {modoPublico === 'landing' ? (
                <>
                  <button
                    onClick={() => {
                      setModoPublico('landing')
                      setTimeout(() => {
                        document.getElementById('muestra')?.scrollIntoView({ behavior: 'smooth' })
                      }, 100)
                    }}
                    className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 transition-colors hidden sm:block"
                  >
                    Muestra de Informe
                  </button>
                  <button
                    onClick={() => setModoPublico('login')}
                    className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      setModoPublico('landing')
                      setTimeout(() => {
                        document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' })
                      }, 100)
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    Ver Suscripciones
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModoPublico('landing')}
                  className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 transition-colors"
                >
                  ← Volver a la portada
                </button>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO SEGÚN EL MODO PÚBLICO */}
        {modoPublico === 'landing' && (
          <div className="flex-1 space-y-20 pb-16">
            {/* HERO SECTION */}
            <section className="max-w-6xl mx-auto px-6 pt-16 text-center space-y-6">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-2">
                <Star className="w-3.5 h-3.5 fill-emerald-400" /> Plataforma Profesional para Clubes, Agentes y Scouts
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
                Análisis táctico y scouteo multiliga <span className="text-emerald-400">actualizado</span>.
              </h1>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                Accedé a informes de partidos detallados, evaluaciones individuales, líneas de tiempo tácticas y radares biomecánicos para tomar decisiones de fichaje informadas.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => {
                    const el = document.getElementById('planes')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
                >
                  Suscribirse Ahora <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('muestra')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold px-6 py-3 rounded-xl transition-all text-sm"
                >
                  Ver Muestra de Informe
                </button>
              </div>
            </section>

            {/* DEMO / MUESTRA DE INFORME */}
            <section id="muestra" className="max-w-6xl mx-auto px-6 space-y-8 scroll-mt-24">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white">Así se ven nuestros informes profesionales</h2>
                <p className="text-xs text-slate-400">Vista previa del material exclusivo al que acceden nuestros suscriptores.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Muestra Ficha Jugador */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded">
                      MUESTRA DE FICHA
                    </span>
                    <span className="text-slate-500 text-xs font-mono">Promocional Amateur</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Mateo Benítez</h3>
                    <p className="text-xs text-emerald-400 font-semibold">Extremo Izquierdo / Diestro — 19 años</p>
                  </div>
                  <div className="w-full h-48 bg-slate-950 rounded-xl p-2 border border-slate-800 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={datosRadarEjemplo}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="atributo" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Radar name="Mateo" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <strong>Evaluación Scout:</strong> Jugador desequilibrante en el 1vs1 rápido con diagonal hacia adentro. Destacada aceleración en primeros metros y lectura para la presión en bloque alto.
                  </p>
                </div>

                {/* Muestra Análisis de Partido */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded">
                      MUESTRA DE PARTIDO
                    </span>
                    <span className="text-slate-500 text-xs font-mono">Análisis Táctico</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">San Lorenzo vs Huracán</h3>
                    <p className="text-xs text-slate-400">Jornada 5 — Desglose de Fases</p>
                  </div>
                  <div className="space-y-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="border-b border-slate-800 pb-2">
                      <span className="text-emerald-400 font-bold block mb-0.5">Fase Ofensiva Local:</span>
                      <p className="text-slate-300">Salida limpia de tres con lateral descendido y fijación de extremos bien abiertos para generar carriles interiores.</p>
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold block mb-0.5">Línea de Tiempo Registrada:</span>
                      <p className="text-slate-400 font-mono text-[11px]">23' ⚽ Gol (Jugada Asociada) | 41' 🟨 Amarilla (Presión Tras Pérdida)</p>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
                    <p className="text-xs text-emerald-400 font-bold">Base de datos con más de 100+ jugadores scouteados</p>
                  </div>
                </div>
              </div>
            </section>

            {/* PLANES DE SUSCRIPCIÓN */}
            <section id="planes" className="max-w-6xl mx-auto px-6 space-y-8 scroll-mt-24">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white">Elegí el plan perfecto para vos</h2>
                <p className="text-xs text-slate-400">Acceso ilimitado a todas las fichas, informes semanales y radar táctico.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Plan Mensual</h3>
                    <p className="text-slate-400 text-xs">Ideal para scouts independientes y entusiastas del análisis.</p>
                    <div className="text-3xl font-black text-white">USD $15 <span className="text-xs text-slate-500 font-normal">/mes</span></div>
                    <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Acceso a Base Completa de Jugadores</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Lectura de Informes de Partidos</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Visualización de Radares y Métricas</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setPlanSeleccionado('Plan Mensual')
                      setModoPublico('registro')
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Suscribirse
                  </button>
                </div>

                {/* Plan 2 - Destacado */}
                <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl shadow-emerald-500/10">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Más Popular
                  </span>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Plan Trimestral</h3>
                    <p className="text-slate-400 text-xs">Ahorrá abonando cada 3 meses con acceso total asegurado.</p>
                    <div className="text-3xl font-black text-emerald-400">USD $38 <span className="text-xs text-slate-500 font-normal">/trimestre</span></div>
                    <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Todo lo del Plan Mensual</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Notificaciones de Nuevos Reportes</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Descarga de Fichas en PDF</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setPlanSeleccionado('Plan Trimestral')
                      setModoPublico('registro')
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Obtener Plan Trimestral
                  </button>
                </div>

                {/* Plan 3 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Clubes / Agencias</h3>
                    <p className="text-slate-400 text-xs">Acceso institucional con múltiples usuarios y solicitud de scouting a pedido.</p>
                    <div className="text-3xl font-black text-white">Consultar <span className="text-xs text-slate-500 font-normal">/personalizado</span></div>
                    <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Cuentas múltiples para staff</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Encargo de partidos/jugadores específicos</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Soporte personalizado 24/7</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setPlanSeleccionado('Clubes y Agencias')
                      setModoPublico('registro')
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Contactar
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* LOGIN / REGISTRO */}
        {(modoPublico === 'login' || modoPublico === 'registro') && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 mb-1">
                  <Activity className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black tracking-wider text-white">
                  {modoPublico === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA DE SUSCRIPTOR'}
                </h1>
                <p className="text-slate-400 text-xs">
                  {modoPublico === 'login'
                    ? 'Ingresá tus credenciales para acceder a la base'
                    : `Registrate para adquirir el ${planSeleccionado || 'Plan Suscriptor'}`}
                </p>
              </div>

              {errorAuth && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center font-medium">
                  {errorAuth}
                </div>
              )}

              <form onSubmit={modoPublico === 'login' ? handleLoginSubmit : handleRegistroSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={emailAuth}
                    onChange={(e) => setEmailAuth(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={passwordAuth}
                    onChange={(e) => setPasswordAuth(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={procesandoAuth}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition-colors mt-2"
                >
                  {procesandoAuth
                    ? 'Procesando...'
                    : modoPublico === 'login'
                    ? 'Ingresar'
                    : 'Registrarme como Suscriptor'}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-800">
                {modoPublico === 'login' ? (
                  <p className="text-xs text-slate-400">
                    ¿No tenés cuenta?{' '}
                    <button
                      onClick={() => setModoPublico('registro')}
                      className="text-emerald-400 font-bold hover:underline"
                    >
                      Registrate como Suscriptor
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    ¿Ya tenés cuenta?{' '}
                    <button
                      onClick={() => setModoPublico('login')}
                      className="text-emerald-400 font-bold hover:underline"
                    >
                      Iniciar Sesión
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER PÚBLICO */}
        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          Scouting 360 © 2026 — Plataforma de Scouteo y Analítica
        </footer>
      </main>
    )
  }

  // --- PLATAFORMA PRIVADA ---
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative">

      {/* Botones para cambiar entre Inicio y Jugadores */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setVistaActual('dashboard')}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${vistaActual === 'dashboard' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Inicio
          </button>
          <button
            onClick={() => setVistaActual('jugadores')}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${vistaActual === 'jugadores' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Jugadores
          </button>
        </div>

        {/* Cierre de Sesión e Info del Usuario */}
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono hidden sm:inline-block">
            {usuario.email} (<strong className="text-emerald-400 uppercase">{rolUsuario}</strong>)
          </span>
          <button
            onClick={handleCerrarSesion}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Si elegimos 'dashboard', mostramos el componente conectando la apertura del modal */}
      {vistaActual === 'dashboard' && (
        <Dashboard
          rol={rolUsuario}
          onNavegar={(nuevaVista: string) => setVistaActual(nuevaVista as 'dashboard' | 'jugadores')}
          onAbrirNuevoInforme={() => setModalInformePartido(true)}
        />
      )}

      {/* Si elegimos 'jugadores', mostramos la vista de jugadores */}
      {vistaActual === 'jugadores' && (
        <div>
          {/* HEADER */}
          <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wider text-white">SCOUTING <span className="text-emerald-400">360</span></h1>
                <p className="text-slate-400 text-xs">Plataforma Multiliga de Scouting y Analítica</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* SOLO ADMIN PUEDE CREAR JUGADORES */}
              {rolUsuario === 'admin' && (
                <button
                  onClick={abrirModalCrearJugador}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  + Nuevo Jugador
                </button>
              )}

              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-full font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Base DB Conectada
              </span>
            </div>
          </header>

          {/* NAVEGACIÓN PRINCIPAL */}
          <div className="max-w-7xl mx-auto mb-6 flex gap-4 border-b border-slate-800 pb-3">
            <button
              onClick={() => setPestañaActiva('jugadores')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${pestañaActiva === 'jugadores'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
            >
              Base de Jugadores
            </button>
            <button
              onClick={() => setPestañaActiva('informes')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${pestañaActiva === 'informes'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
            >
              Centro de Informes
            </button>
          </div>

          {pestañaActiva === 'jugadores' ? (
            <>
              {/* MÉTRICAS RÁPIDAS */}
              <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-semibold">Total Jugadores</p>
                    <p className="text-2xl font-bold text-white mt-1">{jugadores.length}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-slate-700" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-semibold">En Filtrado</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{jugadoresFiltrados.length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-emerald-500/20" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-semibold">Liga Actual</p>
                    <p className="text-xl font-bold text-amber-400 mt-1">{filtroLiga || 'Todas'}</p>
                  </div>
                  <Flame className="w-8 h-8 text-amber-500/20" />
                </div>
              </section>

              {/* PANEL DE FILTROS AVANZADOS */}
              <section className="max-w-7xl mx-auto bg-slate-900/80 border border-slate-800 rounded-xl p-5 mb-8 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de jugador..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <select
                      value={filtroPais}
                      onChange={(e) => setFiltroPais(e.target.value)}
                      className="bg-transparent w-full text-xs text-slate-200 focus:outline-none py-1"
                    >
                      <option value="" className="bg-slate-900">Todos los Países</option>
                      <option value="Argentina" className="bg-slate-900">Argentina</option>
                      <option value="Uruguay" className="bg-slate-900">Uruguay</option>
                      <option value="Chile" className="bg-slate-900">Chile</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <select
                      value={filtroLiga}
                      onChange={(e) => setFiltroLiga(e.target.value)}
                      className="bg-transparent w-full text-xs text-slate-200 focus:outline-none py-1"
                    >
                      <option value="" className="bg-slate-900">Todas las Ligas</option>
                      <option value="Promocional Amateur" className="bg-slate-900">Promocional Amateur (AFA)</option>
                      <option value="Primera Nacional" className="bg-slate-900">Primera Nacional</option>
                      <option value="Liga Profesional" className="bg-slate-900">Liga Profesional (LPF)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <select
                      value={filtroClub}
                      onChange={(e) => setFiltroClub(e.target.value)}
                      className="bg-transparent w-full text-xs text-slate-200 focus:outline-none py-1"
                    >
                      <option value="" className="bg-slate-900">Todos los Clubes</option>
                      {clubesDisponibles.map((clubNombre) => (
                        <option key={clubNombre} value={clubNombre} className="bg-slate-900">{clubNombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={filtroPosicion}
                      onChange={(e) => setFiltroPosicion(e.target.value)}
                      className="bg-transparent w-full text-xs text-slate-200 focus:outline-none py-1"
                    >
                      <option value="" className="bg-slate-900">Todas las Posiciones</option>
                      <option value="Delantero" className="bg-slate-900">Delantero / Extremo</option>
                      <option value="Mediocampista" className="bg-slate-900">Mediocampista</option>
                      <option value="Defensor" className="bg-slate-900">Defensor</option>
                      <option value="Arquero" className="bg-slate-900">Arquero</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={filtroPerfil}
                      onChange={(e) => setFiltroPerfil(e.target.value)}
                      className="bg-transparent w-full text-xs text-slate-200 focus:outline-none py-1"
                    >
                      <option value="" className="bg-slate-900">Cualquier Perfil</option>
                      <option value="Diestro" className="bg-slate-900">Diestro</option>
                      <option value="Zurdo" className="bg-slate-900">Zurdo</option>
                      <option value="Ambidextro" className="bg-slate-900">Ambidextro</option>
                    </select>
                  </div>
<div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Goles mínimos"
                      value={filtroGolesMin}
                      onChange={(e) => setFiltroGolesMin(e.target.value)}
                      className="bg-transparent w-full text-xs text-slate-200 focus:outline-none py-1 placeholder-slate-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Asistencias mínimas"
                      value={filtroAsistenciasMin}
                      onChange={(e) => setFiltroAsistenciasMin(e.target.value)}
                      className="bg-transparent w-full text-xs text-slate-200 focus:outline-none py-1 placeholder-slate-500"
                    />
                  </div>

                </div>
              </section>

              {/* GRILLA DE JUGADORES */}
              <section className="max-w-7xl mx-auto">
                {cargando ? (
                  <div className="text-center py-16">
                    <p className="text-slate-500 animate-pulse text-sm">Cargando base de datos de scouteo...</p>
                  </div>
                ) : jugadoresFiltrados.length === 0 ? (
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-12 text-center">
                    <p className="text-slate-400 font-medium">No se encontraron jugadores con los filtros seleccionados.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jugadoresFiltrados.map((jugador) => (
                      <div
                        key={jugador.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {jugador.nombre_completo}
                              </h3>
                              <p className="text-emerald-400 text-sm font-semibold mt-0.5">
                                {jugador.posicion_principal}
                              </p>
                            </div>
                            <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-md font-mono">
                              {jugador.perfil}
                            </span>
                          </div>

                          <div className="space-y-2.5 text-sm text-slate-400 border-t border-slate-800/80 pt-4 mb-6">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Club:</span>
                              <span className="text-slate-200 font-medium">{jugador.clubes?.nombre || 'Sin club'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Liga / País:</span>
                              <span className="text-slate-200">{jugador.liga || 'Promocional Amateur'} ({jugador.pais || 'ARG'})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Biotipo Físico:</span>
                              <span className="text-slate-200">{jugador.altura_cm ? `${jugador.altura_cm} cm` : '-'} / {jugador.peso_kg ? `${jugador.peso_kg} kg` : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Proyección:</span>
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded font-medium">
                                {jugador.proyeccion || 'En Evaluación'}
                              </span>
                            </div>

                            {/* SOLO ADMIN PUEDE EDITAR/ELIMINAR JUGADORES */}
                            {rolUsuario === 'admin' && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    abrirEditarJugador(jugador)
                                  }}
                                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    eliminarJugador(jugador.id, jugador.nombre_completo)
                                  }}
                                  className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded transition-colors"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setJugadorSeleccionado(jugador)}
                          className="w-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-bold py-2.5 rounded-lg transition-all duration-200 text-center flex items-center justify-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" /> Ver Ficha Completa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            /* CENTRO DE INFORMES */
            <section className="max-w-7xl mx-auto space-y-6">
              {/* SOLO ADMIN Y COLABORADORES PUEDEN CREAR INFORMES */}
              {(rolUsuario === 'admin' || rolUsuario === 'colaborador') && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalInformeJugador(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors"
                  >
                    + Nuevo Informe de Jugador
                  </button>
                  <button
                    onClick={() => setModalInformePartido(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors"
                  >
                    + Nuevo Análisis de Partido
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h2 className="text-lg font-bold text-white mb-4">Últimos Informes de Jugadores</h2>
                  {informesJugadores.length === 0 ? (
                    <p className="text-xs text-slate-500">No hay informes de jugadores registrados.</p>
                  ) : (
                    <div className="space-y-3">
                      {informesJugadores.map((inf) => (
                        <div key={inf.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs">
                          <p className="font-bold text-emerald-400">{inf.jugadores?.nombre_completo || 'Jugador'}</p>
                          <p className="text-slate-400">{inf.partido_observado}</p>
                          <p className="text-slate-500 mt-1">Rating: {inf.rating_general}/10 — {inf.recomendacion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h2 className="text-lg font-bold text-white mb-4">Últimos Análisis de Partidos</h2>
                  {informesPartidos.length === 0 ? (
                    <p className="text-xs text-slate-500">No hay análisis de partidos registrados.</p>
                  ) : (
                    <div className="space-y-3">
                      {informesPartidos.map((part) => (
                        <div key={part.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs">
                          <p className="font-bold text-white">{part.equipo_local} vs {part.equipo_visitante}</p>
                          <p className="text-slate-400">{part.jornada_liga}</p>
                          <p className="text-slate-500 mt-1">{part.resumen_general}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* MODAL FICHA COMPLETA DEL JUGADOR */}
          {jugadorSeleccionado && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 md:p-8 relative">
                <button
                  onClick={() => setJugadorSeleccionado(null)}
                  className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="border-b border-slate-800 pb-6 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-mono font-bold">
                      {jugadorSeleccionado.posicion_principal}
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-mono">
                      {jugadorSeleccionado.perfil}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white">{jugadorSeleccionado.nombre_completo}</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {jugadorSeleccionado.clubes?.nombre || 'Sin club'} — {jugadorSeleccionado.liga || 'Promocional Amateur'} ({jugadorSeleccionado.pais || 'Argentina'})
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" /> Perfil del Futbolista
                    </h3>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 text-sm">
                      
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-500">Edad</span>
                        <span className="text-slate-200 font-semibold">{calcularEdad(jugadorSeleccionado.fecha_nacimiento)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-500">Altura / Peso</span>
                        <span className="text-slate-200 font-semibold">{jugadorSeleccionado.altura_cm ? `${jugadorSeleccionado.altura_cm} cm` : '-'} / {jugadorSeleccionado.peso_kg ? `${jugadorSeleccionado.peso_kg} kg` : '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-500">Pierna Hábil</span>
                        <span className="text-slate-200 font-semibold">{jugadorSeleccionado.perfil}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-500">Proyección Scout</span>
                        <span className="text-emerald-400 font-bold">{jugadorSeleccionado.proyeccion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estado</span>
                        <span className="text-amber-400 font-semibold">En Seguimiento Activo</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> Evaluación Táctica
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Jugador con excelente visión de juego y primer pase romperlíneas. Destaca por su dinamismo en transición defensiva-ofensiva y agresividad para la presión tras pérdida.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Radar de Rendimiento
                    </h3>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={datosRadarEjemplo}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="atributo" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                          <Radar name={jugadorSeleccionado.nombre_completo} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Video de Highlights / Partidos Completos</p>
                      <p className="text-xs text-slate-400">Compacto táctico y jugadas destacadas acumuladas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Próximamente: Reproductor integrado de vídeo de scout')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                  >
                    Ver Clips
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL / PANEL DE CARGA DE DATOS DEL JUGADOR (ADMIN) */}
          {modalCrearAbierto && rolUsuario === 'admin' && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setModalCrearAbierto(false)
                    setIdJugadorEditando(null)
                  }}
                  className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-4">
                  {idJugadorEditando ? 'Editar Jugador' : 'Panel de Carga de Datos del Jugador'}
                </h2>

                <form onSubmit={guardarNuevoJugador} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={nuevoJugador.nombre_completo}
                      onChange={(e) => setNuevoJugador({ ...nuevoJugador, nombre_completo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: Lautaro Martínez"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">ID del Club Actual</label>
                      <input
                        type="text"
                        value={nuevoJugador.club_id}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, club_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        placeholder="UUID del club"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={nuevoJugador.fecha_nacimiento}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, fecha_nacimiento: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Posición Principal</label>
                      <select
                        value={nuevoJugador.posicion_principal}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, posicion_principal: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Delantero">Delantero</option>
                        <option value="Mediocampista">Mediocampista</option>
                        <option value="Defensor">Defensor</option>
                        <option value="Arquero">Arquero</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Perfil (Pierna)</label>
                      <select
                        value={nuevoJugador.perfil}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, perfil: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Diestro">Diestro</option>
                        <option value="Zurdo">Zurdo</option>
                        <option value="Ambidextro">Ambidextro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Altura (cm)</label>
                      <input
                        type="number"
                        value={nuevoJugador.altura_cm}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, altura_cm: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        placeholder="180"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        value={nuevoJugador.peso_kg}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, peso_kg: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        placeholder="75"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">País</label>
                      <input
                        type="text"
                        value={nuevoJugador.pais}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, pais: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Liga</label>
                      <input
                        type="text"
                        value={nuevoJugador.liga}
                        onChange={(e) => setNuevoJugador({ ...nuevoJugador, liga: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={guardando}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 font-bold py-2.5 rounded-lg transition-colors text-sm"
                    >
                      {guardando ? 'Guardando en Supabase...' : idJugadorEditando ? 'Actualizar Jugador' : 'Guardar Jugador en Panel'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: SEGUIMIENTO DE JUGADOR (ADMIN Y COLABORADOR) */}
          {modalInformeJugador && (rolUsuario === 'admin' || rolUsuario === 'colaborador') && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 my-8 space-y-6 text-slate-200">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h2 className="text-xl font-bold text-white">Nuevo Informe de Seguimiento</h2>
                  <button
                    onClick={() => setModalInformeJugador(false)}
                    className="text-slate-400 hover:text-white font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const formData = new FormData(form)

                  const payload = {
                    jugador_id: formData.get('jugador_id'),
                    partido_observado: formData.get('partido_observado'),
                    rating_general: Number(formData.get('rating_general')),
                    recomendacion: formData.get('recomendacion'),
                    duelos: Number(formData.get('duelos')),
                    pases: Number(formData.get('pases')),
                    ubicacion: Number(formData.get('ubicacion')),
                    fisico: Number(formData.get('fisico')),
                    marca: Number(formData.get('marca')),
                    fortalezas: formData.get('fortalezas'),
                    debilidades: formData.get('debilidades'),
                    actitud: formData.get('actitud'),
                    colaborador_nombre: formData.get('colaborador_nombre'),
                    colaborador_red_social: formData.get('colaborador_red_social'),
                    estado: 'pendiente'
                  }

                  const { error } = await supabase.from('informes_jugadores').insert([payload])
                  if (error) {
                    alert('Error al guardar el informe: ' + error.message)
                  } else {
                    alert('¡Informe enviado con éxito a revisión!')
                    setModalInformeJugador(false)
                    cargarInformes()
                  }
                }} className="space-y-4 text-xs">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Jugador Observado *</label>
                      <select name="jugador_id" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
                        <option value="">Seleccionar jugador...</option>
                        {jugadores.map(j => (
                          <option key={j.id} value={j.id}>{j.nombre_completo} ({j.posicion_principal})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Partido Observado *</label>
                      <input name="partido_observado" required placeholder="Ej: San Lorenzo vs River (Fecha 5)" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Rating General (1 al 10) *</label>
                      <input name="rating_general" type="number" min="1" max="10" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Recomendación Final</label>
                      <select name="recomendacion" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
                        <option value="Fichar">Fichar inmediatamente</option>
                        <option value="Seguir observando">Seguir observando</option>
                        <option value="Descartar">Descartar por el momento</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-b border-slate-800 py-3 my-2">
                    <p className="font-bold text-slate-300 mb-2">Métricas Técnicas Individuales (1 al 10)</p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {['duelos', 'pases', 'ubicacion', 'fisico', 'marca'].map((metric) => (
                        <div key={metric}>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">{metric}</label>
                          <input name={metric} type="number" min="1" max="10" defaultValue="5" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-emerald-400 font-bold" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Fortalezas</label>
                    <textarea name="fortalezas" rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Potencia en el mano a mano, visión periférica..." />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Debilidades</label>
                    <textarea name="debilidades" rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Perfil zurdo poco trabajado, retorno lento..." />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Actitud y Comportamiento</label>
                    <textarea name="actitud" rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Liderazgo, entrega en la presión, temperamento..." />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Tu Nombre (Colaborador) *</label>
                      <input name="colaborador_nombre" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Link Red Social (X / LinkedIn / IG)</label>
                      <input name="colaborador_red_social" placeholder="https://x.com/tu_usuario" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg text-sm transition-colors mt-4">
                    Enviar Informe a Revisión
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: ANÁLISIS DE PARTIDO (ADMIN Y COLABORADOR) */}
          {modalInformePartido && (rolUsuario === 'admin' || rolUsuario === 'colaborador') && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 my-auto max-h-[90vh] flex flex-col space-y-6 text-slate-200">

                <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-white">Nuevo Análisis de Partido</h2>
                    <p className="text-xs text-slate-400">Completá el desglose táctico, los destacados y la línea de tiempo del encuentro.</p>
                  </div>
                  <button onClick={() => setModalInformePartido(false)} className="text-slate-400 hover:text-white font-bold p-1 text-lg">✕</button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const formData = new FormData(form)

                  const payload = {
                    fecha_partido: formData.get('fecha_partido'),
                    equipo_local: formData.get('equipo_local'),
                    equipo_visitante: formData.get('equipo_visitante'),
                    jornada_liga: formData.get('jornada_liga'),
                    resumen_general: formData.get('resumen_general'),

                    puntaje_local: Number(formData.get('puntaje_local')),
                    local_fase_ofensiva: formData.get('local_fase_ofensiva'),
                    local_fase_defensiva: formData.get('local_fase_defensiva'),
                    local_transiciones: formData.get('local_transiciones'),
                    local_abp: formData.get('local_abp'),

                    puntaje_visitante: Number(formData.get('puntaje_visitante')),
                    visitante_fase_ofensiva: formData.get('visitante_fase_ofensiva'),
                    visitante_fase_defensiva: formData.get('visitante_fase_defensiva'),
                    visitante_transiciones: formData.get('visitante_transiciones'),
                    visitante_abp: formData.get('visitante_abp'),

                    jugadores_destacados: {
                      destacados: jugadoresDestacados,
                      linea_tiempo: lineaTiempo
                    },

                    conclusion_final: formData.get('conclusion_final'),
                    colaborador_nombre: formData.get('colaborador_nombre'),
                    colaborador_red_social: formData.get('colaborador_red_social'),
                    estado: 'pendiente'
                  }

                  const { data, error } = await supabase.from('informes_partidos').insert([payload]).select()

                  if (error) {
                    alert('Error al enviar el informe: ' + error.message)
                  } else if (data && data[0]) {
                    try {
                      await guardarAnalisisPartido(data[0].id, lineaTiempo)
                      alert('¡Análisis de partido enviado con éxito a revisión!')
                    } catch (err) {
                      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
                      alert('Se guardó el informe pero hubo un problema con la línea de tiempo: ' + mensaje)
                    } finally {
                      setModalInformePartido(false)
                      cargarInformes()
                    }
                  }
                }} className="space-y-6 text-xs overflow-y-auto pr-2 flex-1">

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-slate-400 mb-1">Fecha *</label>
                      <input name="fecha_partido" type="date" required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Equipo Local *</label>
                      <input name="equipo_local" required placeholder="Ej: San Lorenzo" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Equipo Visitante *</label>
                      <input name="equipo_visitante" required placeholder="Ej: Huracán" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Jornada / Competencia</label>
                      <input name="jornada_liga" placeholder="Ej: Fecha 7 - Promocional" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">Resumen General del Partido</label>
                    <textarea name="resumen_general" rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Síntesis del trámite del partido..." />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div>
                        <h3 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Línea de Tiempo (Goles, Tarjetas, Asistencias)</h3>
                        <p className="text-[10px] text-slate-500 font-normal">Registrá los sucesos para armar la base de datos de estadísticas.</p>
                      </div>
                      <button type="button" onClick={agregarEvento} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded hover:bg-emerald-500/20 font-bold">
                        + Agregar Evento
                      </button>
                    </div>

                    {lineaTiempo.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900/60 p-2 rounded border border-slate-800">
                        <input
                          placeholder="Min"
                          value={item.minuto}
                          onChange={(e) => {
                            const copy = [...lineaTiempo]
                            copy[idx].minuto = e.target.value
                            setLineaTiempo(copy)
                          }}
                          className="col-span-2 sm:col-span-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-white"
                        />
                        <select
                          value={item.equipo}
                          onChange={(e) => {
                            const copy = [...lineaTiempo]
                            copy[idx].equipo = e.target.value
                            setLineaTiempo(copy)
                          }}
                          className="col-span-3 sm:col-span-2 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                        >
                          <option value="Local">Local</option>
                          <option value="Visitante">Visitante</option>
                        </select>
                        <select
                          value={item.evento}
                          onChange={(e) => {
                            const copy = [...lineaTiempo]
                            copy[idx].evento = e.target.value
                            setLineaTiempo(copy)
                          }}
                          className="col-span-3 sm:col-span-2 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                        >
                          <option value="Gol">⚽ Gol</option>
                          <option value="Asistencia">🎯 Asistencia</option>
                          <option value="Tarjeta Amarilla">🟨 Amarilla</option>
                          <option value="Tarjeta Roja">🟥 Roja</option>
                          <option value="Cambio">🔄 Cambio</option>
                        </select>
                        <input
                          placeholder="Jugador involucrado"
                          value={item.jugador}
                          onChange={(e) => {
                            const copy = [...lineaTiempo]
                            copy[idx].jugador = e.target.value
                            setLineaTiempo(copy)
                          }}
                          className="col-span-4 sm:col-span-4 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                        />
                        <button type="button" onClick={() => quitarEvento(idx)} className="col-span-12 sm:col-span-3 text-red-400 hover:text-red-300 text-right pr-2">
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 className="font-bold text-white uppercase text-[11px]">Equipo Local</h3>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Puntaje:</span>
                          <input name="puntaje_local" type="number" min="1" max="10" defaultValue="6" className="w-12 bg-slate-900 border border-slate-700 rounded p-1 text-center font-bold text-emerald-400" />
                        </div>
                      </div>
                      <textarea name="local_fase_ofensiva" rows={2} placeholder="Fase Ofensiva (Iniciación, creación, finalización)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                      <textarea name="local_fase_defensiva" rows={2} placeholder="Fase Defensiva (Presión, repliegue, organización)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                      <textarea name="local_transiciones" rows={2} placeholder="Transiciones (Ataque-Defensa / Defensa-Ataque)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                      <textarea name="local_abp" rows={2} placeholder="A.B.P. (Acciones a Balón Parado)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 className="font-bold text-white uppercase text-[11px]">Equipo Visitante</h3>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Puntaje:</span>
                          <input name="puntaje_visitante" type="number" min="1" max="10" defaultValue="6" className="w-12 bg-slate-900 border border-slate-700 rounded p-1 text-center font-bold text-emerald-400" />
                        </div>
                      </div>
                      <textarea name="visitante_fase_ofensiva" rows={2} placeholder="Fase Ofensiva (Iniciación, creación, finalización)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                      <textarea name="visitante_fase_defensiva" rows={2} placeholder="Fase Defensiva (Presión, repliegue, organización)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                      <textarea name="visitante_transiciones" rows={2} placeholder="Transiciones (Ataque-Defensa / Defensa-Ataque)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                      <textarea name="visitante_abp" rows={2} placeholder="A.B.P. (Acciones a Balón Parado)..." className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white" />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Jugadores Destacados ({jugadoresDestacados.length}/4)</h3>
                      {jugadoresDestacados.length < 4 && (
                        <button type="button" onClick={agregarDestacado} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded hover:bg-emerald-500/20 font-bold">
                          + Agregar Jugador Destacado
                        </button>
                      )}
                    </div>

                    {jugadoresDestacados.map((item, idx) => (
                      <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex justify-between gap-2">
                          <input placeholder="Nombre completo del jugador" value={item.nombre} onChange={(e) => {
                            const copy = [...jugadoresDestacados]
                            copy[idx].nombre = e.target.value
                            setJugadoresDestacados(copy)
                          }} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
                          <input placeholder="Posición" value={item.posicion} onChange={(e) => {
                            const copy = [...jugadoresDestacados]
                            copy[idx].posicion = e.target.value
                            setJugadoresDestacados(copy)
                          }} className="w-1/3 bg-slate-950 border border-slate-800 rounded p-2 text-white" />
                          {jugadoresDestacados.length > 1 && (
                            <button type="button" onClick={() => quitarDestacado(idx)} className="text-red-400 text-xs px-2">✕</button>
                          )}
                        </div>

                        <div className="grid grid-cols-5 gap-2 text-center py-1">
                          {['general', 'fisico', 'tecnico', 'tactico', 'potencia'].map((m) => (
                            <div key={m}>
                              <label className="block text-[9px] uppercase text-slate-400">{m}</label>
                              <input type="number" min="1" max="10" value={item[m]} onChange={(e) => {
                                const copy = [...jugadoresDestacados]
                                copy[idx][m] = Number(e.target.value)
                                setJugadoresDestacados(copy)
                              }} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center font-bold text-emerald-400" />
                            </div>
                          ))}
                        </div>

                        <textarea placeholder="Análisis individual de este jugador..." value={item.evaluacion} onChange={(e) => {
                          const copy = [...jugadoresDestacados]
                          copy[idx].evaluacion = e.target.value
                          setJugadoresDestacados(copy)
                        }} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" rows={2} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">Conclusión Final</label>
                      <textarea name="conclusion_final" rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Conclusión global del encuentro..." />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Tu Nombre (Colaborador) *</label>
                        <input name="colaborador_nombre" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Link Red Social (X / LinkedIn / IG)</label>
                        <input name="colaborador_red_social" placeholder="https://x.com/tu_usuario" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg text-sm transition-colors">
                    Enviar Análisis a Revisión
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}