import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { getDB } from './db';

const getUserName = (userId) => {
    try {
        const db = getDB();
        return db.users.find(u => u.id === String(userId))?.name || userId;
    } catch {
        return userId;
    }
};


const drawHeader = (doc, session) => {
    const { form } = session;
    
    // External Border
    doc.setDrawColor(0);
    doc.setLineWidth(1.5);
    doc.rect(30, 30, 535, 80);
    
    // Internal Dividers
    doc.setLineWidth(0.5);
    doc.line(180, 30, 180, 110); // Logo divider
    doc.line(400, 30, 400, 110); // Info divider
    
    // Institutional Branding
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRÍCOLA FAMOSA S.A.', 40, 65);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PRODTECH 4.0 - QUALIDADE', 40, 85);
    
    // Form Title (Center)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(form.title.toUpperCase(), 200);
    doc.text(titleLines, 195, 65, { align: 'left' });
    
    // Metadata (Right)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const rightX = 410;
    doc.text('CONTROLE DE QUALIDADE', rightX, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`CÓDIGO: AF-QA-${form.id}`, rightX, 60);
    doc.text(`VERSÃO: ${form.version || '01'} (2024)`, rightX, 72);
    doc.text(`FAZENDA: ${session.farmName}`, rightX, 84);
    doc.text(`DATA: ${format(new Date(session.date), 'dd/MM/yyyy')}`, rightX, 96);
};

export const generateSessionPDF = (session) => {
    try {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const { form, records } = session;

        drawHeader(doc, session);

        if (form.type === 'checklist') {
            const lastRecord = records[records.length - 1];
            let currentY = 130;
            
            form.sections.forEach(section => {
                const tableRows = section.items.map((item, idx) => {
                    const resp = (lastRecord?.data?.checklist && lastRecord.data.checklist[item.id]) || {};
                    return [
                        `${idx + 1}. ${item.label}`,
                        resp.status || '-',
                        resp.actionPlan || (resp.status === 'NÃO' ? 'PENDENTE' : '-')
                    ];
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [[section.title, 'Estado', 'Plano de Ação Corretiva']],
                    body: tableRows,
                    theme: 'grid',
                    styles: { fontSize: 7, cellPadding: 3 },
                    headStyles: { fillColor: [42, 90, 59], textColor: 255 },
                    columnStyles: {
                        0: { cellWidth: 250 },
                        1: { cellWidth: 50, halign: 'center' },
                        2: { cellWidth: 'auto' }
                    }
                });
                
                currentY = doc.lastAutoTable.finalY + 15;
                if (currentY > 750) {
                    doc.addPage();
                    drawHeader(doc, session);
                    currentY = 130;
                }
            });
        } 
        else if (form.type === 'table-log') {
            const head = [form.columns.map(c => c.label)];
            const body = records.map(r => {
                return form.columns.map(c => {
                    const val = r.data[c.key];
                    if (val === true || val === 'SIM') return 'SIM';
                    if (val === false || val === 'NÃO') return 'NÃO';
                    return val || '-';
                });
            });

            autoTable(doc, {
                startY: 130,
                head: head,
                body: body,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [42, 90, 59] }
            });
        }
        else if (form.type === 'grid-inspection') {
            const lastRecord = records[records.length - 1];
            const data = lastRecord?.data?.grid || {};
            
            const tableRows = form.items.map(item => {
                const state = data[item.id] || {};
                const statusStr = Object.entries(state)
                    .filter(([_, v]) => v === true)
                    .map(([k, _]) => k.toUpperCase())
                    .join(', ') || 'NÃO INSPECIONADO';
                
                return [item.id, item.label, statusStr];
            });

            autoTable(doc, {
                startY: 130,
                head: [['Código', 'Descrição do Item', 'Estado']],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [42, 90, 59] }
            });
        }

        const finalY = (doc.lastAutoTable?.finalY || 110) + 40;
        if (finalY < 740) {
            doc.line(40, finalY + 10, 240, finalY + 10);
            doc.line(315, finalY + 10, 515, finalY + 10);
            doc.setFontSize(8);
            doc.text('Assinatura do Responsável', 40, finalY + 22);
            doc.text('Assinatura do Verificador', 315, finalY + 22);
            
            if (session.status === 'signed') {
                if (session.signature) {
                    try {
                        doc.addImage(session.signature, 'PNG', 45, finalY - 30, 100, 40);
                    } catch (e) {
                        doc.setFont('courier', 'italic');
                        doc.text(`Assinado: ${getUserName(session.signedBy)}`, 50, finalY + 5);
                    }
                } else {
                    doc.setFont('courier', 'italic');
                    doc.text(`Assinado: ${getUserName(session.signedBy)}`, 50, finalY + 5);
                }
            }
        }

        const fileName = `${form.id}_${session.farmName}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro técnico ao gerar o PDF. Verifique o console.");
    }
};
