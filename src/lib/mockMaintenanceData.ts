import type { OrdenMantenimiento } from '@/stores/maintenanceStore';

export function generateMockMaintenanceData(count = 500): OrdenMantenimiento[] {
  const areas = [
    'Equipo Pesado',
    'Engrase',
    'Cosecha Mecanizada',
    'Cosecha Agricola',
    'TEST',
    'Servicios Generales',
    'Mecanica de Transporte'
  ];
  const sistemas = ['Hidráulico', 'Neumático', 'Eléctrico', 'Mecánico', 'Control'];
  const procesos = ['Preventivo', 'Correctivo', 'Predictivo', 'Inspección'];
  const estatusList = ['Programado', 'En Proceso', 'Concluida'];
  const etapas = ['Ejecución', 'Diagnóstico', 'Espera de Refacciones', 'Cierre'];
  const items = ['Motor', 'Bomba', 'Compresor', 'Actuador', 'Tablero'];

  const getRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  const formatDate = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  const data: OrdenMantenimiento[] = [];

  for (let i = 0; i < count; i++) {
    const isSg = Math.random() > 0.9; // 10% are SG
    
    // Ensure ids do not match ignore list ("SG-%" or "OM-TEST-%") so they behave like real valid ones
    const idOrden = `OM-MOCK-${Math.floor(Math.random() * 90000) + 10000}`;
    
    // Dates
    const now = new Date();
    const startDate = getRandomDate(new Date(now.getFullYear(), now.getMonth() - 2, 1), now);
    const endDate = new Date(startDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    const randomEstatus = estatusList[Math.floor(Math.random() * estatusList.length)];
    const equipNum = Math.floor(Math.random() * 100) + 1;
    const reqCompra = Math.random() > 0.7;

    const totalOts = Math.floor(Math.random() * 5) + 1;
    const otsConcluidas = Math.floor(Math.random() * (totalOts + 1));
    const otsPendientes = totalOts - otsConcluidas;

    // Get week string e.g. "42", "43"
    const getWeek = (d: Date) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    data.push({
      "ID_Orden mantenimiento": idOrden,
      Área: areas[Math.floor(Math.random() * areas.length)],
      "ID_#EQUIPO": `EQ-${equipNum.toString().padStart(3, '0')}`,
      "ITEM": items[Math.floor(Math.random() * items.length)],
      "Sistema": sistemas[Math.floor(Math.random() * sistemas.length)],
      "Descripcion": `Mantenimiento mock generado ${i + 1}`,
      "Tipo de Proceso": procesos[Math.floor(Math.random() * procesos.length)],
      "Estatus": randomEstatus,
      "Fecha inicio": formatDate(startDate),
      "Fecha conclusion": formatDate(endDate),
      "Tiene solicitud de compra?": reqCompra,
      "N° solicitud": reqCompra ? `REQ-${Math.floor(Math.random() * 10000)}` : '',
      "N° Orden de compra": reqCompra ? `OC-${Math.floor(Math.random() * 10000)}` : '',
      "Fecha Entrega": formatDate(new Date(endDate.getTime() + 86400000 * 3)),
      "Observaciones": "Datos generados automáticamente.",
      "Semana": String(getWeek(startDate)),
      "Etapa": etapas[Math.floor(Math.random() * etapas.length)],
      "IS_SG": isSg,
      "total_ots": totalOts,
      "ots_concluidas": otsConcluidas,
      "ots_pendientes": otsPendientes
    });
  }

  // Sort by reverse date like the db
  return data.sort((a, b) => new Date(b["Fecha inicio"]).getTime() - new Date(a["Fecha inicio"]).getTime());
}
