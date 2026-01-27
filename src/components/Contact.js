import { useState } from 'react';
import Toast from './Toast';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState('idle');
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'contact',
          ...formData,
        }).toString(),
      });

      if (response.ok) {
        setStatus('idle');
        setFormData({ name: '', email: '', message: '' });
        setToast({
          type: 'success',
          message: "Message sent! I'll get back to you soon.",
        });
      } else {
        setStatus('idle');
        setToast({
          type: 'error',
          message: 'Failed to send message. Please try again or email me directly.',
        });
      }
    } catch (error) {
      setStatus('idle');
      setToast({
        type: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <h2 className="section-title">Get In Touch</h2>
        <p className="contact-intro">
          Interested in collaborating on research or have questions about my work? I&apos;m always
          happy to discuss immunology, Notch signaling, lymphoma, or potential collaborations.
        </p>

        <div className="contact-info">
          <div className="contact-item">
            <h3>Email</h3>
            <a href="mailto:eric.perkey@uchicagomedicine.org">eric.perkey@uchicagomedicine.org</a>
            <br />
            <a href="mailto:ericperkey@gmail.com">ericperkey@gmail.com</a>
            <br />
            <a href="mailto:eperkey@umich.edu">eperkey@umich.edu</a>
          </div>
          <div className="contact-item">
            <h3>Institution</h3>
            <p>
              Section of Hematology/Oncology
              <br />
              University of Chicago
              <br />
              5841 South Maryland Avenue
              <br />
              Chicago, IL 60637
            </p>
          </div>
        </div>

        <div className="contact-divider">
          <span>or send a message</span>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input type="hidden" name="form-name" value="contact" />
          <p hidden>
            <label>
              Don&apos;t fill this out: <input name="bot-field" onChange={handleChange} />
            </label>
          </p>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Your message..."
              rows="5"
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        {toast && (
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        )}
      </div>
    </section>
  );
}

export default Contact;
