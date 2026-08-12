import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Conduce, FiltrosReporte } from '../types';

export interface ReporteClienteFila {
  fecha: string;
  numeroConduce: string;
  clienteNombre: string;
  proyecto: string;
  itemDetalle: string;
  placaEquipo: string;
  horas: number;
  viajes: number;
  metros: number;
  precioUnitario: number;
  total: number;
  tipo: string;
}

export interface ReporteNominaFila {
  empleadoNombre: string;
  vehiculoPlaca: string;
  fecha: string;
  numeroConduce: string;
  clienteNombre: string;
  servicioDescripcion: string;
  horasTrabajadas: number;
  viajes: number;
  metros: number;
  precioUnitario: number;
  totalMonetario: number;
}

export class ExportService {
  /**
   * Genera las filas aplanadas para el Reporte de Clientes
   */
  static procesarFilasReporteCliente(conduces: Conduce[]): ReporteClienteFila[] {
    const filas: ReporteClienteFila[] = [];

    conduces.forEach((c) => {
      if (c.tipo === 'equipo_pesado') {
        filas.push({
          fecha: c.fecha,
          numeroConduce: c.numeroConduce,
          clienteNombre: c.clienteNombre,
          proyecto: c.direccionProyecto,
          itemDetalle: c.equipoAsignado,
          placaEquipo: c.equipoAsignado,
          horas: c.totalHorasPagar,
          viajes: 0,
          metros: 0,
          precioUnitario: c.precioPorHora,
          total: c.montoTotal,
          tipo: 'Equipo Pesado (Por Hora)'
        });
      } else {
        c.detalles.forEach((det) => {
          filas.push({
            fecha: c.fecha,
            numeroConduce: c.numeroConduce,
            clienteNombre: c.clienteNombre,
            proyecto: c.direccionProyecto,
            itemDetalle: det.material,
            placaEquipo: `Camión ${c.placaCamion}`,
            horas: 0,
            viajes: det.unidad === 'viaje' ? det.cantidad : (c.totalViajes || 0),
            metros: det.unidad === 'metro' ? det.cantidad : 0,
            precioUnitario: det.precioUnitario,
            total: det.subtotal,
            tipo: `Materiales (${det.unidad})`
          });
        });
      }
    });

    return filas.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  /**
   * Genera las filas aplanadas para el Reporte de Nómina
   */
  static procesarFilasReporteNomina(conduces: Conduce[]): ReporteNominaFila[] {
    const filas: ReporteNominaFila[] = [];

    conduces.forEach((c) => {
      if (c.tipo === 'equipo_pesado') {
        filas.push({
          empleadoNombre: c.operadorNombre || 'Sin Asignar',
          vehiculoPlaca: c.equipoAsignado,
          fecha: c.fecha,
          numeroConduce: c.numeroConduce,
          clienteNombre: c.clienteNombre,
          servicioDescripcion: `Operación Equipo (${c.equipoAsignado})`,
          horasTrabajadas: c.totalHorasPagar,
          viajes: 0,
          metros: 0,
          precioUnitario: c.precioPorHora,
          totalMonetario: c.montoTotal
        });
      } else {
        c.detalles.forEach((det) => {
          filas.push({
            empleadoNombre: c.choferNombre || 'Sin Asignar',
            vehiculoPlaca: `Camión - Placa: ${c.placaCamion}`,
            fecha: c.fecha,
            numeroConduce: c.numeroConduce,
            clienteNombre: c.clienteNombre,
            servicioDescripcion: `Acarreo: ${det.material}`,
            horasTrabajadas: 0,
            viajes: det.unidad === 'viaje' ? det.cantidad : c.totalViajes,
            metros: det.unidad === 'metro' ? det.cantidad : c.totalMetros,
            precioUnitario: det.precioUnitario,
            totalMonetario: det.subtotal
          });
        });
      }
    });

    return filas.sort((a, b) => a.empleadoNombre.localeCompare(b.empleadoNombre) || a.fecha.localeCompare(b.fecha));
  }

  // ===================== EXPORTAR REPORTE CLIENTES (EXCEL) =====================
  static exportarClienteExcel(conduces: Conduce[], filtros: FiltrosReporte): void {
    const filas = this.procesarFilasReporteCliente(conduces);

    const datosExcel = filas.map((f) => ({
      'Fecha': f.fecha,
      'No. Conduce': f.numeroConduce,
      'Cliente': f.clienteNombre,
      'Proyecto / Dirección': f.proyecto,
      'Equipo / Material / Servicio': f.itemDetalle,
      'Placa / Equipo': f.placaEquipo,
      'Horas (H.T.)': f.horas || '-',
      'Viajes': f.viajes || '-',
      'Volumen (m³)': f.metros || '-',
      'Tarifa / Precio Unit. ($)': f.precioUnitario,
      'Monto Subtotal ($)': f.total
    }));

    // Calcular Totales
    const totalHoras = filas.reduce((sum, f) => sum + f.horas, 0);
    const totalViajes = filas.reduce((sum, f) => sum + f.viajes, 0);
    const totalMetros = filas.reduce((sum, f) => sum + f.metros, 0);
    const totalMonto = filas.reduce((sum, f) => sum + f.total, 0);

    datosExcel.push({
      'Fecha': 'TOTALES GENERALES',
      'No. Conduce': '',
      'Cliente': '',
      'Proyecto / Dirección': '',
      'Equipo / Material / Servicio': '',
      'Placa / Equipo': '',
      'Horas (H.T.)': totalHoras,
      'Viajes': totalViajes,
      'Volumen (m³)': totalMetros,
      'Tarifa / Precio Unit. ($)': 0,
      'Monto Subtotal ($)': totalMonto
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();

    // Agregar título y parámetros en la parte superior si se desea
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['EQUIPOS Y PROYECTOS CIVILES, S.R.L. (EQUIPROCI)'],
        ['REPORTE DE PRODUCCIÓN Y TRABAJO A CLIENTES'],
        [`Rango: ${filtros.fechaInicio || 'Inicio'} al ${filtros.fechaFin || 'Hoy'}`],
        []
      ],
      { origin: 'A1' }
    );

    // Reajustar origen de los datos si se agregaron filas superiores
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte_Clientes');
    XLSX.writeFile(workbook, `EQUIPROCI_Reporte_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ===================== EXPORTAR REPORTE CLIENTES (PDF) =====================
  static exportarClientePDF(conduces: Conduce[], filtros: FiltrosReporte): void {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const filas = this.procesarFilasReporteCliente(conduces);

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(20, 40, 80);
    doc.text('EQUIPOS Y PROYECTOS CIVILES, S.R.L. (EQUIPROCI)', 14, 15);
    doc.setFontSize(12);
    doc.text('Reporte de Producción y Trabajo a Clientes', 14, 22);

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Periodo: ${filtros.fechaInicio || 'Todos'} a ${filtros.fechaFin || 'Todos'} | Generado: ${new Date().toLocaleDateString('es-DO')}`, 14, 28);

    const head = [['Fecha', 'No. Conduce', 'Cliente', 'Proyecto', 'Servicio/Material', 'Placa/Eq.', 'Horas', 'Viajes', 'Metros', 'Precio Unit.', 'Total ($)']];

    const body = filas.map((f) => [
      f.fecha,
      f.numeroConduce,
      f.clienteNombre,
      f.proyecto.substring(0, 22),
      f.itemDetalle,
      f.placaEquipo,
      f.horas ? f.horas.toString() : '-',
      f.viajes ? f.viajes.toString() : '-',
      f.metros ? f.metros.toString() : '-',
      `$${f.precioUnitario.toLocaleString('es-DO')}`,
      `$${f.total.toLocaleString('es-DO')}`
    ]);

    const totalMonto = filas.reduce((s, f) => s + f.total, 0);
    const totalHoras = filas.reduce((s, f) => s + f.horas, 0);
    const totalMetros = filas.reduce((s, f) => s + f.metros, 0);
    const totalViajes = filas.reduce((s, f) => s + f.viajes, 0);

    body.push([
      'TOTALES',
      '',
      '',
      '',
      '',
      '',
      totalHoras ? `${totalHoras} hrs` : '-',
      totalViajes ? `${totalViajes} vj` : '-',
      totalMetros ? `${totalMetros} m³` : '-',
      '',
      `$${totalMonto.toLocaleString('es-DO')}`
    ]);

    autoTable(doc, {
      startY: 32,
      head: head,
      body: body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [24, 60, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [230, 235, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid'
    });

    doc.save(`EQUIPROCI_Reporte_Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ===================== EXPORTAR REPORTE NÓMINA (EXCEL) =====================
  static exportarNominaExcel(conduces: Conduce[], filtros: FiltrosReporte): void {
    const filas = this.procesarFilasReporteNomina(conduces);

    const datosExcel = filas.map((f) => ({
      'Chofer / Operador': f.empleadoNombre,
      'Vehículo Asignado / Placa': f.vehiculoPlaca,
      'Fecha': f.fecha,
      'No. Conduce': f.numeroConduce,
      'Cliente': f.clienteNombre,
      'Trabajo / Servicio': f.servicioDescripcion,
      'Horas Trab. (H.T.)': f.horasTrabajadas || '-',
      'Viajes': f.viajes || '-',
      'Volumen (m³)': f.metros || '-',
      'Precio / Tarifa ($)': f.precioUnitario,
      'Total Monetario ($)': f.totalMonetario
    }));

    const totalHoras = filas.reduce((sum, f) => sum + f.horasTrabajadas, 0);
    const totalViajes = filas.reduce((sum, f) => sum + f.viajes, 0);
    const totalMetros = filas.reduce((sum, f) => sum + f.metros, 0);
    const totalMonto = filas.reduce((sum, f) => sum + f.totalMonetario, 0);

    datosExcel.push({
      'Chofer / Operador': 'TOTALES GENERALES NÓMINA',
      'Vehículo Asignado / Placa': '',
      'Fecha': '',
      'No. Conduce': '',
      'Cliente': '',
      'Trabajo / Servicio': '',
      'Horas Trab. (H.T.)': totalHoras,
      'Viajes': totalViajes,
      'Volumen (m³)': totalMetros,
      'Precio / Tarifa ($)': 0,
      'Total Monetario ($)': totalMonto
    });

    const encabezados = [
      ['EQUIPOS Y PROYECTOS CIVILES, S.R.L. (EQUIPROCI)'],
      ['REPORTE DE NÓMINA Y PRODUCCIÓN DE EMPLEADOS'],
      [`Periodo: ${filtros.fechaInicio || 'Inicio'} al ${filtros.fechaFin || 'Hoy'}`],
      []
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(encabezados);
    XLSX.utils.sheet_add_json(worksheet, datosExcel, { origin: 'A5' });

    worksheet['!cols'] = [
      { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 14 },
      { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 18 }, { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte_Nomina');
    XLSX.writeFile(workbook, `EQUIPROCI_Reporte_Nomina_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ===================== EXPORTAR REPORTE NÓMINA (PDF) =====================
  static exportarNominaPDF(conduces: Conduce[], filtros: FiltrosReporte): void {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const filas = this.procesarFilasReporteNomina(conduces);

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(20, 40, 80);
    doc.text('EQUIPOS Y PROYECTOS CIVILES, S.R.L. (EQUIPROCI)', 14, 15);
    doc.setFontSize(12);
    doc.text('Reporte de Resumen de Producción para Nómina de Empleados', 14, 22);

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Periodo: ${filtros.fechaInicio || 'Todos'} a ${filtros.fechaFin || 'Todos'} | Operador/Chofer: ${filtros.empleadoNombre || 'Todos'}`, 14, 28);

    const head = [['Chofer / Operador', 'Vehículo/Placa', 'Fecha', 'No. Conduce', 'Cliente', 'Servicio', 'H.T.', 'Viajes', 'm³', 'Tarifa', 'Total ($)']];

    const body = filas.map((f) => [
      f.empleadoNombre,
      f.vehiculoPlaca,
      f.fecha,
      f.numeroConduce,
      f.clienteNombre,
      f.servicioDescripcion,
      f.horasTrabajadas ? f.horasTrabajadas.toString() : '-',
      f.viajes ? f.viajes.toString() : '-',
      f.metros ? f.metros.toString() : '-',
      `$${f.precioUnitario.toLocaleString('es-DO')}`,
      `$${f.totalMonetario.toLocaleString('es-DO')}`
    ]);

    const totalMonto = filas.reduce((s, f) => s + f.totalMonetario, 0);
    const totalHoras = filas.reduce((s, f) => s + f.horasTrabajadas, 0);
    const totalViajes = filas.reduce((s, f) => s + f.viajes, 0);
    const totalMetros = filas.reduce((s, f) => s + f.metros, 0);

    body.push([
      'TOTAL GENERAL NÓMINA',
      '',
      '',
      '',
      '',
      '',
      `${totalHoras} hrs`,
      `${totalViajes} vj`,
      `${totalMetros} m³`,
      '',
      `$${totalMonto.toLocaleString('es-DO')}`
    ]);

    autoTable(doc, {
      startY: 32,
      head: head,
      body: body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [18, 80, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [225, 240, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid'
    });

    doc.save(`EQUIPROCI_Reporte_Nomina_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
