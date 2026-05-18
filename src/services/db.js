// Mock Database Service using LocalStorage
// Implements Tesco Nurture requirements (immutability, audit trails)

import { format } from 'date-fns';

const DB_KEY = 'agricola_famosa_db';

const initialData = {
  users: [
    { id: '1', name: 'João Operador', role: 'operator', pin: '1234', farmId: 'F1' },
    { id: '2', name: 'Maria Supervisora', role: 'supervisor', pin: '5678', farmId: 'F1' },
    { id: '3', name: 'Carlos Auditor', role: 'auditor', username: 'auditor', password: 'password123' },
    { id: '4', name: 'Ana Administradora', role: 'admin', username: 'admin', password: 'adminpassword' },
    { id: '5', name: 'Pedro Sede', role: 'sede', username: 'sede', password: 'sedepassword' },
  ],
  farms: [
    { id: 'FAMOSA', name: 'Famosa (Sede)', sectors: ['Geral', 'Packing House', 'Higiene', 'Campo'] },
    { id: 'MACACOS', name: 'Macacos', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'FLAMENGO', name: 'Flamengo', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'SANTA_JULIA', name: 'Santa Júlia', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'PAULICEIA', name: 'Pauliceia', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'SAO_SABINO', name: 'São Sabino', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'BAIXA_VERDE', name: 'Baixa Verde', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'PRAQUIO', name: 'Praquió', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'TAPERA', name: 'Tapera', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'RUSSAS', name: 'Russas', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'PEDRINHAS', name: 'Pedrinhas', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'PH', name: 'PH', sectors: ['Packing House', 'Higiene', 'Campo'] },
    { id: 'KM60', name: 'KM 60', sectors: ['Packing House', 'Higiene', 'Campo'] }
  ],
  labels: [
    {
      id: 'L1',
      name: 'Melancia Tesco Export (HD)',
      variety: 'Melancia Sem Semente',
      barcode: '1002 1392',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f8fafc" rx="8" stroke="%23cbd5e1" stroke-width="2"/><ellipse cx="60" cy="50" rx="35" ry="25" fill="%2315803d"/><ellipse cx="60" cy="50" rx="30" ry="20" fill="%2322c55e"/><ellipse cx="60" cy="50" rx="25" ry="15" fill="%23ef4444"/><circle cx="50" cy="45" r="2" fill="%23000"/><circle cx="65" cy="48" r="2" fill="%23000"/><circle cx="70" cy="42" r="2" fill="%23000"/><circle cx="55" cy="52" r="2" fill="%23000"/><text x="60" y="95" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231e293b" text-anchor="middle">WATERMELON BR</text><text x="60" y="110" font-family="monospace" font-size="8" fill="%2364748b" text-anchor="middle">PLU 1002 1392</text></svg>'
    },
    {
      id: 'L2',
      name: 'Melão Amarelo Famosa Premium',
      variety: 'Melão Amarelo',
      barcode: '1002 1380',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f8fafc" rx="8" stroke="%23cbd5e1" stroke-width="2"/><circle cx="60" cy="50" r="28" fill="%23eab308" stroke="%23ca8a04" stroke-width="2"/><text x="60" y="95" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231e293b" text-anchor="middle">YELLOW MELON</text><text x="60" y="110" font-family="monospace" font-size="8" fill="%2364748b" text-anchor="middle">PLU 1002 1380</text></svg>'
    },
    {
      id: 'L3',
      name: 'Melão Cantaloupe Famosa Gold',
      variety: 'Melão Cantaloupe',
      barcode: '1002 1375',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f8fafc" rx="8" stroke="%23cbd5e1" stroke-width="2"/><circle cx="60" cy="50" r="28" fill="%23f97316" stroke="%23ea580c" stroke-width="2"/><text x="60" y="95" font-family="sans-serif" font-size="10" font-weight="bold" fill="%231e293b" text-anchor="middle">CANTALOUPE</text><text x="60" y="110" font-family="monospace" font-size="8" fill="%2364748b" text-anchor="middle">PLU 1002 1375</text></svg>'
    }
  ],
  forms: [
    {
      id: 'CL02',
      title: 'CL 02 - CHECK LIST - INSPEÇÃO PRÉ OPERACIONAL',
      version: 'V15 - 03.11.25',
      type: 'checklist',
      sectors: ['Packing House'],
      haccp: true,
      frequency: 'DIÁRIO',
      sections: [
        {
          title: '1- LIMPEZA GERAL',
          items: [
            { id: 'q1', label: 'Existe material em desuso no packing House?' },
            { id: 'q2', label: 'A área externa do Packing House está com resíduos ou entulhos?' },
            { id: 'q3', label: 'A tela de proteção do packing house está em perfeitas condições, sem falhas que permitam o acesso de pássaros ou insetos?' },
            { id: 'q4', label: 'Os baldes de resíduos recicláveis com material perecível estão devidamente fechados?' },
            { id: 'q5', label: 'Os recipientes estão identificados conforme a coleta seletiva?' },
            { id: 'q6', label: 'A área de corte de pedúnculo e etiquetas está limpa, sem restos de etiquetas, fitas ou papéis no chão?' },
            { id: 'q7', label: 'Há sujeira sob as esteiras ou máquinas?' },
            { id: 'q8', label: 'As áreas de resfriamento estão visualmente limpas?' },
            { id: 'q9', label: 'Máquinas de produção limpas e em bom estado?' },
            { id: 'q10', label: 'Telas limpas e em bom estado?' },
            { id: 'q11', label: 'Mesas de seleção limpas e em bom estado?' },
            { id: 'q12', label: 'Baldes e caixas para água clorada limpos e em bom estado?' },
            { id: 'q13', label: 'Tesouras e facas limpas e em bom estado?' },
            { id: 'q14', label: 'Piso, paredes e colunas da área de embalagem limpos e em bom estado?' },
            { id: 'q15', label: 'As armadilhas Internas e externas do Packing House têm proteção?' },
            { id: 'q16', label: 'Há presença de insetos ou animais dentro do packing house?' },
            { id: 'q17', label: 'Há indícios de alimentos dentro do packing house?' },
            { id: 'q18', label: 'O packing house está livre de odores e com os ralos limpos e em boas condições?' },
            { id: 'q19', label: 'As cortinas plásticas estão limpas e em boas condições, sem tocar o chão?' },
            { id: 'q20', label: 'Área de defensivos pós-colheita limpa e em bom estado?' },
            { id: 'q21', label: 'A entrada de frutas está livre de resíduos recicláveis e não recicláveis?' },
            { id: 'q22', label: 'Os materiais de limpeza estão em bom estado, alocados nos setores corretos, limpos e identificados por cor e etiquetas?' },
            { id: 'q23', label: 'Os pedilúvios (Lava pés) estão abastecidos com o produto químico na dosagem correta?' },
            { id: 'q24', label: 'Existe esponja de aço no packing house?' },
            { id: 'q25', label: 'As tesouras e facas estão em bom estado, numeradas e com controle de uso atualizado?' },
            { id: 'q26', label: 'Há alguma tesoura ou faca quebrada ou ausente?' },
            { id: 'q27', label: 'Há risco de alguma substância cair sobre as frutas ou caixas?' },
            { id: 'q28', label: 'As paletizadoras automáticas estão seguras e não oferecem risco de contaminação?' },
            { id: 'q29', label: 'Luminárias limpas e em bom estado?' },
            { id: 'q30', label: 'Paredes e tetos da câmara fria limpos e em bom estado?' },
            { id: 'q31', label: 'Cortinas limpas e em bom estado?' },
            { id: 'q32', label: 'Os almoxarifados estão limpos e organizados?' },
            { id: 'q33', label: 'Os materiais estão armazenados em prateleiras ou sobre pallets?' },
            { id: 'q34', label: 'Os armários estão limpos e organizados?' },
            { id: 'q35', label: 'Lavatórios (Pias) limpos e em bom estado?' },
            { id: 'q36', label: 'Bebedouros limpos e em bom estado?' },
            { id: 'q37', label: 'Esteiras limpas e em bom estado?' }
          ]
        },
        {
          title: '2- REQUISITOS BPF - HIGIENE PESSOAL',
          items: [
            { id: 'p1', label: 'Os trabalhadores receberam treinamento sobre higiene pessoal e BPF?' },
            { id: 'p2', label: 'Os trabalhadores foram treinados em casos de doenças infectocontagiosas?' },
            { id: 'p3', label: 'Os funcionários sabem procurar o socorrista em caso de cortes ou ferimentos?' },
            { id: 'p4', label: 'Os funcionários responsáveis pela limpeza conhecem os procedimentos de codificação?' },
            { id: 'p5', label: 'A caixa de primeiros socorros está completa e com documentação atualizada?' },
            { id: 'p6', label: 'Há uso de anéis, pulseiras, brincos, relógios ou outros adornos?' },
            { id: 'p7', label: 'Há pessoas com ferimentos ou escoriações na linha de embalagem?' },
            { id: 'p8', label: 'Todos lavam as mãos antes de retornar ao trabalho?' },
            { id: 'p9', label: 'Todos utilizam corretamente o uniforme, touca e botas?' },
            { id: 'p10', label: 'As unhas estão curtas, limpas, sem esmalte e sem unhas postiças?' },
            { id: 'p11', label: 'Os trabalhadores estão barbeados?' },
            { id: 'p12', label: 'Os socorristas estão identificados?' },
            { id: 'p13', label: 'Os funcionários retiram uniforme e EPIs ao ir ao banheiro?' },
            { id: 'p14', label: 'Há medicamentos pessoais dentro do packing house?' },
            { id: 'p15', label: 'Todos seguem as normas de comportamento (não comer, não fumar, não tossir sobre frutas)?' }
          ]
        }
      ]
    },
    {
      id: 'F238',
      title: 'F238 - REGISTRO DE HIGIENE DO PACKING HOUSE',
      version: 'V14 - 10.11.25',
      type: 'table-log',
      sectors: ['Packing House', 'Higiene'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'action', label: 'Ação/Setor', type: 'text', disabled: true },
        { key: 'freq', label: 'Freq.', type: 'text', disabled: true },
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora', type: 'time' },
        { key: 'product', label: 'Produto', type: 'select', options: ['1- Cloro', '2- Multiflex', '3- Detergente Clorado', '4- Desengraxante', '5- Álcool Etílico', '6- Álcool em Gel', '7- Desinfetante'] },
        { key: 'dosage', label: 'Dosagem', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ],
      preDefinedRows: [
        { action: 'Limpar mesa de seleção (Bancada de qualidade)', freq: 'Diário' },
        { action: 'Limpar tesouras e facas', freq: 'Diário' },
        { action: 'Limpar Armários dos Setores (Etiquetas, Mapa, etc)', freq: 'Diário' },
        { action: 'Limpar Imediações do Packing house (Entulhos)', freq: 'Diário' },
        { action: 'Limpar Sala de pertence pessoal', freq: 'Diário' },
        { action: 'Limpar Área de Embalagem', freq: 'Diário' },
        { action: 'Limpar Almoxarifados do packing house', freq: 'Diário' },
        { action: 'Limpar Tapetes da recepção do descarrego', freq: 'Diário' },
        { action: 'Limpar Escritórios e salas de inspeção', freq: 'Diário' },
        { action: 'Limpar equipamentos de Limpeza', freq: 'Diário' },
        { action: 'Lavar Baldes de lixo', freq: 'Diário' },
        { action: 'Limpar Área de Refugo', freq: 'Diário' },
        { action: 'Limpar Oficina de manutenção (Pisos, Portas)', freq: 'Diário' },
        { action: 'Limpar Pias e torneiras do ponto de mistura', freq: 'Diário' },
        { action: 'Limpar máquina de Embalagem completa (MANHÃ)', freq: 'Diário' },
        { action: 'Limpar máquina de Embalagem completa (TARDE)', freq: 'Diário' },
        { action: 'Limpar máquina de Embalagem completa (NOITE)', freq: 'Diário' },
        { action: 'Lavar piso, paredes, portas e escadas', freq: 'Diário' },
        { action: 'Limpar máquina de montagem de caixas (MANHÃ)', freq: 'Diário' },
        { action: 'Limpar máquina de montagem de caixas (TARDE)', freq: 'Diário' },
        { action: 'Limpar máquina de montagem de caixas (NOITE)', freq: 'Diário' },
        { action: 'Limpeza mecanizada do Piso', freq: 'Diário' },
        { action: 'Aguação da área externa', freq: 'Diário' }
      ],
      legends: {
        'PRODUTOS': '1- Cloro, 2- Multiflex, 3- Detergente Clorado, 4- Desengraxante, 5- Álcool Etílico, 6- Álcool em Gel, 7- Desinfetante',
        'DOSAGEM': '1- 1,5g/10lt, 2- 1lt/10lt, 3- 1/20lt, 4- 1lt/200lt, 5- Puro, 6- Puro, 7- 1/10lt'
      }
    },
    {
      id: 'F289',
      title: 'F289 - CONTROLE DE SAÍDA E LAVAGEM DAS MÃOS',
      version: 'V2 - 24.06.21',
      type: 'table-log',
      sectors: ['Higiene', 'Campo'],
      frequency: 'POR TURNO',
      columns: [
        { key: 'employee', label: 'Funcionário', type: 'text' },
        { key: 'morning', label: 'Manhã', type: 'boolean' },
        { key: 'afternoon', label: 'Tarde', type: 'boolean' },
        { key: 'night', label: 'Noite', type: 'boolean' },
        { key: 'washPerformed', label: 'Lavou Mãos?', type: 'boolean' }
      ],
      preDefinedRows: [
        { employee: 'ALEXANDRE BARBOSA DA SILVA' },
        { employee: 'AMANDA KELLY OLIVEIRA GONCALVE' },
        { employee: 'ANTONIO EDGARD DE OLIVEIRA' },
        { employee: 'ARYADSON LAMERK DA SILVA FIGUE' },
        { employee: 'CLEILSON MIGUEL DA SILVA' },
        { employee: 'DANILO MARCELINO DE MELO' },
        { employee: 'DENEILSON FERREIRA DA SILVA' },
        { employee: 'ELINEIDE ALVES BRILHANTE' },
        { employee: 'FRANCISCO ADEILTON DE SOUZA SI' },
        { employee: 'JOSE CARLOS HENRIQUE FELIX' }
      ]
    },
    {
      id: 'MCLV209-VIDROS',
      title: 'MCLV 209 - CHECK LIST DE VIDROS E PLÁSTICOS RÍGIDOS',
      version: 'V01 - 27.02.23',
      type: 'grid-inspection',
      sectors: ['Packing House'],
      frequency: 'QUINZENAL',
      columns: [
        { key: 'intact', label: 'Intacta', type: 'boolean' },
        { key: 'broken', label: 'Quebrada', type: 'boolean' },
        { key: 'removed', label: 'Retirada', type: 'boolean' }
      ],
      items: Array.from({ length: 50 }, (_, i) => ({
        id: `JV.14.${String(i+1).padStart(2,'0')}.PH1`,
        label: `Janela Vidro / Item ${i+1}`
      })).concat(Array.from({ length: 30 }, (_, i) => ({
        id: `MPC.14.${String(i+1).padStart(2,'0')}.PH1`,
        label: `Monitor Computador ${i+1}`
      })))
    },
    {
      id: 'MCLV209-LUMINARIAS',
      title: 'MCLV 209 - CHECK LIST DE LUMINÁRIAS',
      version: 'V01 - 27.02.23',
      type: 'grid-inspection',
      sectors: ['Packing House'],
      frequency: 'QUINZENAL',
      columns: [
        { key: 'intact', label: 'Intacta', type: 'boolean' },
        { key: 'burned', label: 'Queimada', type: 'boolean' },
        { key: 'broken', label: 'Quebrada', type: 'boolean' }
      ],
      items: Array.from({ length: 160 }, (_, i) => ({
        id: `L.14.${String(i+1).padStart(2,'0')}.PH1`,
        label: `Luminária ${i+1}`
      }))
    },
    {
      id: 'F217',
      title: 'F217 - REGISTRO DE HIGIENIZAÇÃO DE BANHEIRO',
      version: 'V12 - 03.11.22',
      type: 'table-log',
      sectors: ['Higiene'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'location', label: 'Local/Nº Banheiro', type: 'text' },
        { key: 'swept', label: 'Varrido/Abastecido?', type: 'boolean' },
        { key: 'hasSink', label: 'Possui Pia?', type: 'boolean' },
        { key: 'dispensersOk', label: 'Porta Sabão/Gel OK?', type: 'boolean' },
        { key: 'cleanDaily', label: 'Limpo Diariamente?', type: 'boolean' },
        { key: 'suppliesOk', label: 'Material Limpeza?', type: 'boolean' },
        { key: 'washSigns', label: 'Sinais de Lavagem?', type: 'boolean' },
        { key: 'fixturesClean', label: 'Sanitários/Pias Lavados?', type: 'boolean' },
        { key: 'paperTowels', label: 'Papel/Secador?', type: 'boolean' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F263',
      title: 'F263 - CONTROLE DE PRAGAS URBANAS',
      version: 'V05 - 24.06.21',
      type: 'table-log',
      sectors: ['Higiene', 'Geral', 'Campo'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'trapId', label: 'Nº Armadilha', type: 'text' },
        { key: 'trapType', label: 'Tipo', type: 'select', options: ['COLA', 'ISCA', 'CAPTURA'] },
        { key: 'subst_arm', label: 'Subst. Armadilha?', type: 'boolean' },
        { key: 'subst_isca', label: 'Subst. Isca?', type: 'boolean' },
        { key: 'subst_limp', label: 'Subst. Limpeza?', type: 'boolean' },
        { key: 'captured', label: 'Animal Capturado?', type: 'boolean' },
        { key: 'id_animal', label: 'Identif. Animal', type: 'text' },
        { key: 'notes', label: 'Comentários', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F297',
      title: 'F297 - MONITORAMENTO DE IMERSÃO DAS MÃOS (BAC GEL)',
      version: 'V04 - 24.06.21',
      type: 'table-log',
      sectors: ['Higiene'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'location', label: 'Ponto (Porta Sabão/Gel)', type: 'select', options: ['Ponto de Mistura 1', 'Banheiro Fem 2', 'Banheiro Masc 2', 'Câmara Fria', 'Almoxarifado', 'Descarrego', 'Granel'] },
        { key: 'bactericide', label: 'Qtd Bactericida (ml)', type: 'text' },
        { key: 'alcoholGel', label: 'Qtd Álcool Gel (ml)', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F299.11',
      title: 'F299.11 - MONITORAMENTO DE IMERSÃO DOS CALÇADOS',
      version: 'V05 - 24.06.21',
      type: 'table-log',
      sectors: ['Higiene'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'date', label: 'Data Colocação', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora', type: 'time' },
        { key: 'volume', label: 'Volume Mistura (L)', type: 'text' },
        { key: 'product_qty', label: 'Qtd CHESY MULTIFLEX', type: 'text' },
        { key: 'product_name', label: 'Nome do Produto', type: 'text', defaultValue: 'CHESY MULTIFLEX' },
        { key: 'location', label: 'Recepção Packing House', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F299.46',
      title: 'F299.46 - APLICAÇÃO DE ÁLCOOL EM GEL NA LINHA',
      version: 'V05 - 25.06.21',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'employee', label: 'Funcionário', type: 'text' },
        { key: 'applied', label: 'Produto Aplicado?', type: 'boolean' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F299.71',
      title: 'F299.71 - ENTRADA E SAÍDA COM ÓCULOS DE GRAU',
      version: 'V03 - 25.06.21',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'SEMANAL',
      columns: [
        { key: 'employee', label: 'Funcionário', type: 'text' },
        { key: 'mon', label: 'Seg (E/S)', type: 'text', placeholder: 'Ex: S/S' },
        { key: 'tue', label: 'Ter (E/S)', type: 'text' },
        { key: 'wed', label: 'Qua (E/S)', type: 'text' },
            { key: 'thu', label: 'Qui (E/S)', type: 'text' },
        { key: 'fri', label: 'Sex (E/S)', type: 'text' },
        { key: 'sat', label: 'Sab (E/S)', type: 'text' }
      ]
    },
    {
      id: 'F299.80',
      title: 'F299.80 - REGISTRO DE OBJETOS DO PH',
      version: 'V02 - 25.06.21',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'SEMPRE QUE NECESSÁRIO',
      columns: [
        { key: 'objectId', label: 'Nº do Objeto/Código', type: 'text' },
        { key: 'entry', label: 'Entrada (Hora)', type: 'time' },
        { key: 'exit', label: 'Saída (Hora)', type: 'time' },
        { key: 'broken', label: 'Quebrada?', type: 'boolean' },
        { key: 'employee', label: 'Funcionário', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F253',
      title: 'F253 - REGISTRO DE USO DE LUVAS DO PACKING HOUSE',
      version: 'V02 - 19.01.2021',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'SEMPRE QUE NECESSÁRIO',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'objectId', label: 'Nº do Objeto (Ex: 02LUVAS 01)', type: 'text' },
        { key: 'entry', label: 'Entrada (Hora)', type: 'time' },
        { key: 'exit', label: 'Saída (Hora)', type: 'time' },
        { key: 'broken', label: 'Rasgada?', type: 'boolean' },
        { key: 'damaged', label: 'Danificada?', type: 'boolean' },
        { key: 'employee', label: 'Funcionário', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F269',
      title: 'F269 - CONTROLE DE USUÁRIOS DE BANDAGEM',
      version: 'V06 - 13.10.2022',
      type: 'table-log',
      sectors: ['Higiene', 'Geral', 'Campo'],
      frequency: 'SEMPRE QUE NECESSÁRIO',
      columns: [
        { key: 'date', label: 'Data', type: 'date' },
        { key: 'time', label: 'Hora', type: 'time' },
        { key: 'user', label: 'Nome Usuário', type: 'text' },
        { key: 'type', label: 'Tipo Bandagem', type: 'text' },
        { key: 'stock', label: 'Estoque Restante', type: 'number' }
      ]
    },
    {
      id: 'F238.1',
      title: 'F238.1 - REGISTRO DE LAVAGEM DOS UNIFORMES',
      version: 'V10 - 24.06.21',
      type: 'table-log',
      sectors: ['Higiene'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'action', label: 'Setor/Responsável', type: 'text' },
        { key: 'product', label: 'Produto', type: 'select', options: ['Chesy snift', 'Chesy kelt', 'Chesy mape', 'Chesy benta', 'Chesy umec'] },
        { key: 'dosage', label: 'Dosagem (%)', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ],
      preDefinedRows: [
        { action: 'Pack 0 1' },
        { action: 'Visitantes' },
        { action: 'Almoxarifado' },
        { action: 'Carregamento' },
        { action: 'Manutenção' },
        { action: 'Zeladores' }
      ]
    },
    {
      id: 'F-VISITANTES',
      title: 'REGISTRO DE CONTROLE DE VISITANTES',
      version: 'V01 - 2024',
      type: 'table-log',
      sectors: ['Geral', 'Packing House', 'Campo'],
      frequency: 'SEMPRE QUE NECESSÁRIO',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'name', label: 'Nome do Visitante', type: 'text' },
        { key: 'company', label: 'Empresa', type: 'text' },
        { key: 'purpose', label: 'Motivo da Visita', type: 'text' },
        { key: 'entry', label: 'Entrada (Hora)', type: 'time' },
        { key: 'exit', label: 'Saída (Hora)', type: 'time' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F235',
      title: 'F235 - CONTROLE DE CAIXA REUSADAS',
      version: 'V01 - 29.04.2024',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'SEMPRE QUE NECESSÁRIO',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'brand', label: 'Marca da Caixa', type: 'text' },
        { key: 'quantity', label: 'Quantidade', type: 'number' },
        { key: 'lot', label: 'Lote/Identificação', type: 'text' },
        { key: 'responsible', label: 'Responsável', type: 'text' },
        { key: 'role', label: 'Função', type: 'text' }
      ]
    },
    {
      id: 'F299.50',
      title: 'F299.50 - MONITORAMENTO DE CLORO (KURIZET A-415P)',
      version: 'V01 - 15.09.2021',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'date', label: 'Dia', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora', type: 'time' },
        { key: 'd1_qty', label: 'D1: Pastilhas Geral (UN)', type: 'number' },
        { key: 'd1_flow', label: 'D1: Vazão Dissol. (LPH)', type: 'number' },
        { key: 'd1_chlorine', label: 'D1: Cloro Livre Geral (ppm)', type: 'text' },
        { key: 'd2_qty', label: 'D2: Pastilhas Enxágue (UN)', type: 'number' },
        { key: 'd2_flow', label: 'D2: Vazão Dissol. (LPH)', type: 'number' },
        { key: 'd2_chlorine', label: 'D2: Cloro Livre Enxágue (ppm)', type: 'text' },
        { key: 'product_lot', label: 'Lote do Produto (Kurizet)', type: 'text' },
        { key: 'responsible', label: 'Nome / Responsável', type: 'text' }
      ]
    },
    {
      id: 'F155',
      title: 'F155 - REGISTRO DE LIMPEZA E HIGIENE',
      version: 'V04 - 2024',
      type: 'checklist',
      sectors: ['Higiene', 'Campo'],
      frequency: 'DIÁRIO',
      description: 'Verificação diária de conformidade de higiene e limpeza das instalações.',
      columns: [
        { key: 'status', label: 'Conformidade', type: 'boolean' },
        { key: 'action', label: 'Ação Corretiva', type: 'text' }
      ],
      sections: [
        {
          title: 'ITENS DE INSPEÇÃO',
          items: [
            { id: '1', label: 'Paredes, Teto e Luminárias' },
            { id: '2', label: 'Pisos, Drenos e Ralos' },
            { id: '3', label: 'Equipamentos e Bancadas de Inox' },
            { id: '4', label: 'Utensílios e Recipientes' },
            { id: '5', label: 'Pias, Sifões e Saboneteiras' },
            { id: '6', label: 'Mãos, Antebraços e Unhas' },
            { id: '7', label: 'Uniformes, Botas e EPIs' },
            { id: '8', label: 'Área Externa e Controle de Pragas' }
          ]
        }
      ]
    },
    {
      id: 'F213',
      title: 'F213 - REGISTRO DE RECEBIMENTO DE MATERIAL DE EMBALAGEM',
      version: 'V08 - 25.06.2021',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'SEMPRE QUE RECEBER',
      columns: [
        { key: 'date', label: 'Data Chegada', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora', type: 'time' },
        { key: 'supplier', label: 'Fornecedor', type: 'text' },
        { key: 'product', label: 'Produto', type: 'text' },
        { key: 'invoice', label: 'NF', type: 'text' },
        { key: 'lot', label: 'Lote Fabric.', type: 'text' },
        { key: 'qty', label: 'Qtd Recebida', type: 'text' },
        { key: 'pkg_eval', label: 'Aval. Emb. Fornecedor', type: 'select', options: ['CONFORME', 'NÃO CONFORME'] },
        { key: 'cert', label: 'Certificado Qualidade?', type: 'boolean' },
        { key: 'vehicle_hygiene', label: 'Higiene Veículo', type: 'select', options: ['CONFORME', 'NÃO CONFORME'] },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F299.64',
      title: 'F299.64 - CHECK LIST DE CARREGAMENTO',
      version: 'V04 - 23.06.2021',
      type: 'form',
      sectors: ['Packing House'],
      frequency: 'A CADA EMBARQUE',
      haccp: true,
      fields: [
        { name: 'sec_emb', label: '1 - INFORMAÇÕES DE EMBARQUE', type: 'section' },
        { name: 'cliente', label: 'Cliente / Comprador', type: 'text' },
        { name: 'variedade', label: 'Variedade / Tipo de Melão/Melancia', type: 'text' },
        { name: 'marca_caixa', label: 'Marca da Caixa', type: 'text' },
        { name: 'porto_destino', label: 'Porto de Destino', type: 'text' },
        { name: 'placa_veiculo', label: 'Placa do Veículo / Carreta', type: 'text' },
        { name: 'num_container', label: 'Número do Contêiner', type: 'text' },
        { name: 'num_lacre', label: 'Número do Lacre', type: 'text' },
        { name: 'sec_term', label: '2 - REGISTROS DE SEGURANÇA E CONFORMIDADE', type: 'section' },
        { name: 'termografo_sensor', label: 'Termógrafo Sensor instalado?', type: 'select', options: ['SIM', 'NÃO'] },
        { name: 'termografo_serial', label: 'Nº de Série do Temp Tale', type: 'text' },
        { name: 'pallets_chep', label: 'Uso de Pallets CHEP?', type: 'select', options: ['SIM', 'NÃO'] },
        { name: 'sec_label', label: '3 - COMPROVANTES VISUAIS DE ETIQUETAS', type: 'section' },
        { name: 'etiqueta_fruto_img', label: 'Amostra da Etiqueta de Fruto', type: 'label-image-selector', category: 'fruto' },
        { name: 'etiqueta_caixa_img', label: 'Amostra da Etiqueta de Caixa', type: 'label-image-selector', category: 'caixa' },
        { name: 'sec_obs', label: '4 - OBSERVAÇÕES E NOTAS DE TRACEABILIDADE', type: 'section' },
        { name: 'observacoes', label: 'Observações / Notas Adicionais (Tesco)', type: 'textarea' }
      ]
    },
    {
      id: 'F299.62',
      title: 'F299.62 - CONTROLE DE SAÍDA DE ETIQUETA',
      version: 'V03 - 25.06.2021',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora', type: 'time' },
        { key: 'variety', label: 'Lote / Variedade', type: 'text' },
        { key: 'label_code', label: 'Rótulo / Código PLU', type: 'text' },
        { key: 'quantity', label: 'Qtd Saída (Unid)', type: 'number' },
        { key: 'operator', label: 'Operador que Retirou', type: 'text' },
        { key: 'destination', label: 'Destino / Linha de Embalagem', type: 'text' }
      ]
    },
    {
      id: 'F299.63',
      title: 'F299.63 - CONTROLE DE USO DE ETIQUETA',
      version: 'V03 - 25.06.2021',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora', type: 'time' },
        { key: 'variety', label: 'Lote / Variedade', type: 'text' },
        { key: 'label_code', label: 'Rótulo / Código PLU', type: 'text' },
        { key: 'quantity_applied', label: 'Qtd Aplicada (Unid)', type: 'number' },
        { key: 'losses', label: 'Perdas / Refugos', type: 'number' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F299.10',
      title: 'F299.10 - ESTOQUE DE SOBRAS DE ETIQUETAS',
      version: 'V02 - 25.06.2021',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'DIÁRIO / FECHAMENTO',
      columns: [
        { key: 'date', label: 'Data Fechamento', type: 'date', defaultValue: 'today' },
        { key: 'variety', label: 'Lote / Variedade', type: 'text' },
        { key: 'label_code', label: 'Rótulo / Código PLU', type: 'text' },
        { key: 'stock_initial', label: 'Estoque Inicial', type: 'number' },
        { key: 'returned', label: 'Devolvido ao Estoque', type: 'number' },
        { key: 'balance', label: 'Saldo Final Real', type: 'number' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F217.TEMP',
      title: 'F217.TEMP - CONTROLE DE TEMPERATURA DA CÂMARA FRIA',
      version: 'V12 - 03.11.2022',
      type: 'table-log',
      sectors: ['Packing House', 'Geral'],
      frequency: 'A CADA 4 HORAS',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora Medição', type: 'time' },
        { key: 'chamber', label: 'Câmara Fria', type: 'select', options: ['Câmara 01', 'Câmara 02', 'Câmara 03', 'Câmara 04', 'Câmara 05', 'Câmara Pré-Resfriamento'] },
        { key: 'temp', label: 'Temperatura (°C)', type: 'text' },
        { key: 'humidity', label: 'Umidade Relativa (UR%)', type: 'text' },
        { key: 'status', label: 'Conforme?', type: 'select', options: ['SIM', 'NÃO'] },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F217.TUNEL',
      title: 'F217.TUNEL - CONTROLE DE TEMPERATURA DO TÚNEL DE RESFRIAMENTO',
      version: 'V12 - 03.11.2022',
      type: 'table-log',
      sectors: ['Packing House'],
      frequency: 'A CADA CARGA',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora Medição', type: 'time' },
        { key: 'tunnel', label: 'Túnel de Resfriamento', type: 'select', options: ['Túnel Rápido A', 'Túnel Rápido B', 'Túnel Rápido C'] },
        { key: 'temp_in', label: 'Temp Entrada Fruto (°C)', type: 'text' },
        { key: 'temp_out', label: 'Temp Saída Fruto (°C)', type: 'text' },
        { key: 'cycle_time', label: 'Tempo de Resfriamento (min)', type: 'number' },
        { key: 'responsible', label: 'Responsável', type: 'text' }
      ]
    },
    {
      id: 'F253.FERRAMENTAS',
      title: 'F253.FERRAMENTAS - REGISTRO DE FACAS E TESOURAS',
      version: 'V02 - 25.06.2021',
      type: 'table-log',
      sectors: ['Higiene', 'Campo', 'Packing House'],
      frequency: 'DIÁRIO',
      columns: [
        { key: 'date', label: 'Data', type: 'date', defaultValue: 'today' },
        { key: 'time', label: 'Hora Registro', type: 'time' },
        { key: 'tool_code', label: 'Código da Ferramenta / Nº Faca', type: 'text' },
        { key: 'employee', label: 'Colaborador Associado', type: 'text' },
        { key: 'status', label: 'Estado Geral', type: 'select', options: ['CONFORME (AFIADA/INTEGRA)', 'NÃO CONFORME (DANIFICADA/AMASSADA)', 'QUEBRADA / RETIRADA'] },
        { key: 'chain_ok', label: 'Corrente/Cabo Íntegro?', type: 'select', options: ['SIM', 'NÃO'] },
        { key: 'corr_action', label: 'Ação Corretiva se Irregular', type: 'text' },
        { key: 'responsible', label: 'Responsável Insp.', type: 'text' }
      ]
    }
  ],
  sessions: [], // Daily sessions: { id, date, formId, farmId, status (open, signed), createdBy, signature, validationStatus, certificationStatus }
  records: [],  // { id, sessionId, data, timestamp, userId }
  auditLogs: [] // { id, timestamp, userId, action, details, reason, userAgent }
};

export const initDB = () => {
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) {
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        return;
    }

    const db = JSON.parse(stored);
    db.forms = initialData.forms;
    db.farms = initialData.farms;
    if (!db.labels) {
        db.labels = initialData.labels || [];
    }
    saveDB(db);
};

export const getDB = () => JSON.parse(localStorage.getItem(DB_KEY)) || initialData;
const saveDB = (data) => localStorage.setItem(DB_KEY, JSON.stringify(data));

// Base Audit Logger
const logAction = async (userId, action, details, db, reason = null) => {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userId,
    action,
    details,
    reason,
    userAgent: navigator.userAgent
  };
  db.auditLogs.push(newLog);
};

// Users & Auth
export const getUsers = async () => getDB().users;

export const loginOperator = async (pin) => {
  const db = getDB();
  return db.users.find(u => u.pin === pin && ['operator', 'supervisor'].includes(u.role));
};

export const loginAdmin = async (username, password) => {
  const db = getDB();
  return db.users.find(u => u.username === username && u.password === password && ['admin', 'auditor', 'sede'].includes(u.role));
};

export const addUser = async (adminId, userData) => {
    const db = getDB();
    const newUser = {
        id: `user_${Date.now()}`,
        ...userData
    };
    db.users.push(newUser);
    await logAction(adminId, 'ADD_USER', `Added user ${newUser.name} with role ${newUser.role}`, db);
    saveDB(db);
    return newUser;
};

export const updateUser = async (adminId, userId, userData) => {
    const db = getDB();
    const index = db.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");

    db.users[index] = { ...db.users[index], ...userData };
    await logAction(adminId, 'UPDATE_USER', `Updated user ${userId}`, db);
    saveDB(db);
    return db.users[index];
};

export const deleteUser = async (adminId, userId) => {
    const db = getDB();
    const index = db.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");

    const userName = db.users[index].name;
    db.users.splice(index, 1);
    await logAction(adminId, 'DELETE_USER', `Deleted user ${userName} (${userId})`, db);
    saveDB(db);
};

// Farms & Forms
export const getFarms = async () => getDB().farms;

export const addFarm = async (adminId, farmData) => {
    const db = getDB();
    const newFarm = {
        id: farmData.id.toUpperCase().trim().replace(/\s+/g, '_'),
        name: farmData.name,
        sectors: farmData.sectors || ['Packing House', 'Higiene', 'Campo']
    };
    if (db.farms.some(f => f.id === newFarm.id)) {
        throw new Error("Já existe uma fazenda cadastrada com este código/ID.");
    }
    db.farms.push(newFarm);
    await logAction(adminId, 'ADD_FARM', `Adicionou fazenda ${newFarm.name} (${newFarm.id})`, db);
    saveDB(db);
    return newFarm;
};

export const updateFarm = async (adminId, farmId, farmData) => {
    const db = getDB();
    const index = db.farms.findIndex(f => f.id === farmId);
    if (index === -1) throw new Error("Fazenda não encontrada");

    db.farms[index] = {
        ...db.farms[index],
        name: farmData.name,
        sectors: farmData.sectors || db.farms[index].sectors
    };
    await logAction(adminId, 'UPDATE_FARM', `Atualizou fazenda ${farmId} para ${farmData.name}`, db);
    saveDB(db);
    return db.farms[index];
};

export const deleteFarm = async (adminId, farmId) => {
    const db = getDB();
    const index = db.farms.findIndex(f => f.id === farmId);
    if (index === -1) throw new Error("Fazenda não encontrada");

    const farmName = db.farms[index].name;
    db.farms.splice(index, 1);
    await logAction(adminId, 'DELETE_FARM', `Removeu fazenda ${farmName} (${farmId})`, db);
    saveDB(db);
};

export const getForms = async () => getDB().forms;
export const getFormById = async (id) => getDB().forms.find(form => form.id === id);

// Sessions & Records
export const getSessions = async (farmId, date) => {
    const db = getDB();
    return db.sessions.filter(s => {
        const matchesFarm = !farmId || s.farmId === farmId;
        const matchesDate = !date || s.date === date;
        return matchesFarm && matchesDate;
    }).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
};

export const getSessionWithRecords = async (sessionId) => {
    const db = getDB();
    const session = db.sessions.find(s => s.id === sessionId);
    if(!session) return null;
    
    const records = db.records.filter(r => r.sessionId === sessionId).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    const form = db.forms.find(f => f.id === session.formId);
    const farm = db.farms.find(f => f.id === session.farmId);
    
    return { ...session, records, form, farmName: farm?.name || session.farmId };
};

export const openSession = async (userId, formId, farmId) => {
    const db = getDB();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    let session = db.sessions.find(s => 
        s.formId === formId && 
        s.farmId === farmId && 
        s.date === today && 
        s.status === 'open'
    );
    
    if(!session) {
        session = {
            id: `sess_${Date.now()}`,
            formId,
            farmId,
            date: today,
            status: 'open',
            validationStatus: 'pending',
            certificationStatus: 'waiting',
            createdBy: userId,
            createdAt: new Date().toISOString()
        };
        db.sessions.push(session);
        await logAction(userId, 'CREATE_SESSION', `Opened session for form ${formId}`, db);
        saveDB(db);
    }
    
    return session;
};


export const addRecord = async (userId, sessionId, recordData) => {
    const db = getDB();
    const newRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        data: recordData,
        timestamp: new Date().toISOString(),
        userId
    };
    db.records.push(newRecord);
    await logAction(userId, 'ADD_RECORD', `Added record to session ${sessionId}`, db);
    saveDB(db);
    return newRecord;
};

export const editRecord = async (userId, sessionId, recordId, newData, isAdmin = false, reason = null) => {
    const db = getDB();
    const session = db.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");
    
    if (session.status !== 'open' && !isAdmin) {
        throw new Error("Cannot edit records in a closed/signed session");
    }

    if (session.status === 'signed' && isAdmin && !reason) {
        throw new Error("Justificativa obrigatória para correção de documentos assinados.");
    }
    
    const recordIndex = db.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) throw new Error("Record not found");
    
    const record = db.records[recordIndex];
    record.history = record.history || [];
    record.history.push({
        timestamp: record.timestamp,
        data: record.data,
        editedBy: record.userId,
        reason: reason
    });
    
    record.data = newData;
    record.lastEditedAt = new Date().toISOString();
    record.lastEditedBy = userId;
    
    const actionType = (session.status === 'signed') ? 'ADMIN_CORRECTION' : 'EDIT_RECORD';
    await logAction(userId, actionType, `Edited record ${recordId} in session ${sessionId} (${session.status})`, db, reason);
    
    saveDB(db);
    return record;
};

export const getRecord = async (recordId) => {
    const db = getDB();
    return db.records.find(r => r.id === recordId);
};

export const deleteRecord = async (userId, sessionId, recordId) => {
    const db = getDB();
    const index = db.records.findIndex(r => r.id === recordId);
    if (index === -1) throw new Error("Registro não encontrado");

    db.records.splice(index, 1);
    await logAction(userId, 'DELETE_RECORD', `Removeu registro ${recordId} da sessão ${sessionId}`, db);
    saveDB(db);
};

export const signAndCloseSession = async (userId, sessionId, signatureData, haccpPassword) => {
    const db = getDB();
    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
    
    if(sessionIndex === -1) throw new Error("Session not found");
    
    const session = db.sessions[sessionIndex];
    const form = db.forms.find(f => f.id === session.formId);
    
    if (form.haccp && haccpPassword !== 'HACCP2024') {
        throw new Error("Senha HACCP incorreta. Documentos HACCP requerem verificação especial.");
    }
    
    db.sessions[sessionIndex].status = 'signed';
    db.sessions[sessionIndex].signature = signatureData;
    db.sessions[sessionIndex].signedAt = new Date().toISOString();
    db.sessions[sessionIndex].signedBy = userId;
    
    await logAction(userId, 'SIGN_SESSION', `Signed and closed session ${sessionId}`, db);
    saveDB(db);
    return db.sessions[sessionIndex];
};

export const updateSessionStatus = async (userId, sessionId, field, status) => {
    const db = getDB();
    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return null;
    
    const oldStatus = db.sessions[sessionIndex][field];
    db.sessions[sessionIndex][field] = status;
    db.sessions[sessionIndex].updatedAt = new Date().toISOString();
    
    await logAction(userId, 'UPDATE_STATUS', `Changed ${field} from ${oldStatus} to ${status} for session ${sessionId}`, db);
    
    saveDB(db);
    return db.sessions[sessionIndex];
};

export const getAuditLogs = async () => {
    const db = getDB();
    return db.auditLogs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const getLabels = async () => {
    const db = getDB();
    if (!db.labels) {
        db.labels = initialData.labels || [];
        saveDB(db);
    }
    return db.labels;
};

export const addLabel = async (userId, labelData) => {
    const db = getDB();
    db.labels = db.labels || [];
    const newLabel = {
        id: `L_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: labelData.name,
        variety: labelData.variety,
        barcode: labelData.barcode,
        image: labelData.image // Base64 string
    };
    db.labels.push(newLabel);
    await logAction(userId, 'ADD_LABEL', `Cadastrou nova etiqueta: ${labelData.name} (${labelData.barcode})`, db);
    saveDB(db);
    return newLabel;
};

export const deleteLabel = async (userId, labelId) => {
    const db = getDB();
    db.labels = db.labels || [];
    const index = db.labels.findIndex(l => l.id === labelId);
    if (index === -1) throw new Error("Etiqueta não encontrada");
    
    const label = db.labels[index];
    db.labels.splice(index, 1);
    await logAction(userId, 'DELETE_LABEL', `Excluiu a etiqueta ${label.name}`, db);
    saveDB(db);
};
