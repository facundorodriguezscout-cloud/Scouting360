import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

// PEGÁ ACÁ TU URI COMPLETA CON TU PASSWORD REAL
const connectionString = 'postgresql://postgres:fEuyqZA0RZH953eF@db.lhxwfnhljuuepettqfyh.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function cargarDatos() {
  console.log('🚀 Conectando directamente a la base de datos de Supabase...\n');

  try {
    await client.connect();

    const rawData = fs.readFileSync('./datos_completos.json', 'utf-8');
    const equipos = JSON.parse(rawData);

    for (const eq of equipos) {
      console.log(`📌 Procesando club: ${eq.nombre_equipo}...`);

      // A. Buscar si el club ya existe
      let clubResult = await client.query(
        'SELECT id FROM clubes WHERE nombre = $1 LIMIT 1',
        [eq.nombre_equipo]
      );

      let clubId;

      if (clubResult.rows.length > 0) {
        clubId = clubResult.rows[0].id;
      } else {
        // B. Insertar club si no existe
        const insertClubRes = await client.query(
          'INSERT INTO clubes (nombre) VALUES ($1) RETURNING id',
          [eq.nombre_equipo]
        );
        clubId = insertClubRes.rows[0].id;
      }

      // C. Insertar jugadores uno por uno
      let contadorJugadores = 0;
      for (const j of eq.jugadores) {
        const perfilValue = j.pie_habil !== "No especificado" ? j.pie_habil : null;

        await client.query(`
          INSERT INTO jugadores (
            nombre_completo, club_id, posicion_principal, perfil, 
            altura_cm, pais, liga, estado, partidos_jugados, 
            goles, asistencias, tarjetas_amarillas, tarjetas_rojas
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          j.nombre_completo,
          clubId,
          j.posicion,
          perfilValue,
          j.altura_cm,
          j.nacionalidad,
          eq.liga,
          'Activo',
          0, 0, 0, 0, 0
        ]);
        contadorJugadores++;
      }

      console.log(`✅ ¡${contadorJugadores} jugadores cargados para ${eq.nombre_equipo}!\n`);
    }

    console.log('🎉 ¡Carga finalizada con éxito!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await client.end();
  }
}

cargarDatos();