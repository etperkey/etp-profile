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
    'AI',
    'Flow Cytometry',
    'scRNAseq',
    'Molecular Biology',
    'Mouse Models',
    'Data Visualization',
  ];

  // Easter eggs for certain skills
  const easterEggs = {
    'R / Shiny': 'https://www.youtube.com/shorts/xH5CWzye3W8',
    'AI': 'https://dune.fandom.com/wiki/Butlerian_Jihad',
    'Python': 'https://www.youtube.com/watch?v=vt0Y39eMvpI&t=40',
    'Mouse Models': 'https://www.youtube.com/watch?v=SfrxQmR4_dY&t=630',
    'Data Visualization': 'https://www.youtube.com/watch?v=Vxq9yj2pVWk',
    'Molecular Biology': 'https://www.youtube.com/watch?v=dMjQ3hA9mEA',
    'scRNAseq': '/kmeans.html',
    'Immunotherapy Optimization': 'https://www.youtube.com/watch?v=zicGxU5MfwE&t=35',
    'Translational Research': 'https://www.youtube.com/watch?v=S4PYI6TzqYk&t=10',
  };

  const handleSkillClick = (skill) => {
    if (easterEggs[skill]) {
      window.open(easterEggs[skill], '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section id="about" className="about">
      <div className="container">
        <h2 className="section-title">About Me</h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              I&apos;m a physician-scientist and Hematology/Oncology Fellow at the University of
              Chicago with a <strong>clinical focus in Lymphoma</strong>. My training combines deep
              expertise in <strong>tumor immunology</strong> with hands-on care of patients receiving cutting-edge{' '}
              <strong>immunotherapies</strong> including BiTEs, CAR-T cells, and checkpoint inhibitors.
            </p>
            <p>
              <strong>Current Research:</strong> Working with{' '}
              <a
                href="https://klinelab.uchicago.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="mentor-link"
              >
                <strong>Dr. Justin Kline</strong> <span aria-hidden="true">↗</span>
              </a>
              &apos;s lab, I investigate the intersection of lymphomagenesis, lymphoma genetics, and
              immune escape mechanisms—with the goals of improving immunotherapies and understanding
              ways to prevent transformation to aggressive lymphomas.
            </p>
            <p>
              <strong>Prior Work:</strong> My PhD training with{' '}
              <a
                href="https://www.mskcc.org/research-areas/labs/ivan-maillard"
                target="_blank"
                rel="noopener noreferrer"
                className="mentor-link"
              >
                <strong>Dr. Ivan Maillard</strong> <span aria-hidden="true">↗</span>
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
                <strong>Dr. Richard A. Miller</strong> <span aria-hidden="true">↗</span>
              </a>
              .
            </p>
          </div>
          <div className="about-skills">
            <h3>Current Focus</h3>
            <ul className="skills-list">
              {currentFocus.map((item, index) => (
                <li
                  key={index}
                  className={`skill-item current ${easterEggs[item] ? 'has-easter-egg' : ''}`}
                  onClick={() => handleSkillClick(item)}
                  onKeyDown={(e) => {
                    if (easterEggs[item] && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSkillClick(item);
                    }
                  }}
                  role={easterEggs[item] ? 'button' : undefined}
                  tabIndex={easterEggs[item] ? 0 : undefined}
                  style={easterEggs[item] ? { cursor: 'pointer' } : {}}
                >
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
                <li
                  key={index}
                  className={`skill-item ${easterEggs[item] ? 'has-easter-egg' : ''}`}
                  onClick={() => handleSkillClick(item)}
                  onKeyDown={(e) => {
                    if (easterEggs[item] && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSkillClick(item);
                    }
                  }}
                  role={easterEggs[item] ? 'button' : undefined}
                  tabIndex={easterEggs[item] ? 0 : undefined}
                  style={easterEggs[item] ? { cursor: 'pointer' } : {}}
                >
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
