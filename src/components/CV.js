import React from 'react';
import cvData from '../data/cv.json';
import BloodSmearBackground from './BloodSmearBackground';

function CV() {
  const handlePrint = () => {
    window.print();
  };

  // Highlight "Perkey E" in author strings
  const highlightAuthor = (authors) => {
    return authors.split(/(Perkey E\*?|Perkey, E\.?,?)/).map((part, i) =>
      part.match(/Perkey/) ? <strong key={i}>{part}</strong> : part
    );
  };

  // Calculate publication metrics
  const publicationMetrics = {
    total: cvData.publications.length,
    firstAuthor: cvData.publications.filter(p => p.firstAuthor || p.equalFirst).length,
    reviews: cvData.reviews.length,
  };

  return (
    <div className="cv-page">
      <BloodSmearBackground density="medium" />
      <div className="cv-container">
        <a href="#home" className="cv-back-link no-print" onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}>Back to Home</a>
        <button className="cv-print-btn no-print" onClick={handlePrint}>
          Download PDF
        </button>

        {/* Header */}
        <header className="cv-header">
          <h1>CURRICULUM VITAE</h1>
          <h2>{cvData.name}, {cvData.credentials}</h2>
          <p className="cv-metrics">
            {publicationMetrics.total} peer-reviewed publications ({publicationMetrics.firstAuthor} first/co-first author) · {publicationMetrics.reviews} reviews
            {cvData.scholarMetrics?.hIndex && <> · h-index: {cvData.scholarMetrics.hIndex}</>}
            {cvData.contact.googleScholar && (
              <> · <a href={cvData.contact.googleScholar} target="_blank" rel="noopener noreferrer">Google Scholar</a></>
            )}
          </p>
        </header>

        {/* Personal Information */}
        <section className="cv-section">
          <h3>Personal Information</h3>
          <div className="cv-contact">
            <div className="cv-contact-block">
              <strong>Address:</strong>
              <div>
                {cvData.contact.address.map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
            </div>
            <div className="cv-contact-block">
              <p><strong>Email:</strong> <a href={`mailto:${cvData.contact.email}`}>{cvData.contact.email}</a></p>
              {cvData.contact.secondaryEmails && (
                <p><strong>Alt Email:</strong> {cvData.contact.secondaryEmails.map((email, i) => (
                  <span key={i}>
                    {i > 0 && '; '}
                    <a href={`mailto:${email}`}>{email}</a>
                  </span>
                ))}</p>
              )}
              {cvData.contact.website && (
                <p><strong>Website:</strong> <a href={cvData.contact.website} target="_blank" rel="noopener noreferrer">{cvData.contact.website.replace('https://', '')}</a></p>
              )}
              {cvData.contact.orcid && (
                <p><strong>ORCID:</strong> <a href={`https://orcid.org/${cvData.contact.orcid}`} target="_blank" rel="noopener noreferrer">{cvData.contact.orcid}</a></p>
              )}
              {cvData.contact.googleScholar && (
                <p><strong>Google Scholar:</strong> <a href={cvData.contact.googleScholar} target="_blank" rel="noopener noreferrer">{cvData.contact.googleScholar.replace('https://', '')}</a></p>
              )}
            </div>
          </div>
        </section>

        {/* Clinical Training */}
        <section className="cv-section">
          <h3>Clinical Training</h3>
          {cvData.clinicalTraining.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.program}</span>
                <span className="cv-institution">{item.institution}</span>
                <p>{item.department}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Education */}
        <section className="cv-section">
          <h3>Education</h3>
          {cvData.education.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.degree}</span>
                <span className="cv-institution">{item.institution}</span>
                <p>{item.field}{item.mentor && `. Mentor: ${item.mentor}`}</p>
                {item.thesis && <p className="cv-thesis"><em>Dissertation:</em> {item.thesisUrl ? <a href={item.thesisUrl} target="_blank" rel="noopener noreferrer">"{item.thesis}"</a> : `"${item.thesis}"`}</p>}
              </div>
            </div>
          ))}
        </section>

        {/* Certifications */}
        <section className="cv-section">
          <h3>Certifications and Licenses</h3>
          {cvData.certifications.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.name}</span>
                {item.details && <p>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.details}</a> : item.details}</p>}
              </div>
            </div>
          ))}
        </section>

        {/* Research Positions */}
        <section className="cv-section">
          <h3>Research Positions</h3>
          {cvData.researchPositions.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.title}</span>
                <span className="cv-institution">{item.institution}</span>
                {item.mentor && (
                  <p>
                    Mentor: {item.mentorLinked ? (
                      <>{item.mentor}<a href={item.mentorUrl} target="_blank" rel="noopener noreferrer">{item.mentorLinked}</a></>
                    ) : item.mentorUrl ? (
                      <a href={item.mentorUrl} target="_blank" rel="noopener noreferrer">{item.mentor}</a>
                    ) : item.mentor}
                  </p>
                )}
                {item.description && <p>{item.description}</p>}
              </div>
            </div>
          ))}
        </section>

        {/* Publications */}
        <section className="cv-section">
          <h3>Publications</h3>
          <p className="cv-note">*denotes equal first authorship</p>
          {cvData.publications.map((pub, i) => (
            <div key={i} className={`cv-publication ${pub.firstAuthor || pub.equalFirst ? 'first-author' : ''}`}>
              <span className="cv-pub-year">{pub.year}</span>
              <p className="cv-pub-details">
                {highlightAuthor(pub.authors)}. "{pub.title}." <em>{pub.journal}</em>
                {pub.details && `. ${pub.details}`}
                {pub.pmid && <>. PMID: <a href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`} target="_blank" rel="noopener noreferrer">{pub.pmid}</a></>}
                {pub.doi && <>. DOI: <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">{pub.doi}</a></>}.
              </p>
            </div>
          ))}
        </section>

        {/* Reviews */}
        <section className="cv-section">
          <h3>Reviews and Commentaries</h3>
          {cvData.reviews.map((pub, i) => (
            <div key={i} className="cv-publication">
              <span className="cv-pub-year">{pub.year}</span>
              <p className="cv-pub-details">
                {highlightAuthor(pub.authors)}. "{pub.title}." <em>{pub.journal}</em>
                {pub.pmid && <>. PMID: <a href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`} target="_blank" rel="noopener noreferrer">{pub.pmid}</a></>}
                {pub.doi && <>. DOI: <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">{pub.doi}</a></>}.
              </p>
            </div>
          ))}
        </section>

        {/* Consortium Publications */}
        {cvData.consortiumPublications && (
          <section className="cv-section">
            <h3>Consortium Publications</h3>
            <p className="cv-note">As member of {cvData.consortiumPublications.consortium}</p>
            {cvData.consortiumPublications.papers.map((pub, i) => (
              <div key={i} className="cv-publication">
                <span className="cv-pub-year">{pub.year}</span>
                <p className="cv-pub-details">
                  {pub.authors} "{pub.title}." <em>{pub.journal}</em>
                  {pub.pmid && <>. PMID: <a href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`} target="_blank" rel="noopener noreferrer">{pub.pmid}</a></>}
                  {pub.doi && <>. DOI: <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">{pub.doi}</a></>}.
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Grants */}
        <section className="cv-section">
          <h3>Grants</h3>
          {cvData.grants.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.name}</span>
                {item.details && <p>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.details}</a> : item.details}</p>}
              </div>
            </div>
          ))}
        </section>

        {/* Honors and Awards */}
        <section className="cv-section">
          <h3>Honors and Awards</h3>
          {cvData.awards.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.name}</span>
                {item.details && <p>{item.details}</p>}
              </div>
            </div>
          ))}
        </section>

        {/* Presentations */}
        <section className="cv-section">
          <h3>Selected Presentations, Posters, and Conferences</h3>
          {cvData.presentations.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.year}</span>
              <div className="cv-details">
                <span className="cv-title">{item.event}</span>
                <p>{item.location && `${item.location}. `}{item.type}.</p>
              </div>
            </div>
          ))}
        </section>

        {/* Teaching */}
        <section className="cv-section">
          <h3>Teaching Experience</h3>
          {cvData.teaching.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.role}</span>
                <p>{item.course}. {item.institution}.</p>
              </div>
            </div>
          ))}
        </section>

        {/* Mentorship */}
        <section className="cv-section">
          <h3>Mentorship</h3>
          {cvData.mentorship.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.name}, {item.role}</span>
                <p>Currently: {item.current}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Service */}
        <section className="cv-section">
          <h3>Service</h3>
          {cvData.service.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.role}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Memberships */}
        <section className="cv-section">
          <h3>Professional Membership</h3>
          {cvData.memberships.map((item, i) => (
            <div key={i} className="cv-entry">
              <span className="cv-years">{item.years}</span>
              <div className="cv-details">
                <span className="cv-title">{item.organization}</span>
                {item.status && <p>{item.status}</p>}
              </div>
            </div>
          ))}
        </section>

        <footer className="cv-footer no-print">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </footer>
      </div>
    </div>
  );
}

export default CV;
