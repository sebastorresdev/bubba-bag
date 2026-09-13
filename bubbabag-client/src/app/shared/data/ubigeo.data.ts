/**
 * Catálogo Oficial de Ubigeo de la República del Perú
 * Incluye Departamentos, Provincias y Distritos comerciales y urbanos
 */

export interface UbigeoEstructura {
  [departamento: string]: {
    [provincia: string]: string[];
  };
}

export const UBIGEO_PERU: UbigeoEstructura = {
  Lima: {
    Lima: [
      'Miraflores',
      'San Isidro',
      'Santiago de Surco',
      'San Borja',
      'La Molina',
      'Barranco',
      'San Miguel',
      'Magdalena del Mar',
      'Jesús María',
      'Lince',
      'Pueblo Libre',
      'Lima (Cercado)',
      'Surquillo',
      'Chorrillos',
      'San Juan de Miraflores',
      'Villa María del Triunfo',
      'Villa El Salvador',
      'San Juan de Lurigancho',
      'Ate',
      'Santa Anita',
      'El Agustino',
      'Los Olivos',
      'San Martín de Porres',
      'Comas',
      'Independencia',
      'Rímac',
      'Breña',
      'Lurigancho (Chosica)',
      'Chaclacayo',
      'Cieneguilla',
      'Lurín',
      'Pachacámac',
      'Puente Piedra',
      'Carabayllo',
      'Ancón',
      'Santa Rosa',
      'Punta Hermosa',
      'Punta Negra',
      'San Bartolo',
      'Pucusana',
      'Santa María del Mar',
    ],
    Callao: [
      'Callao (Cercado)',
      'Bellavista',
      'Carmen de la Legua Reynoso',
      'La Perla',
      'La Punta',
      'Ventanilla',
      'Mi Perú',
    ],
    Cañete: [
      'San Vicente de Cañete',
      'Asia',
      'Mala',
      'Chilca',
      'Imperial',
      'Nuevo Imperial',
      'Quilmaná',
      'Lunahuaná',
      'Cerro Azul',
      'San Antonio',
    ],
    Huaral: ['Huaral', 'Chancay', 'Aucallama', 'Ihuarí', 'Atavillos Alto'],
    Barranca: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'],
    Huaura: ['Huacho', 'Hualmay', 'Santa María', 'Sayán', 'Caleta de Carquín', 'Végueta'],
    Huarochirí: ['Matucana', 'Santa Eulalia', 'Ricardo Palma', 'San Antonio'],
  },
  Callao: {
    Callao: [
      'Callao',
      'Bellavista',
      'Carmen de la Legua',
      'La Perla',
      'La Punta',
      'Ventanilla',
      'Mi Perú',
    ],
  },
  Arequipa: {
    Arequipa: [
      'Arequipa (Cercado)',
      'Cayma',
      'Cerro Colorado',
      'Yanahuara',
      'José Luis Bustamante y Rivero',
      'Paucarpata',
      'Socabaya',
      'Miraflores',
      'Mariano Melgar',
      'Sachaca',
      'Tiabaya',
      'Jacobo Hunter',
      'Alto Selva Alegre',
      'Uchumayo',
      'Yura',
    ],
    Camaná: ['Camaná', 'José María Quimper', 'Mariscal Cáceres', 'Nicolás de Piérola', 'Samuel Pastor'],
    Islay: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón'],
    Caylloma: ['Chivay', 'Majes', 'Cabanaconde', 'Huambo'],
  },
  Cusco: {
    Cusco: ['Cusco', 'Wanchaq', 'San Sebastián', 'Santiago', 'San Jerónimo', 'Saylla', 'Poroy', 'Ccorca'],
    Urubamba: ['Urubamba', 'Ollantaytambo', 'Machupicchu', 'Maras', 'Chinchero', 'Yucay'],
    Calca: ['Calca', 'Pisac', 'Lamay', 'San Salvador', 'Taray'],
    Anta: ['Anta', 'Huarocondo', 'Limatambo', 'Zurite'],
    LaConvención: ['Santa Ana (Quillabamba)', 'Echarate', 'Maránura', 'Vilcabamba'],
  },
  'La Libertad': {
    Trujillo: [
      'Trujillo',
      'Víctor Larco Herrera',
      'Huanchaco',
      'Moche',
      'El Porvenir',
      'La Esperanza',
      'Florencia de Mora',
      'Laredo',
      'Salaverry',
    ],
    Ascope: ['Ascope', 'Chicama', 'Chocope', 'Magdalena de Cao', 'Paiján', 'Rázuri'],
    Chepén: ['Chepén', 'Pacanga', 'Pueblo Nuevo'],
    Pacasmayo: ['San Pedro de Lloc', 'Guadalupe', 'Pacasmayo', 'San José'],
  },
  Piura: {
    Piura: ['Piura', 'Castilla', 'Veintiséis de Octubre', 'Catacaos', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande'],
    Sullana: ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Querecotillo', 'Salitral'],
    Talara: ['Pariñas (Talara)', 'El Alto', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora'],
    Paita: ['Paita', 'Amotape', 'Colán', 'La Huaca', 'Tamarindo', 'Vichayal'],
    Morropón: ['Chulucanas', 'Buenos Aires', 'La Matanza', 'Morropón', 'Salitral'],
  },
  Lambayeque: {
    Chiclayo: [
      'Chiclayo',
      'José Leonardo Ortiz',
      'La Victoria',
      'Monsefú',
      'Pimentel',
      'Reque',
      'Santa Rosa',
      'Eten',
      'Puerto Eten',
      'Oyotún',
    ],
    Lambayeque: ['Lambayeque', 'Mórrope', 'Motupe', 'Olmos', 'Jayanca', 'Illimo', 'Túcume', 'San José'],
    Ferreñafe: ['Ferreñafe', 'Cañaris', 'Incahuasi', 'Manuel Antonio Mesones Muro', 'Pítipo', 'Pueblo Nuevo'],
  },
  Junín: {
    Huancayo: ['Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo', 'San Agustín', 'San Jerónimo de Tunán', 'Sicaya'],
    Chanchamayo: ['Chanchamayo (La Merced)', 'Perené', 'Pichanaqui', 'San Luis de Shuaro', 'San Ramón', 'Vitoc'],
    Tarma: ['Tarma', 'Acobamba', 'Huasahuasi', 'Palca', 'Tapo'],
    Satipo: ['Satipo', 'Coviriali', 'Mazamari', 'Pangoa', 'Río Negro', 'Río Tambo'],
    Jauja: ['Jauja', 'Acolla', 'Yauyos', 'Mollamarca', 'Paca'],
    Yauli: ['La Oroya', 'Chacapalpa', 'Huay-Huay', 'Morococha', 'Santa Rosa de Sacco'],
  },
  Áncash: {
    Santa: ['Chimbote', 'Nuevo Chimbote', 'Coishco', 'Samanco', 'Santa', 'Nepeña', 'Moro', 'Cáceres del Perú'],
    Huaraz: ['Huaraz', 'Independencia', 'Jangas', 'Olleros', 'Tarica'],
    Huarmey: ['Huarmey', 'Culebras'],
    Casma: ['Casma', 'Buena Vista Alta', 'Comandante Noel', 'Yaután'],
  },
  Ica: {
    Ica: ['Ica', 'La Tinguiña', 'Los Aquijes', 'Parcona', 'Subtanjalla', 'San Juan Bautista', 'Santiago', 'Salas (Guadalupe)'],
    Chincha: ['Chincha Alta', 'Chincha Baja', 'El Carmen', 'Grocio Prado', 'Pueblo Nuevo', 'Sunampe', 'Tambo de Mora'],
    Pisco: ['Pisco', 'Paracas', 'San Andrés', 'San Clemente', 'Túpac Amaru Inca'],
    Nasca: ['Nasca', 'Changuillo', 'El Ingenio', 'Marcona', 'Vista Alegre'],
    Palpa: ['Palpa', 'Llipata', 'Río Grande', 'Santa Cruz', 'Tibillo'],
  },
  'San Martín': {
    'San Martín': ['Tarapoto', 'Morales', 'La Banda de Shilcayo', 'Cacatachi', 'Juan Guerra', 'Sauce', 'Shapaja'],
    Moyobamba: ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantaló'],
    Rioja: ['Rioja', 'Awajún', 'Elias Soplin Vargas', 'Nueva Cajamarca', 'Pardo Miguel', 'Posic', 'San Fernando', 'Yorongos'],
    Lamas: ['Lamas', 'Barranquita', 'Caynarachi', 'Pinto Recodo', 'Tabalosos', 'Zapatero'],
    MariscalCáceres: ['Juanjuí', 'Campanilla', 'Huicungo', 'Pachiza', 'Pajarillo'],
  },
  Loreto: {
    Maynas: ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazán', 'Punchana', 'San Juan Bautista', 'Belén'],
    AltoAmazonas: ['Yurimaguas', 'Balsapuerto', 'Jeberos', 'Lagunas', 'Santa Cruz', 'Teniente César López Rojas'],
  },
  Ucayali: {
    'Coronel Portillo': ['Callería (Pucallpa)', 'Campoverde', 'Iparía', 'Masisea', 'Yarinacocha', 'Nueva Requena', 'Manantay'],
    PadreAbad: ['Padre Abad (Aguaytía)', 'Irázola', 'Curimaná', 'Neshuya', 'Alexander Von Humboldt'],
  },
  Cajamarca: {
    Cajamarca: ['Cajamarca', 'Baños del Inca', 'Encañada', 'Jesús', 'Llacanora', 'Los Baños', 'Magdalena'],
    Jaén: ['Jaén', 'Bellavista', 'Chontalí', 'Colasay', 'Huabal', 'Las Pirias', 'Pomahuaca', 'Pucará', 'Sallique', 'San Felipe', 'San José del Alto', 'Santa Rosa'],
    Chota: ['Chota', 'Anguía', 'Chadín', 'Chalamarca', 'Chiguirip', 'Chimban', 'Cochabamba', 'Conchán', 'Huambos', 'Lajas', 'Paccha', 'Pión', 'Querocoto', 'Tacabamba', 'Tocmoche'],
  },
  Tacna: {
    Tacna: ['Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Coronel Gregorio Albarracín Ponce', 'Inclán', 'Pachía', 'Palca', 'Pocollay', 'Sama'],
    Ilo: ['Ilo', 'El Algarrobal', 'Pacocha'],
  },
  Moquegua: {
    'Mariscal Nieto': ['Moquegua', 'Carumas', 'Cuchumbaya', 'Samegua', 'San Cristóbal', 'Torata'],
    Ilo: ['Ilo', 'El Algarrobal', 'Pacocha'],
  },
  Puno: {
    Puno: ['Puno', 'Acora', 'Amantaní', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata', 'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca'],
    SanRomán: ['Juliaca', 'Cabana', 'Cabanillas', 'Caracoto'],
  },
  Huánuco: {
    Huánuco: ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Pillco Marca', 'Santa María del Valle'],
    LeoncioPrado: ['Rupa-Rupa (Tingo María)', 'Castillo Grande', 'Dámaso Beraún', 'José Crespo y Castillo', 'Luyando', 'Mariano Dámaso Beraún'],
  },
  Ayacucho: {
    Huamanga: ['Ayacucho', 'Acocro', 'Acos Vinchos', 'Carmen Alto', 'Chiara', 'Jesús Nazareno', 'San Juan Bautista', 'Socos', 'Tambillo', 'Vinchos'],
  },
  Huancavelica: {
    Huancavelica: ['Huancavelica', 'Acobambilla', 'Acoria', 'Ascensión', 'Conayca', 'Cuenca', 'Huachocolpa', 'Huayllahuara', 'Izcuchaca', 'Laria', 'Manta', 'Mariscal Cáceres', 'Moya', 'Nuevo Occoro', 'Palca', 'Pilchaca', 'Vilca', 'Yauli'],
  },
  Apurímac: {
    Abancay: ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua', 'San Pedro de Cachora', 'Tamburco'],
    Andahuaylas: ['Andahuaylas', 'Andarapa', 'Chiara', 'Huancarama', 'Huancaray', 'Kishuará', 'Paciencia', 'Pacucha', 'Pampachiri', 'San Antonio de Cachi', 'San Jerónimo', 'San Miguel de Chaccrampa', 'Santa María de Chicmo', 'Talavera', 'Tumay Huaraca', 'Turpo', 'Kaquiabamba'],
  },
  Pasco: {
    Pasco: ['Chaupimarca (Cerro de Pasco)', 'Huachón', 'Huariaca', 'Huayllay', 'Ninacaca', 'Pallanchacra', 'Paucartambo', 'San Francisco de Asís de Yarusyacán', 'Simón Bolívar', 'Ticlacayán', 'Tinyahuarco', 'Vicco', 'Yanacancha'],
    Oxapampa: ['Oxapampa', 'Chontabamba', 'Huancabamba', 'Palcazú', 'Pozuzo', 'Puerto Bermúdez', 'Villa Rica', 'Constitución'],
  },
  Tumbes: {
    Tumbes: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'],
    Zarumilla: ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal'],
    ContralmiranteVillar: ['Zorritos', 'Casitas', 'Canoas de Punta Sal'],
  },
  Amazonas: {
    Chachapoyas: ['Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Chiliquin', 'Chuquibamba', 'Granada', 'Huancas', 'La Jalca', 'Leimebamba', 'Levanto', 'Magdalena', 'Mariscal Castilla', 'Molinopampa', 'Montevideo', 'Olleros', 'Quinjalca', 'San Francisco de Daguas', 'Soloco', 'Sonche'],
    Bagua: ['Bagua', 'Aramango', 'Copallín', 'El Parco', 'Imaza', 'La Peca'],
    Utcubamba: ['Bagua Grande', 'Cajaruro', 'Cumba', 'El Milagro', 'Jamalca', 'Lonya Grande', 'Yamón'],
  },
  'Madre de Dios': {
    Tambopata: ['Tambopata (Puerto Maldonado)', 'Inambari', 'Las Piedras', 'Laberinto'],
  },
};

export function getDepartamentos(): string[] {
  return Object.keys(UBIGEO_PERU).sort();
}

export function getProvincias(departamento: string): string[] {
  if (!departamento || !UBIGEO_PERU[departamento]) return [];
  return Object.keys(UBIGEO_PERU[departamento]).sort();
}

export function getDistritos(departamento: string, provincia: string): string[] {
  if (!departamento || !provincia || !UBIGEO_PERU[departamento] || !UBIGEO_PERU[departamento][provincia]) {
    return [];
  }
  return [...UBIGEO_PERU[departamento][provincia]].sort();
}
