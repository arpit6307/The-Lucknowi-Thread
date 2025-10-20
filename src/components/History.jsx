import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

// Timeline ke liye data
const timelineData = [
  {
    year: "17th Century",
    title: "Mughal Origins",
    description: "Legend suggests Empress Nur Jahan, wife of Mughal emperor Jahangir, introduced the Persian art of Chikankari to India, laying the foundation for this delicate craft.",
    icon: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    aos: 'fade-right'
  },
  {
    year: "18th & 19th Century",
    title: "Nawabi Patronage",
    description: "Under the patronage of the Nawabs of Awadh in Lucknow, Chikankari flourished. It evolved into a sophisticated art form, gracing the courts and royal attire.",
    icon: 'M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.781 11.03a.5.5 0 0 1 .657.278l.095.193c.125.253.298.49.508.709a.5.5 0 0 1-.714.714c-.23-.23-.42-.5-.544-.793a.5.5 0 0 1 .278-.657m4.438 0a.5.5 0 0 1 .657.278l.095.193c.125.253.298.49.508.709a.5.5 0 0 1-.714.714c-.23-.23-.42-.5-.544-.793a.5.5 0 0 1 .278-.657M8 13.25a.5.5 0 0 1-.5-.5V12h1v.75a.5.5 0 0 1-.5.5',
    aos: 'fade-left'
  },
  {
    year: "20th Century",
    title: "Post-Independence Revival",
    description: "After a period of decline, dedicated artisans and designers worked to revive Chikankari, adapting it for a wider audience and ensuring the craft's survival.",
    icon: 'M15.22,4.88L12.34,2l-2.81,2.81L12.34,2l-2.81,2.81L12.34,2l-2.81,2.81L12.34,2l-2.81,2.81L12.34,2,9.53,4.88,6.72,2,3.91,4.88,1.1,2,0,3.1,2.81,5.91,0,8.72,1.1,9.82l2.81-2.81,2.81,2.81,2.81-2.81,2.81,2.81,1.1-1.1L12.34,5.91,15.15,8.72l1.1-1.1-2.81-2.81L16,3.1Z',
    aos: 'fade-right'
  },
  {
    year: "Present Day",
    title: "Global Recognition",
    description: "Today, Chikankari is a globally celebrated craft. It adorns high-fashion runways and contemporary apparel, blending timeless tradition with modern aesthetics.",
    icon: 'M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484-.08.08-.162.158-.242.234-.416.396-.787.767-.787.767s-.09.086-.11.114C5.465 9.072 5.39 9.324 5.42 9.59c.04.34.25.69.66.942.43.268.97.448 1.5.448s1.07-.18 1.5-.448c.41-.252.62-.602.66-.942.03-.266-.044-.518-.11-.65-.026-.028-.11-.114-.11-.114s-.37-.371-.786-.767c-.08-.076-.162-.154-.242-.234-.05-.05-.262-.22.743-.484 1.186-.65 3.392-1.861 3.717-3.19a.592.592 0 0 0-.01-1.026.617.617 0 0 0-.583-.02c-1.353.65-2.92.83-4.22.83s-2.867-.18-4.22-.83a.617.617 0 0 0-.583.02.592.592 0 0 0-.01 1.026',
    aos: 'fade-left'
  }
];

const History = () => (
  <section id="history" className="history-section">
    <Container>
      <div className="text-center" data-aos="fade-up">
        <h2 className="font-cormorant display-4">A Thread Through Time</h2>
        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Discover the rich journey of Chikankari, from the opulent Mughal courts to the modern fashion runways of today.
        </p>
      </div>
      
      <div className="timeline-container">
        <div className="timeline">
          {timelineData.map((item, index) => (
            <div className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`} key={index} data-aos={item.aos}>
              <div className="timeline-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d={item.icon} />
                </svg>
              </div>
              <div className="timeline-content">
                <span className="timeline-year">{item.year}</span>
                <h4 className="font-cormorant">{item.title}</h4>
                <p className="text-muted small">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </Container>
  </section>
);

export default History;
