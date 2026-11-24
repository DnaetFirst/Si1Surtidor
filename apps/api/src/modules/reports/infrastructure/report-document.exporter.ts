import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportDocumentExporter, ReportExportDataset } from '../domain/ai-advisor';

function neutralizeFormulaCell(value: string | number | null | undefined): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value);
  return /^[\s\t\r]*[=+\-@]/.test(text) ? `'${text}` : text;
}

function laPazTimestamp(): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());
}

@Injectable()
export class PdfExcelReportExporter extends ReportDocumentExporter {
  async toExcel(dataset: ReportExportDataset): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mi Gasolinera · Biopetrol';
    workbook.created = new Date();

    const safeName = (dataset.title || 'Reporte').replace(/[*?:\\/[\]]/g, '').slice(0, 31) || 'Reporte';
    const sheet = workbook.addWorksheet(safeName, {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    const colCount = Math.max(dataset.headers.length, 1);

    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = dataset.title;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(1).height = 28;

    sheet.mergeCells(2, 1, 2, colCount);
    const subCell = sheet.getCell(2, 1);
    subCell.value = `${dataset.subtitle} · Generado: ${laPazTimestamp()} (America/La_Paz)`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sheet.getRow(2).height = 20;

    sheet.addRow([]);

    const headerRow = sheet.addRow(dataset.headers);
    headerRow.height = 22;
    headerRow.eachCell(cell => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    });

    const widths = dataset.headers.map(h => Math.max(h.length + 4, 14));
    for (let rIdx = 0; rIdx < dataset.rows.length; rIdx++) {
      const sanitized = dataset.rows[rIdx].map((cell, cIdx) => {
        const clean = neutralizeFormulaCell(cell);
        const len = String(clean).length + 3;
        if (len > widths[cIdx]) widths[cIdx] = Math.min(len, 40);
        return clean;
      });
      const row = sheet.addRow(sanitized);
      row.height = 19;
      row.eachCell(cell => {
        if (rIdx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        };
      });
    }

    if (dataset.totals && dataset.totals.length > 0) {
      const totalRow = sheet.addRow(dataset.totals.map(t => neutralizeFormulaCell(t)));
      totalRow.height = 22;
      totalRow.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      });
    }

    widths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async toPdf(dataset: ReportExportDataset): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const startX = doc.page.margins.left;
      const cols = Math.max(dataset.headers.length, 1);
      const colW = pageW / cols;

      const drawHeader = () => {
        doc.rect(startX, doc.y, pageW, 42).fill('#0f172a');
        const boxTop = doc.y;
        doc
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(13)
          .text(dataset.title, startX + 12, boxTop + 8, { width: pageW - 24 });
        doc
          .fillColor('#cbd5e1')
          .font('Helvetica')
          .fontSize(8.5)
          .text(`${dataset.subtitle}  |  Emitido: ${laPazTimestamp()} (America/La_Paz)`, startX + 12, boxTop + 26, {
            width: pageW - 24,
          });
        doc.y = boxTop + 52;
      };

      const drawTableHeader = () => {
        const y = doc.y;
        doc.rect(startX, y, pageW, 22).fill('#1e293b');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
        dataset.headers.forEach((h, idx) => {
          doc.text(String(h), startX + idx * colW + 4, y + 6, {
            width: Math.max(20, colW - 8),
            lineBreak: false,
            ellipsis: true,
          });
        });
        doc.y = y + 22;
      };

      drawHeader();
      drawTableHeader();

      if (!dataset.rows.length) {
        doc.moveDown(1);
        doc.fillColor('#64748b').font('Helvetica').fontSize(10).text('No existen registros para los filtros seleccionados.', startX, doc.y);
      } else {
        dataset.rows.forEach((row, rIdx) => {
          const rowHeight = 19;
          if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 24) {
            doc.addPage();
            drawHeader();
            drawTableHeader();
          }
          const y = doc.y;
          if (rIdx % 2 === 1) {
            doc.rect(startX, y, pageW, rowHeight).fill('#f8fafc');
          }
          doc.fillColor('#0f172a').font('Helvetica').fontSize(8);
          row.forEach((cell, cIdx) => {
            const txt = cell === null || cell === undefined ? '' : String(cell);
            doc.text(txt, startX + cIdx * colW + 4, y + 5, {
              width: Math.max(20, colW - 8),
              lineBreak: false,
              ellipsis: true,
            });
          });
          doc
            .moveTo(startX, y + rowHeight)
            .lineTo(startX + pageW, y + rowHeight)
            .lineWidth(0.5)
            .strokeColor('#e2e8f0')
            .stroke();
          doc.y = y + rowHeight;
        });
      }

      if (dataset.totals && dataset.totals.length > 0) {
        if (doc.y + 24 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          drawHeader();
        }
        const y = doc.y + 4;
        doc.rect(startX, y, pageW, 22).fill('#e2e8f0');
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5);
        dataset.totals.forEach((val, idx) => {
          doc.text(String(val || ''), startX + idx * colW + 4, y + 6, {
            width: Math.max(20, colW - 8),
            lineBreak: false,
            ellipsis: true,
          });
        });
        doc.y = y + 24;
      }

      doc.end();
    });
  }
}
