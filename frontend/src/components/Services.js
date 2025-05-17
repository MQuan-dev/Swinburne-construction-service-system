import { Building2, Home, RouteIcon as Road, Ruler, PaintBucket, HardHat, Clock } from "lucide-react"
import "../css/service.css"

function Services() {
  const serviceCategories = [
    {
      id: 1,
      title: "Residential Construction",
      description: "We build custom homes tailored to your unique vision and lifestyle needs.",
      icon: <Home className="service-icon" />,
      services: [
        "Custom Home Building",
        "Home Renovations & Remodeling",
        "Kitchen & Bathroom Upgrades",
        "Basement Finishing",
        "Home Additions",
      ],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      title: "Commercial Building",
      description: "Professional construction services for businesses of all sizes.",
      icon: <Building2 className="service-icon" />,
      services: [
        "Office Buildings",
        "Retail Spaces",
        "Restaurants & Hospitality",
        "Industrial Facilities",
        "Warehouses & Storage",
      ],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 3,
      title: "Infrastructure Development",
      description: "Building the foundations that connect and support communities.",
      icon: <Road className="service-icon" />,
      services: [
        "Road Construction",
        "Bridge Building",
        "Public Facilities",
        "Water Management Systems",
        "Utility Infrastructure",
      ],
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const additionalServices = [
    {
      id: 5,
      title: "Architectural Design",
      description: "Professional design services to bring your vision to life.",
      icon: <Ruler className="service-icon-small" />,
    },
    {
      id: 6,
      title: "Interior Finishing",
      description: "Expert interior work to perfect your space.",
      icon: <PaintBucket className="service-icon-small" />,
    },
    {
      id: 7,
      title: "Project Management",
      description: "Comprehensive oversight from start to finish.",
      icon: <HardHat className="service-icon-small" />,
    },
    {
      id: 8,
      title: "Maintenance Services",
      description: "Ongoing support to keep your property in top condition.",
      icon: <Clock className="service-icon-small" />,
    },
  ]

  return (
    <div className="services-container">
      <div className="services-header">
        <h1 className="services-title">Our Construction Services</h1>
        <p className="services-subtitle">
          We provide comprehensive construction solutions tailored to your specific needs. From residential to
          commercial projects, our experienced team delivers quality results.
        </p>
      </div>

      <div className="services-grid">
        {serviceCategories.map((category) => (
          <div className="service-card" key={category.id}>
            <div className="service-card-header">
              <div className="service-icon-container">{category.icon}</div>
              <h2 className="service-card-title">{category.title}</h2>
            </div>
            <div className="service-card-image">
              <img src={category.image || "/placeholder.svg"} alt={category.title} className="service-img" />
            </div>
            <p className="service-card-description">{category.description}</p>
            <ul className="service-list">
              {category.services.map((service, index) => (
                <li className="service-list-item" key={index}>
                  <span className="service-list-bullet">•</span> {service}
                </li>
              ))}
            </ul>
            <button className="service-card-button">Learn More</button>
          </div>
        ))}
      </div>

      <div className="additional-services-section">
        <h2 className="additional-services-title">Additional Services</h2>
        <div className="additional-services-grid">
          {additionalServices.map((service) => (
            <div className="additional-service-card" key={service.id}>
              <div className="additional-service-icon">{service.icon}</div>
              <h3 className="additional-service-title">{service.title}</h3>
              <p className="additional-service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="services-cta">
        <div className="services-cta-content">
          <h2 className="services-cta-title">Ready to Start Your Project?</h2>
          <p className="services-cta-description">
            Contact us today for a free consultation and estimate. Our team is ready to bring your vision to life.
          </p>
          <button className="services-cta-button">Request a Quote</button>
        </div>
      </div>

      <div className="services-process">
        <h2 className="services-process-title">Our Construction Process</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <h3 className="process-step-title">Consultation</h3>
            <p className="process-step-description">
              We discuss your needs, budget, and timeline to understand your project fully.
            </p>
          </div>
          <div className="process-step">
            <div className="process-step-number">2</div>
            <h3 className="process-step-title">Design & Planning</h3>
            <p className="process-step-description">
              Our team creates detailed plans and designs tailored to your specifications.
            </p>
          </div>
          <div className="process-step">
            <div className="process-step-number">3</div>
            <h3 className="process-step-title">Construction</h3>
            <p className="process-step-description">
              We execute the project with precision, keeping you informed throughout the process.
            </p>
          </div>
          <div className="process-step">
            <div className="process-step-number">4</div>
            <h3 className="process-step-title">Completion & Handover</h3>
            <p className="process-step-description">
              Final inspections ensure everything meets our high standards before project delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Services

