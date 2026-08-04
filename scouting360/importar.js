import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:fEuyqZA0RZH953eF@db.lhxwfnhljuuepettqfyh.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function cargarDatos() {
  console.log('🚀 Conectando a Supabase para actualizar los 900+ jugadores...\n');

  try {
    await client.connect();

    // 1. Limpiamos las tablas para cargar la información limpia sin duplicados
    console.log('🧹 Limpiando datos antiguos en Supabase...');
    await client.query('TRUNCATE TABLE jugadores, clubes RESTART IDENTITY CASCADE;');

    const rawData = fs.readFileSync('./datos_completos.json', 'utf-8');
    const equipos = JSON.parse(rawData);

    for (const eq of equipos) {
      console.log(`📌 Procesando club: ${eq.nombre_equipo}...`);

      // A. Buscar o Insertar club
      let clubResult = await client.query(
        'SELECT id FROM clubes WHERE nombre = $1 LIMIT 1',
        [eq.nombre_equipo]
      );

      let clubId;

      if (clubResult.rows.length > 0) {
        clubId = clubResult.rows[0].id;
      } else {
        const insertClubRes = await client.query(
          'INSERT INTO clubes (nombre) VALUES ($1) RETURNING id',
          [eq.nombre_equipo]
        );
        clubId = insertClubRes.rows[0].id;
      }

      // B. Insertar jugadores con TODOS los datos mapeados
      let contadorJugadores = 0;
      for (const j of eq.jugadores) {
        // Mapeo de Pierna Hábil -> Perfil
        const perfilValue = (j.pie_habil && j.pie_habil !== "No especificado") ? j.pie_habil : null;
        
        // Mapeo de Edad -> Fecha de Nacimiento (Aproximada)
        let fechaNacimiento = null;
        if (j.edad) {
          const anioNacimiento = new Date().getFullYear() - j.edad;
          fechaNacimiento = `${anioNacimiento}-01-01`;
        }

        // Mapeo de Altura y Peso
        const altura = j.altura_cm || null;
        const peso = j.peso_kg || null;

        await client.query(`
          INSERT INTO jugadores (
            nombre_completo, club_id, posicion_principal, perfil, 
            altura_cm, peso_kg, fecha_nacimiento, pais, liga, estado, 
            partidos_jugados, goles, asistencias, tarjetas_amarillas, tarjetas_rojas
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          j.nombre_completo,
          clubId,
          j.posicion || 'Sin Posición',
          perfilValue,
          altura,
          peso,
          fechaNacimiento,
          j.nacionalidad || 'Argentina',
          eq.liga || 'Promocional Amateur',
          'Activo',
          0, 0, 0, 0, 0
        ]);
        contadorJugadores++;
      }

      console.log(`✅ ¡${contadorJugadores} jugadores actualizados para ${eq.nombre_equipo}!\n`);
    }

    console.log('🎉 ¡Carga masiva finalizada con éxito para todos los jugadores!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await client.end();
  }
}

cargarDatos();