import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import { 
  Brain, Clock, TrendingUp, Target, BookOpen, Sparkles,
  Award, Users, Star, ChevronRight, Play, Phone, Mail,
  Facebook, Instagram, Linkedin, ShoppingCart, Menu, X
} from 'lucide-react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userCountry, setUserCountry] = useState('IN') // Default to India
  const [modalData, setModalData] = useState({
    name: '',
    phone: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    level: 'Beginner',
    message: ''
  })

  // Detect user location on component mount
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        setUserCountry(data.country_code || 'IN')
      })
      .catch(() => {
        setUserCountry('IN') // Default to India if detection fails
      })
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleHeroButtonClick = (buttonText) => {
    if (buttonText === 'Book Demo') {
      setIsModalOpen(true)
    } else if (buttonText === 'Explore Courses') {
      scrollToSection('courses')
    } else if (buttonText === 'Start Learning') {
      scrollToSection('courses')
    } else {
      scrollToSection('about')
    }
  }

  const heroSlides = [
    {
      subtitle: "Your Child's Gateway to Brilliance",
      title: "We make Kids Smarter and Sharper through Chess",
      description: "Best Online Chess Training for Kids, Students of Beginner, Intermediate & Advanced Levels",
      image: "/src/assets/Carousel1.png",
      buttonText: "Learn More",
      quote: ""
    },
    {
      subtitle: "Expert Online Chess Coaching",
      title: "Transform Your Child's Mind with Strategic Thinking",
      description: "Join thousands of students worldwide learning chess from certified masters and grandmasters",
      image: "/src/assets/carousel2.png",
      buttonText: "Start Learning",
      quote: ""
    },
    {
      subtitle: "Build Champions of Tomorrow",
      title: "Unlock Your Child's Full Potential with Chess",
      description: "Develop critical thinking, problem-solving skills, and academic excellence through chess training",
      image: "/src/assets/carousel3.png",
      buttonText: "Book Demo",
      quote: ""
    },
    {
      subtitle: "Interactive Live Classes",
      title: "Learn from Anywhere, Anytime with Expert Guidance",
      description: "Flexible online chess courses designed for beginners to advanced players aged 5-15 years",
      image: "/src/assets/carousel4.png",
      buttonText: "Explore Courses",
      quote: ""
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleModalInputChange = (e) => {
    const { name, value } = e.target
    setModalData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    try {
      // Send to backend API
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modalData.name,
          phone: modalData.phone,
          type: 'demo_request',
          timestamp: new Date().toISOString()
        }),
      })

      if (response.ok) {
        alert('Thank you! We will contact you soon on WhatsApp.')
        setModalData({ name: '', phone: '' })
        setIsModalOpen(false)
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error submitting form. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Send to backend API
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          level: formData.level,
          message: formData.message,
          type: 'contact_form',
          timestamp: new Date().toISOString()
        }),
      })

      if (response.ok) {
        alert('Thank you for contacting us! We will get back to you soon.')
        setFormData({
          name: '',
          email: '',
          phone: '',
          level: 'Beginner',
          message: ''
        })
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error submitting form. Please try again.')
    }
  }

  const benefits = [
    { icon: <Target className="w-12 h-12" />, title: "Focus" },
    { icon: <Brain className="w-12 h-12" />, title: "Memory" },
    { icon: <Sparkles className="w-12 h-12" />, title: "Problem Solving" },
    { icon: <Clock className="w-12 h-12" />, title: "Time Management" },
    { icon: <TrendingUp className="w-12 h-12" />, title: "Academic growth" },
    { icon: <BookOpen className="w-12 h-12" />, title: "Creativity" },
  ]

  const courses = [
    {
      title: "Beginner",
      age: "5-15 years",
      description: "Join our 6-month journey into the realm of chess with our beginner's course, specially designed to ignite young minds, fostering a love for the game while transforming them into skilled individual.",
      duration: "6 Months",
      image: "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=500&h=300&fit=crop"
    },
    {
      title: "Intermediate",
      age: "5-15 years",
      description: "Elevate your chess knowledge to tournament-ready levels with our 8-month intermediate course, meticulously crafted to hone strategic thinking and tactical precision, propelling students to become proficient in life.",
      duration: "8 Months",
      image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&h=300&fit=crop"
    },
    {
      title: "Advanced",
      age: "5-15 years",
      description: "Embark on a lifelong chess mastery journey with our advanced course. We're here to guide and inspire you as you continue your passion for chess making you strong in chess and life.",
      duration: "12+ Months",
      image: "/src/assets/advanced chess.png"
    },
    {
      title: "Individual / 1-1 Classes",
      age: "Age 5+",
      description: "Experience personalized chess growth with our individual lessons. Dive into tailored sessions where one dedicated tutor empowers one student, ensuring focused attention and customized learning for optimal skill development.",
      duration: "Flexible",
      image: "/src/assets/one on one.png"
    }
  ]

  const pricingPlans = [
    {
      title: "Beginner",
      subtitle: "Per Month",
      priceINR: "1500",
      priceSGD: "100",
      priceAED: "399",
      features: [
        "Twice a week interactive sessions",
        "One tournament every month",
        "One masterclass per month",
        "Access to class resources",
        "Help with preparation before tournaments with master coach"
      ]
    },
    {
      title: "Intermediate",
      subtitle: "Per Month",
      priceINR: "1800",
      priceSGD: "125",
      priceAED: "499",
      features: [
        "Twice a week interactive sessions",
        "One tournament every month",
        "One masterclass per month",
        "Access to class resources",
        "Help with preparation before tournaments with master coach"
      ]
    },
    {
      title: "Advanced",
      subtitle: "Per Month",
      priceINR: "2200",
      priceSGD: "150",
      priceAED: "599",
      features: [
        "Twice a week interactive sessions",
        "One tournament every month",
        "One masterclass per month",
        "Access to class resources",
        "Help with preparation before tournaments with master coach"
      ]
    },
    {
      title: "One on One",
      subtitle: "Per Month",
      priceINR: "4500",
      priceSGD: "250",
      priceAED: "999",
      features: [
        "Twice a week personalized sessions",
        "One tournament every month",
        "One masterclass per month",
        "Access to class resources",
        "Help with preparation before tournaments with master coach"
      ]
    }
  ]

  // Get price based on user's country
  const getPrice = (plan) => {
    if (userCountry === 'SG') {
      return `S$${plan.priceSGD}`
    } else if (userCountry === 'AE') {
      return `AED ${plan.priceAED}`
    } else {
      return `₹${plan.priceINR}`
    }
  }

  // Get currency symbol
  const getCurrency = () => {
    if (userCountry === 'SG') {
      return 'SGD'
    } else if (userCountry === 'AE') {
      return 'AED'
    } else {
      return 'INR'
    }
  }

  const testimonials = [
    {
      name: "Arjun Patel",
      age: "9",
      location: "Mumbai, India",
      text: "My son has shown remarkable improvement in concentration and logical thinking since joining Chess Architects Academy. The teachers are very patient and the online classes are engaging.",
      image: "https://ui-avatars.com/api/?name=Arjun+Patel&size=200&background=667eea&color=fff"
    },
    {
      name: "Priya Sharma",
      age: "11",
      location: "Bangalore, India",
      text: "Chess Architects has been amazing! I learned so many new strategies and now I can beat my dad in chess. The coaches explain everything clearly and make learning fun.",
      image: "https://ui-avatars.com/api/?name=Priya+Sharma&size=200&background=ff6b35&color=fff"
    },
    {
      name: "Raj Kumar",
      age: "8",
      location: "Delhi, India",
      text: "The best decision we made was enrolling our child in these chess classes. His academic performance has also improved significantly. Thank you Chess Architects!",
      image: "https://ui-avatars.com/api/?name=Raj+Kumar&size=200&background=004e89&color=fff"
    },
    {
      name: "Wei Chen",
      age: "10",
      location: "Singapore",
      text: "Excellent coaching! My daughter has participated in 3 tournaments after just 6 months of training. The instructors are knowledgeable and supportive.",
      image: "https://ui-avatars.com/api/?name=Wei+Chen&size=200&background=764ba2&color=fff"
    },
    {
      name: "Kavya Reddy",
      age: "12",
      location: "Hyderabad, India",
      text: "I love the interactive sessions and the way teachers explain complex concepts. Chess has become my favorite hobby and I've made many friends in the online classes.",
      image: "https://ui-avatars.com/api/?name=Kavya+Reddy&size=200&background=ffd700&color=333"
    },
    {
      name: "Tan Wei Ming",
      age: "9",
      location: "Singapore",
      text: "Very professional and structured curriculum. My son looks forward to every class. His problem-solving skills have improved tremendously. Highly recommended!",
      image: "https://ui-avatars.com/api/?name=Tan+Wei+Ming&size=200&background=1fc75a&color=fff"
    }
  ]

  const starPerformers = [
    {
      name: "Yajas Sharma",
      achievement: "Fiji National Player",
      badge: "Winner",
      image: "https://images.unsplash.com/photo-1560174038-da43ac6ad10f?w=400&h=300&fit=crop"
    },
    {
      name: "Theertha Jothish",
      achievement: "Kerala State Under 7 Girls Chess Champion",
      badge: "Winner",
      image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop"
    },
    {
      name: "Advait Sankar",
      achievement: "Candidate Master and Florida State Chess Champion",
      badge: "Winner",
      image: "https://images.unsplash.com/photo-1571043733612-d5444ff0d7f9?w=400&h=300&fit=crop"
    }
  ]

  const topCoaches = [
    {
      name: "Atharva Madkar",
      rating: "2010",
      image: "/src/assets/Coach Atharva.jpeg"
    },
    {
      name: "Pruthviraj Patil",
      rating: "1732",
      image: "/src/assets/Coach Pruthviraj.jpeg"
    },
    {
      name: "Pranav Burli",
      rating: "1726",
      image: "/src/assets/Coach Pranav.jpeg"
    },
    {
      name: "Mithilesh Pandit",
      rating: "1703",
      image: "/src/assets/Coach Mithilesh.jpeg"
    }
  ]

  const stats = [
    { number: "300+", label: "Students Trained" },
    { number: "5+", label: "Countries" },
    { number: "35+", label: "Expert Coaches" }
  ]

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container nav-container">
          <div className="logo">
            <h2>Chess Architects Academy</h2>
          </div>
          
          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>

          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#courses">Courses</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="nav-actions">
            <Mail className="nav-icon" />
            <span className="phone-number">chessarchitectz@gmail.com</span>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Book Demo</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={true}
          loop={true}
          className="hero-swiper"
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="hero-slide" style={{ backgroundImage: `url(${slide.image})` }}>
                <div className="hero-overlay"></div>
                <div className="container hero-content">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="hero-text"
                  >
                    <div className="hero-quote">{slide.quote}</div>
                    <h6 className="hero-subtitle">{slide.subtitle}</h6>
                    <h1 className="hero-title">{slide.title}</h1>
                    <p className="hero-description">{slide.description}</p>
                    <button className="btn-hero" onClick={() => handleHeroButtonClick(slide.buttonText)}>
                      {slide.buttonText} <ChevronRight />
                    </button>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Benefits Section */}
      <section className="benefits" id="about">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <h2 className="section-title">Benefits of adopting chess as a hobby</h2>
          </motion.div>

          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="benefit-card"
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="benefit-icon">{benefit.icon}</div>
                <h4 className="benefit-title">{benefit.title}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="courses" id="courses">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h6 className="section-subtitle">Our Courses</h6>
            <h2 className="section-title">Explore our courses and experience the Magic</h2>
          </motion.div>

          <div className="courses-grid">
            {courses.map((course, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="course-card"
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="course-image">
                  <img src={course.image} alt={course.title} />
                </div>
                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-age">({course.age})</p>
                  <p className="course-description">{course.description}</p>
                  <div className="course-footer">
                    <span className="course-duration">{course.duration}</span>
                    <button className="btn-link" onClick={() => scrollToSection('pricing')}>Learn More <ChevronRight size={16} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing" id="pricing">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h6 className="section-subtitle">Our Pricings</h6>
            <h2 className="section-title">Explore Courses</h2>
          </motion.div>

          {/* Offer Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="offer-banner"
          >
            <div className="offer-content">
              <span className="offer-badge">LIMITED TIME OFFER</span>
              <h3 className="offer-title">Register within 48 hours after the demo class and receive</h3>
              <div className="offer-discount">15% OFF</div>
              <p className="offer-subtitle">on your first month subscription!</p>
            </div>
          </motion.div>

          <div className="pricing-grid">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="pricing-card"
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <h4 className="pricing-title">{plan.title}</h4>
                <p className="pricing-subtitle">{plan.subtitle}</p>
                <ul className="pricing-features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <h3 className="pricing-price">
                  {getPrice(plan)}
                </h3>
                <div className="pricing-actions">
                  <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>Book Demo</button>
                  <button className="btn-primary" onClick={() => scrollToSection('contact')}>Enroll</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="statistics">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">Statistics that prove our Strength</h2>
          </motion.div>

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="stat-card"
              >
                <h2 className="stat-number">{stat.number}</h2>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Coaches Section */}
      <section className="coaches" id="coaches">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h6 className="section-subtitle">Our Team</h6>
            <h2 className="section-title">Our Top Coaches</h2>
          </motion.div>

          <div className="coaches-grid">
            {topCoaches.map((coach, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="coach-card"
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="coach-image">
                  <img src={coach.image} alt={coach.name} />
                </div>
                <div className="coach-info">
                  <h3 className="coach-name">{coach.name}</h3>
                  <p className="coach-rating">FIDE Rating: {coach.rating}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* Contact Form Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h6 className="section-subtitle" style={{ color: 'var(--primary-color)' }}>Contact Us!</h6>
            <h2 className="section-title">Get in touch with us</h2>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group phone-group">
                <select className="country-code">
                  <option>IN (+91)</option>
                  <option>US (+1)</option>
                  <option>UK (+44)</option>
                  <option>UAE (+971)</option>
                </select>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Your Phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Individual">Individual / 1-1 Classes</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <textarea
                name="message"
                placeholder="Write a Message"
                rows="6"
                value={formData.message}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <div className="form-consent">
              <p>
                By Submitting this form, I consent to receive communications from the Academy through WhatsApp, SMS, email,
                phone, calls, and other channels, even if my number is registered on DND/NDNC
              </p>
            </div>

            <button type="submit" className="btn-submit">
              Send
            </button>
          </motion.form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <h3 className="footer-title">Chess Architects Academy</h3>
              <p className="footer-description">
                Welcome to Chess Architects Academy - the best online chess academy for kids. 
                Our platform offers unparalleled opportunities for children to learn chess online from experts in the field.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/profile.php?id=61564977200759" target="_blank" rel="noopener noreferrer" className="social-link"><Facebook /></a>
                <a href="https://www.instagram.com/chessarchitects/" target="_blank" rel="noopener noreferrer" className="social-link"><Instagram /></a>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#about">About</a></li>
                <li><a href="#courses">Courses</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li><a href="/src/assets/Terms Of Service – Chess Architects Academy.pdf" target="_blank">Terms of Service</a></li>
                <li><a href="/src/assets/Privacy Policy.pdf" target="_blank">Privacy Policy</a></li>
                <li><a href="/src/assets/Refund-cancellation-policy.pdf" target="_blank">Refund & Cancellation Policy</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <div className="footer-contact">
                <p><Mail size={16} /> chessarchitectz@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© Copyright 2026 by Chess Architects Academy</p>
          </div>
        </div>
      </footer>

      {/* Book Demo Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            
            <div className="modal-body">
              <div className="modal-left">
                <div className="modal-branding">
                  <h2 className="modal-logo">Chess Architects Academy</h2>
                  <p className="modal-tagline">Transform Your Child's Mind</p>
                  <p className="modal-subtitle">MAKE THE RIGHT MOVE</p>
                </div>
              </div>
              
              <div className="modal-right">
                <h3 className="modal-title">Enter Your WhatsApp Number</h3>
                <form onSubmit={handleModalSubmit} className="modal-form">
                  <div className="modal-form-group">
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter Your Name"
                      value={modalData.name}
                      onChange={handleModalInputChange}
                      required
                    />
                  </div>
                  
                  <div className="modal-form-group modal-phone-group">
                    <select className="modal-country-code">
                      <option>IN (+91)</option>
                      <option>US (+1)</option>
                      <option>UK (+44)</option>
                      <option>UAE (+971)</option>
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="WhatsApp Number"
                      value={modalData.phone}
                      onChange={handleModalInputChange}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="modal-btn-submit">
                    Continue
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Buttons */}
      <div className="floating-whatsapp-buttons">
        <a
          href="https://wa.me/919209655316?text=Hi,%20I%20have%20a%20new%20enquiry%20about%20chess%20classes"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-float-btn enquiry-btn"
        >
          <Phone size={18} />
          New Enquiry
        </a>
      </div>
    </div>
  )
}

export default App
