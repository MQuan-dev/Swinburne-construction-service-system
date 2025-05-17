import { Link } from "react-router-dom"

function About() {
  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: "John Smith",
      position: "CEO & Founder",
      bio: "With over 25 years of experience in the construction industry, John founded ConstructPro with a vision to provide quality services to homeowners.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      position: "Operations Manager",
      bio: "Sarah ensures that all projects are completed on time and within budget while maintaining our high standards of quality.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      id: 3,
      name: "Michael Chen",
      position: "Lead Architect",
      bio: "Michael brings innovative design solutions to every project, combining functionality with aesthetic appeal.",
      image: "/placeholder.svg?height=150&width=150",
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      position: "Customer Relations",
      bio: "Emily is dedicated to ensuring client satisfaction throughout every step of the construction process.",
      image: "/placeholder.svg?height=150&width=150",
    },
  ]

  // Timeline/history data
  const historyTimeline = [
    {
      year: "2003",
      title: "Company Founded",
      description: "ConstructPro was established with a small team of dedicated professionals.",
    },
    {
      year: "2008",
      title: "Expansion",
      description: "We expanded our services to include commercial construction projects.",
    },
    {
      year: "2013",
      title: "Technology Integration",
      description: "Implemented cutting-edge technology to improve project management and client communication.",
    },
    {
      year: "2018",
      title: "Sustainability Focus",
      description: "Launched our green building initiative to promote environmentally responsible construction.",
    },
    {
      year: "2023",
      title: "Digital Transformation",
      description: "Introduced our online platform connecting homeowners with trusted contractors.",
    },
  ]

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About ConstructPro</h1>
          <p>Building Excellence Since 2003</p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="about-mission">
        <div className="about-section-container">
          <h2>Our Mission</h2>
          <p>
            At ConstructPro, our mission is to transform spaces and improve lives through quality craftsmanship,
            innovative solutions, and exceptional service. We strive to be the most trusted name in construction
            services by consistently exceeding our clients' expectations and maintaining the highest standards of
            integrity in everything we do.
          </p>
        </div>
      </section>

      {/* Company Values */}
      <section className="about-values">
        <div className="about-section-container">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🏆</div>
              <h3>Quality Craftsmanship</h3>
              <p>We take pride in our work and are committed to delivering the highest quality in every project.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🛡️</div>
              <h3>Safety First</h3>
              <p>The safety of our team and clients is our top priority in every project we undertake.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">😊</div>
              <h3>Customer Satisfaction</h3>
              <p>We measure our success by the satisfaction and happiness of our clients.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌱</div>
              <h3>Environmental Responsibility</h3>
              <p>We are committed to sustainable practices that minimize our environmental impact.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Integrity</h3>
              <p>We conduct our business with honesty, transparency, and ethical standards.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">💡</div>
              <h3>Innovation</h3>
              <p>We continuously seek new methods and technologies to improve our services.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Company History */}
      <section className="about-history">
        <div className="about-section-container">
          <h2>Our Journey</h2>
          <div className="timeline">
            {historyTimeline.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-year">{item.year}</div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <div className="about-section-container">
          <h2>Meet Our Team</h2>
          <p className="team-intro">
            Our success is built on the expertise and dedication of our talented team members. Each brings unique skills
            and perspectives to deliver exceptional results for our clients.
          </p>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.id} className="team-member">
                <img src={member.image || "/placeholder.svg"} alt={member.name} className="team-member-image" />
                <h3>{member.name}</h3>
                <p className="team-member-position">{member.position}</p>
                <p className="team-member-bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="about-testimonials">
        <div className="about-section-container">
          <h2>What Our Clients Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial">
              <div className="testimonial-content">
                <p>
                  "ConstructPro transformed our outdated kitchen into a modern, functional space that exceeded our
                  expectations. Their attention to detail and professionalism made the renovation process smooth and
                  stress-free."
                </p>
              </div>
              <div className="testimonial-author">
                <p>
                  <strong>- Robert & Lisa Thompson</strong>
                </p>
                <p>Kitchen Renovation</p>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-content">
                <p>
                  "We hired ConstructPro for our office expansion project, and they delivered exceptional results on
                  time and within budget. Their team was responsive, professional, and a pleasure to work with."
                </p>
              </div>
              <div className="testimonial-author">
                <p>
                  <strong>- James Wilson</strong>
                </p>
                <p>Commercial Expansion</p>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-content">
                <p>
                  "The landscaping team at ConstructPro completely transformed our backyard into a beautiful outdoor
                  living space. Their creativity and expertise turned our vision into reality."
                </p>
              </div>
              <div className="testimonial-author">
                <p>
                  <strong>- Maria Garcia</strong>
                </p>
                <p>Landscape Design</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="about-cta">
        <div className="about-section-container">
          <h2>Ready to Start Your Project?</h2>
          <p>Contact us today to discuss how we can help bring your vision to life.</p>
          <div className="cta-buttons">
            <Link to="/contact" className="cta-button primary">
              Contact Us
            </Link>
            <Link to="/services" className="cta-button secondary">
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About

