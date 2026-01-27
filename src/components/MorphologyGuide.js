import { useState } from 'react';
import './MorphologyGuide.css';

function MorphologyGuide() {
  // All sections start collapsed
  const [expandedSections, setExpandedSections] = useState({
    rbc: false,
    nrbc: false,
    wbc: false,
    plt: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const rbcMorphologies = [
    {
      id: 'normal-rbc',
      name: 'Normal RBC',
      aka: 'Normocyte',
      description: 'Biconcave disc, ~7.5µm diameter, central pallor ~1/3 of cell',
      conditions: ['Normal blood'],
      className: 'normal-rbc',
    },
    {
      id: 'microcyte',
      name: 'Microcyte',
      aka: 'Small RBC',
      description: 'Smaller than normal (<7µm), often hypochromic with increased central pallor',
      conditions: ['Iron deficiency anemia', 'Thalassemia', 'Chronic disease', 'Sideroblastic anemia'],
      className: 'microcyte',
    },
    {
      id: 'macrocyte',
      name: 'Macrocyte',
      aka: 'Large RBC',
      description: 'Larger than normal (>8.5µm), oval or round, lacks central pallor',
      conditions: ['B12/Folate deficiency', 'MDS', 'Liver disease', 'Reticulocytosis'],
      className: 'macrocyte',
    },
    {
      id: 'spherocyte',
      name: 'Spherocyte',
      aka: 'Sphere cell',
      description: 'Small, round, dense cells lacking central pallor. Lost membrane surface area.',
      conditions: ['Hereditary spherocytosis', 'Autoimmune hemolytic anemia', 'Burns', 'Clostridial sepsis'],
      className: 'spherocyte',
    },
    {
      id: 'target-cell',
      name: 'Target Cell',
      aka: 'Codocyte',
      description: 'Bull\'s-eye appearance with central and peripheral hemoglobin, pale ring between',
      conditions: ['Thalassemia', 'Liver disease', 'Hemoglobin C', 'Post-splenectomy', 'Iron deficiency'],
      className: 'target-cell',
    },
    {
      id: 'schistocyte',
      name: 'Schistocyte',
      aka: 'Fragmented RBC',
      description: 'Helmet cells, triangles, or irregular fragments from mechanical destruction',
      conditions: ['TTP/HUS', 'DIC', 'MAHA', 'Mechanical heart valves', 'Severe burns'],
      className: 'schistocyte',
    },
    {
      id: 'sickle-cell',
      name: 'Sickle Cell',
      aka: 'Drepanocyte',
      description: 'Crescent or sickle-shaped from HbS polymerization under hypoxia',
      conditions: ['Sickle cell disease', 'Sickle cell trait (rare, under stress)'],
      className: 'sickle-cell',
    },
    {
      id: 'teardrop',
      name: 'Teardrop Cell',
      aka: 'Dacrocyte',
      description: 'Single pointed projection giving teardrop/pear shape. Formed squeezing through fibrotic marrow.',
      conditions: ['Myelofibrosis', 'Myelophthisis', 'Thalassemia major', 'Megaloblastic anemia'],
      className: 'teardrop',
    },
    {
      id: 'elliptocyte',
      name: 'Elliptocyte',
      aka: 'Ovalocyte',
      description: 'Oval or elliptical shaped RBCs, elongated',
      conditions: ['Hereditary elliptocytosis', 'Iron deficiency', 'Megaloblastic anemia', 'Myelofibrosis'],
      className: 'elliptocyte',
    },
    {
      id: 'bite-cell',
      name: 'Bite Cell',
      aka: 'Degmacyte',
      description: 'Semicircular "bite" removed by splenic macrophages removing Heinz bodies',
      conditions: ['G6PD deficiency', 'Oxidant drug exposure', 'Unstable hemoglobins'],
      className: 'bite-cell',
    },
    {
      id: 'burr-cell',
      name: 'Burr Cell',
      aka: 'Echinocyte',
      description: 'Evenly spaced, small spicules around the entire cell surface',
      conditions: ['Uremia', 'Pyruvate kinase deficiency', 'Artifact', 'Burns'],
      className: 'burr-cell',
    },
    {
      id: 'acanthocyte',
      name: 'Acanthocyte',
      aka: 'Spur cell',
      description: 'Irregularly spaced, varying length spicules. More irregular than burr cells.',
      conditions: ['Liver disease', 'Abetalipoproteinemia', 'Post-splenectomy', 'McLeod syndrome'],
      className: 'acanthocyte',
    },
    {
      id: 'stomatocyte',
      name: 'Stomatocyte',
      aka: 'Mouth cell',
      description: 'Slit-like or mouth-shaped central pallor instead of circular',
      conditions: ['Hereditary stomatocytosis', 'Alcoholism', 'Liver disease', 'Artifact'],
      className: 'stomatocyte',
    },
    {
      id: 'rouleaux',
      name: 'Rouleaux',
      aka: 'Stacked coins',
      description: 'RBCs stacked like coins due to increased plasma proteins coating cells',
      conditions: ['Multiple myeloma', 'Waldenström macroglobulinemia', 'Chronic inflammation', 'Pregnancy'],
      className: 'rouleaux',
    },
    {
      id: 'howell-jolly',
      name: 'Howell-Jolly Body',
      aka: 'Nuclear remnant',
      description: 'Small, round, dark purple inclusion (DNA remnant) normally removed by spleen',
      conditions: ['Post-splenectomy', 'Functional asplenia', 'Megaloblastic anemia', 'MDS'],
      className: 'howell-jolly',
    },
    {
      id: 'basophilic-stippling',
      name: 'Basophilic Stippling',
      aka: 'Punctate basophilia',
      description: 'Fine or coarse blue granules (ribosomal RNA aggregates) throughout the cell',
      conditions: ['Lead poisoning', 'Thalassemia', 'MDS', 'Heavy metal toxicity'],
      className: 'basophilic-stippling',
    },
    {
      id: 'pappenheimer',
      name: 'Pappenheimer Bodies',
      aka: 'Siderocytes',
      description: 'Iron-containing granules (seen with Prussian blue stain), usually peripheral',
      conditions: ['Sideroblastic anemia', 'Post-splenectomy', 'Hemochromatosis', 'MDS'],
      className: 'pappenheimer',
    },
    {
      id: 'polychromasia',
      name: 'Polychromasia',
      aka: 'Reticulocyte',
      description: 'Bluish-gray tint due to residual RNA in young RBCs (reticulocytes)',
      conditions: ['Hemolysis', 'Acute blood loss', 'Response to anemia treatment', 'Bone marrow recovery'],
      className: 'polychromasia',
    },
    {
      id: 'hypochromia',
      name: 'Hypochromia',
      aka: 'Pale RBC',
      description: 'Increased central pallor (>1/3 of cell) due to decreased hemoglobin',
      conditions: ['Iron deficiency', 'Thalassemia', 'Sideroblastic anemia', 'Chronic disease'],
      className: 'hypochromia',
    },
  ];

  const wbcMorphologies = [
    {
      id: 'normal-neutrophil',
      name: 'Normal Neutrophil',
      aka: 'Segmented neutrophil, PMN',
      description: '3-5 nuclear lobes connected by thin filaments, pink granular cytoplasm',
      conditions: ['Normal blood'],
      className: 'neutrophil',
    },
    {
      id: 'normal-lymphocyte',
      name: 'Normal Lymphocyte',
      aka: 'Small lymphocyte',
      description: 'Small round cell with high N:C ratio, dense round nucleus, scant blue cytoplasm',
      conditions: ['Normal blood'],
      className: 'lymphocyte',
    },
    {
      id: 'normal-monocyte',
      name: 'Normal Monocyte',
      aka: 'Monocyte',
      description: 'Largest normal WBC, kidney/horseshoe-shaped nucleus, gray-blue cytoplasm with fine granules',
      conditions: ['Normal blood'],
      className: 'monocyte',
    },
    {
      id: 'normal-eosinophil',
      name: 'Normal Eosinophil',
      aka: 'Eosinophil',
      description: 'Bilobed nucleus, abundant orange-red granules filling cytoplasm',
      conditions: ['Normal blood'],
      className: 'eosinophil',
    },
    {
      id: 'normal-basophil',
      name: 'Normal Basophil',
      aka: 'Basophil',
      description: 'Bilobed nucleus often obscured by large dark purple/blue granules',
      conditions: ['Normal blood'],
      className: 'basophil',
    },
    {
      id: 'band-neutrophil',
      name: 'Band Neutrophil',
      aka: 'Stab cell',
      description: 'Immature neutrophil with horseshoe/band-shaped nucleus, no segmentation',
      conditions: ['Left shift', 'Bacterial infection', 'Inflammation', 'CML'],
      className: 'band-neutrophil',
    },
    {
      id: 'hypersegmented',
      name: 'Hypersegmented Neutrophil',
      aka: 'Macropolycyte',
      description: '6+ nuclear lobes, indicates megaloblastic maturation',
      conditions: ['B12 deficiency', 'Folate deficiency', 'MDS', 'Congenital'],
      className: 'hypersegmented',
    },
    {
      id: 'toxic-granulation',
      name: 'Toxic Granulation',
      aka: 'Toxic changes',
      description: 'Dark, coarse, prominent azurophilic granules in neutrophils',
      conditions: ['Severe infection/sepsis', 'Burns', 'G-CSF therapy', 'Inflammation'],
      className: 'toxic-granulation',
    },
    {
      id: 'dohle-bodies',
      name: 'Döhle Bodies',
      aka: 'Döhle inclusion',
      description: 'Light blue, oval cytoplasmic inclusions (rough ER remnants)',
      conditions: ['Infection', 'Burns', 'Pregnancy', 'May-Hegglin anomaly'],
      className: 'dohle-bodies',
    },
    {
      id: 'atypical-lymph',
      name: 'Atypical Lymphocyte',
      aka: 'Reactive lymphocyte, Downey cell',
      description: 'Large lymphocyte with abundant blue cytoplasm, indented by adjacent RBCs',
      conditions: ['EBV (mono)', 'CMV', 'Viral hepatitis', 'Toxoplasmosis', 'Drug reactions'],
      className: 'atypical-lymph',
    },
    {
      id: 'blast',
      name: 'Blast Cell',
      aka: 'Leukemic blast',
      description: 'Large immature cell with high N:C ratio, fine chromatin, prominent nucleoli',
      conditions: ['Acute leukemia (AML, ALL)', 'Blast crisis CML', 'MDS with excess blasts'],
      className: 'blast',
    },
    {
      id: 'smudge-cell',
      name: 'Smudge Cell',
      aka: 'Basket cell',
      description: 'Fragile lymphocytes that rupture during smear preparation',
      conditions: ['CLL (characteristic)', 'Other lymphoproliferative disorders'],
      className: 'smudge-cell',
    },
    {
      id: 'auer-rod',
      name: 'Promyelocyte with Auer Rod',
      aka: 'Auer body',
      description: 'Immature myeloid cell with azurophilic granules and pink/red needle-like Auer rod in cytoplasm',
      conditions: ['AML (diagnostic)', 'APL (bundled Auer rods)', 'MDS-EB'],
      className: 'auer-rod',
    },
    {
      id: 'myelocyte',
      name: 'Myelocyte',
      aka: 'Intermediate granulocyte',
      description: 'Round eccentric nucleus, primary granules present, intermediate between promyelocyte and metamyelocyte',
      conditions: ['CML', 'Severe infection (left shift)', 'Myeloproliferative neoplasms', 'Recovery from agranulocytosis'],
      className: 'myelocyte',
    },
    {
      id: 'metamyelocyte',
      name: 'Metamyelocyte',
      aka: 'Juvenile granulocyte',
      description: 'Kidney/indented nucleus (not yet band-shaped), secondary granules, nearly mature form',
      conditions: ['CML', 'Severe infection (left shift)', 'Myeloproliferative neoplasms', 'Leukemoid reaction'],
      className: 'metamyelocyte',
    },
  ];

  const plateletMorphologies = [
    {
      id: 'normal-platelet',
      name: 'Normal Platelet',
      aka: 'Thrombocyte',
      description: 'Small (2-4µm), anucleate, light blue with purple granules',
      conditions: ['Normal blood'],
      className: 'platelet',
    },
    {
      id: 'giant-platelet',
      name: 'Giant Platelet',
      aka: 'Megathrombocyte',
      description: 'Platelet approaching or exceeding RBC size',
      conditions: ['ITP', 'MDS', 'Bernard-Soulier syndrome', 'May-Hegglin anomaly'],
      className: 'giant-platelet',
    },
    {
      id: 'platelet-clump',
      name: 'Platelet Clump',
      aka: 'Platelet aggregate',
      description: 'Clumped platelets that may cause pseudothrombocytopenia',
      conditions: ['EDTA-induced clumping', 'Poorly mixed sample', 'Platelet activation'],
      className: 'platelet-clump',
    },
    {
      id: 'hypogranular-plt',
      name: 'Hypogranular Platelet',
      aka: 'Gray platelet',
      description: 'Pale platelets with decreased or absent granules',
      conditions: ['MDS', 'Gray platelet syndrome', 'AML'],
      className: 'hypogranular-plt',
    },
  ];

  const nrbcMorphologies = [
    {
      id: 'nrbc-ortho',
      name: 'Orthochromatic nRBC',
      aka: 'Late normoblast',
      description: 'Most mature nRBC, small pyknotic nucleus, pink cytoplasm like mature RBC',
      conditions: ['Severe anemia', 'Hemolysis', 'Marrow stress'],
      className: 'nrbc-ortho',
    },
    {
      id: 'nrbc-poly',
      name: 'Polychromatic nRBC',
      aka: 'Intermediate normoblast',
      description: 'Medium nucleus, blue-gray cytoplasm showing hemoglobinization',
      conditions: ['Severe anemia', 'Extramedullary hematopoiesis', 'Myelophthisis'],
      className: 'nrbc-poly',
    },
    {
      id: 'nrbc-baso',
      name: 'Basophilic nRBC',
      aka: 'Early normoblast',
      description: 'Large nucleus, deeply basophilic (blue) cytoplasm, no hemoglobin yet',
      conditions: ['Severe marrow stress', 'Erythroleukemia', 'Myelofibrosis'],
      className: 'nrbc-baso',
    },
  ];

  return (
    <div className="morphology-guide">
      <a href="#smear" className="guide-back-link">
        ← Back to Blood Smear
      </a>

      <div className="guide-header">
        <h1>Blood Cell Morphology Guide</h1>
        <p>Reference guide for peripheral blood smear interpretation</p>
      </div>

      <div className="guide-content">
        {/* RBC Morphologies */}
        <section className={`morphology-section ${expandedSections.rbc ? 'expanded' : 'collapsed'}`}>
          <button className="section-toggle" onClick={() => toggleSection('rbc')}>
            <span className="toggle-icon">{expandedSections.rbc ? '▼' : '▶'}</span>
            <h2 className="section-title rbc-title">Red Blood Cell Morphologies</h2>
            <span className="section-count">{rbcMorphologies.length} types</span>
          </button>
          {expandedSections.rbc && (
            <div className="morphology-grid">
              {rbcMorphologies.map((morph) => (
                <div key={morph.id} className="morphology-card">
                  <div className="cell-preview">
                    <div className={`preview-cell ${morph.className}`}></div>
                  </div>
                  <div className="card-content">
                    <h3>{morph.name}</h3>
                    <p className="aka">{morph.aka}</p>
                    <p className="description">{morph.description}</p>
                    <div className="conditions">
                      <strong>Associated with:</strong>
                      <ul>
                        {morph.conditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* nRBC Morphologies - after RBC, before WBC */}
        <section className={`morphology-section ${expandedSections.nrbc ? 'expanded' : 'collapsed'}`}>
          <button className="section-toggle" onClick={() => toggleSection('nrbc')}>
            <span className="toggle-icon">{expandedSections.nrbc ? '▼' : '▶'}</span>
            <h2 className="section-title nrbc-title">Nucleated RBC Stages</h2>
            <span className="section-count">{nrbcMorphologies.length} types</span>
          </button>
          {expandedSections.nrbc && (
            <div className="morphology-grid">
              {nrbcMorphologies.map((morph) => (
                <div key={morph.id} className="morphology-card">
                  <div className="cell-preview">
                    <div className={`preview-cell ${morph.className}`}></div>
                  </div>
                  <div className="card-content">
                    <h3>{morph.name}</h3>
                    <p className="aka">{morph.aka}</p>
                    <p className="description">{morph.description}</p>
                    <div className="conditions">
                      <strong>Associated with:</strong>
                      <ul>
                        {morph.conditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* WBC Morphologies */}
        <section className={`morphology-section ${expandedSections.wbc ? 'expanded' : 'collapsed'}`}>
          <button className="section-toggle" onClick={() => toggleSection('wbc')}>
            <span className="toggle-icon">{expandedSections.wbc ? '▼' : '▶'}</span>
            <h2 className="section-title wbc-title">White Blood Cell Morphologies</h2>
            <span className="section-count">{wbcMorphologies.length} types</span>
          </button>
          {expandedSections.wbc && (
            <div className="morphology-grid">
              {wbcMorphologies.map((morph) => (
                <div key={morph.id} className="morphology-card">
                  <div className="cell-preview">
                    <div className={`preview-cell ${morph.className}`}></div>
                  </div>
                  <div className="card-content">
                    <h3>{morph.name}</h3>
                    <p className="aka">{morph.aka}</p>
                    <p className="description">{morph.description}</p>
                    <div className="conditions">
                      <strong>Associated with:</strong>
                      <ul>
                        {morph.conditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Platelet Morphologies */}
        <section className={`morphology-section ${expandedSections.plt ? 'expanded' : 'collapsed'}`}>
          <button className="section-toggle" onClick={() => toggleSection('plt')}>
            <span className="toggle-icon">{expandedSections.plt ? '▼' : '▶'}</span>
            <h2 className="section-title plt-title">Platelet Morphologies</h2>
            <span className="section-count">{plateletMorphologies.length} types</span>
          </button>
          {expandedSections.plt && (
            <div className="morphology-grid">
              {plateletMorphologies.map((morph) => (
                <div key={morph.id} className="morphology-card">
                  <div className="cell-preview">
                    <div className={`preview-cell ${morph.className}`}></div>
                  </div>
                  <div className="card-content">
                    <h3>{morph.name}</h3>
                    <p className="aka">{morph.aka}</p>
                    <p className="description">{morph.description}</p>
                    <div className="conditions">
                      <strong>Associated with:</strong>
                      <ul>
                        {morph.conditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="guide-footer">
        <p>Created by Eric Perkey, MD-PhD</p>
        <p>© {new Date().getFullYear()} All Rights Reserved</p>
      </div>
    </div>
  );
}

export default MorphologyGuide;
