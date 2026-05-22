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
    
    // Header outer border - expanded height to 100 to fit audit stamps
    doc.setDrawColor(0);
    doc.setLineWidth(1.5);
    doc.rect(30, 30, 535, 100);
    
    // Internal Dividers - expanded to 130 to match height
    doc.setLineWidth(0.5);
    doc.line(180, 30, 180, 130); // Logo divider
    doc.line(400, 30, 400, 130); // Info divider
    
    // Institutional Branding
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRÍCOLA FAMOSA S.A.', 40, 70);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PRODTECH 4.0 - QUALIDADE', 40, 90);
    
    // Form Title (Center)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(form.title.toUpperCase(), 200);
    doc.text(titleLines, 195, 70, { align: 'left' });
    
    // Metadata (Right)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const rightX = 410;
    doc.text('CONTROLE DE QUALIDADE', rightX, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`CÓDIGO: AF-QA-${form.id}`, rightX, 54);
    doc.text(`VERSÃO: ${form.version || '01'} (2024)`, rightX, 66);
    doc.text(`FAZENDA: ${session.farmName}`, rightX, 78);
    doc.text(`DATA: ${format(new Date(session.date), 'dd/MM/yyyy')}`, rightX, 90);
    
    // Audit Validation and Certification Stamps
    const validationLabels = { pending: 'PENDENTE', validated: 'VALIDADO', rejected: 'REJEITADO' };
    const validationStatus = session.validationStatus || 'pending';
    doc.setFont('helvetica', 'bold');
    doc.text(`VALIDAÇÃO: ${validationLabels[validationStatus] || 'PENDENTE'}`, rightX, 102);
    
    const certificationLabels = { waiting: 'AGUARDANDO', in_review: 'EM REVISÃO', certified: 'CERTIFICADO' };
    const certificationStatus = session.certificationStatus || 'waiting';
    doc.text(`CERTIFICAÇÃO: ${certificationLabels[certificationStatus] || 'AGUARDANDO'}`, rightX, 114);
    doc.setFont('helvetica', 'normal');
};

export const generateSessionPDF = (session) => {
    try {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const { form, records } = session;

        drawHeader(doc, session);

        if (form.type === 'checklist') {
            const lastRecord = records[records.length - 1];
            let currentY = 150;
            
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
                    currentY = 150;
                }
            });
        } 
        else if (form.type === 'form') {
            const lastRecord = records[records.length - 1];
            const data = lastRecord?.data || {};
            
            const tableRows = [];
            const imagesToDraw = []; // { label, dataUrl }

            form.fields.forEach(field => {
                if (field.type === 'section') {
                    tableRows.push([{ content: field.label, colSpan: 2, styles: { fillColor: [42, 90, 59], textColor: 255, fontStyle: 'bold' } }]);
                } else if (field.type === 'label-image-selector') {
                    const val = data[field.name];
                    if (val) {
                        tableRows.push([field.label, 'IMAGEM ANEXADA (VER ANEXOS AO FINAL)']);
                        imagesToDraw.push({ label: field.label, dataUrl: val });
                    } else {
                        tableRows.push([field.label, 'NÃO ANEXADO / SEM REGISTRO']);
                    }
                } else {
                    const val = data[field.name];
                    tableRows.push([field.label, val || '-']);
                }
            });

            autoTable(doc, {
                startY: 150,
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 5 },
                columnStyles: {
                    0: { cellWidth: 200, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' }
                }
            });

            let currentY = doc.lastAutoTable.finalY + 20;

            // Draw Images if any
            if (imagesToDraw.length > 0) {
                if (currentY > 500) {
                    doc.addPage();
                    drawHeader(doc, session);
                    currentY = 150;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('COMPROVANTES VISUAIS DE ETIQUETAS (REGISTRO HD)', 40, currentY);
                currentY += 15;

                let imageX = 40;
                imagesToDraw.forEach(img => {
                    if (imageX + 220 > 550) {
                        imageX = 40;
                        currentY += 150;
                        if (currentY > 750) {
                            doc.addPage();
                            drawHeader(doc, session);
                            currentY = 150;
                        }
                    }

                    try {
                        doc.setDrawColor(200);
                        doc.rect(imageX, currentY, 200, 130);
                        doc.addImage(img.dataUrl, 'PNG', imageX + 10, currentY + 10, 180, 110);
                        
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'normal');
                        doc.text(img.label, imageX, currentY + 142);
                    } catch (err) {
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'italic');
                        doc.text(`[Falha ao renderizar imagem: ${img.label}]`, imageX, currentY + 20);
                    }

                    imageX += 240;
                });
                
                doc.lastAutoTable = { finalY: currentY + 160 };
            }
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
                startY: 150,
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
                startY: 150,
                head: [['Código', 'Descrição do Item', 'Estado']],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [42, 90, 59] }
            });
        }

        let finalY = (doc.lastAutoTable?.finalY || 110) + 40;
        if (finalY >= 740) {
            doc.addPage();
            drawHeader(doc, session);
            finalY = 150;
        }

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

        if (session.validationSignature) {
            try {
                doc.addImage(session.validationSignature, 'PNG', 320, finalY - 30, 100, 40);
            } catch (e) {
                doc.setFont('courier', 'italic');
                doc.text(`Assinado: ${getUserName(session.validationSignedBy)}`, 325, finalY + 5);
            }
        }


        const fileName = `${form.id}_${session.farmName}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro técnico ao gerar o PDF. Verifique o console.");
    }
};
