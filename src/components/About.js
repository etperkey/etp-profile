function About() {
  const currentFocus = [
    'Lymphoma Biology',
    'Immune Escape Mechanisms',
    'Immunotherapy Optimization',
    'BiTE & CAR-T Therapy',
    'Tumor Microenvironment',
    'Translational Research',
  ];

  const priorExpertise = ['Notch Signaling', 'T Cell Immunity', 'GVHD', 'Stromal Cell Biology'];

  const technical = [
    'R / Shiny',
    'Python',
    'Flow Cytometry',
    'Single-cell RNA-seq',
    'Mouse Models',
    'Data Visualization',
  ];

  return (
    <section id="about" className="about">
      <div className="container">
        <h2 className="section-title">About Me</h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              I&apos;m a physician-scientist and Hematology/Oncology Fellow at the University of
              Chicago with a <strong>clinical focus in Lymphoma</strong>. My training combines deep
              expertise in tumor immunology with hands-on care of patients receiving cutting-edge
              immunotherapies including BiTEs, CAR-T cells, and checkpoint inhibitors.
            </p>
            <p>
              <strong>Current Research:</strong> Working with{' '}
              <a
                href="https://klinelab.uchicago.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="mentor-link"
              >
                <strong>Dr. Justin Kline</strong>
              </a>
              &apos;s lab, I investigate how lymphomas evade immune surveillance and how we can
              overcome resistance to immunotherapy. My projects focus on TP53-driven immune escape,
              optimizing BiTE therapy, and understanding lymphoma dissemination through chemokine
              signaling.
            </p>
            <p>
              <strong>Prior Work:</strong> My PhD training with{' '}
              <a
                href="https://www.mskcc.org/research-areas/labs/ivan-maillard"
                target="_blank"
                rel="noopener noreferrer"
                className="mentor-link"
              >
                <strong>Dr. Ivan Maillard</strong>
              </a>{' '}
              at the University of Michigan and University of Pennsylvania uncovered how stromal
              cells in lymph nodes regulate T cell responses through Notch signaling, with
              applications to graft-versus-host disease and T cell aging. This work was published in
              JCI, JEM, Journal of Immunology, and Science Translational Medicine. Prior to that, I
              studied ways to reverse the effects of aging on the immune system in the lab of{' '}
              <a
                href="https://www.richmillerlab.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mentor-link"
              >
                <strong>Dr. Richard A. Miller</strong>
              </a>
              .
            </p>
          </div>
          <div className="about-skills">
            <h3>Current Focus</h3>
            <ul className="skills-list">
              {currentFocus.map((item, index) => (
                <li key={index} className="skill-item current">
                  {item}
                </li>
              ))}
            </ul>
            <h3 style={{ marginTop: '25px' }}>PhD Expertise</h3>
            <ul className="skills-list">
              {priorExpertise.map((item, index) => (
                <li key={index} className="skill-item prior">
                  {item}
                </li>
              ))}
            </ul>
            <h3 style={{ marginTop: '25px' }}>Technical Skills</h3>
            <ul className="skills-list">
              {technical.map((item, index) => (
                <li key={index} className="skill-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
