import React, { useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import Navbarr from '../Navbarr/navbarr';
import Footer from '../Footer/Footer';
import donation1 from '../assets/donation1.png';
import donation2 from '../assets/donation2.png';
import donation3 from '../assets/donation3.png';
import { FaUser, FaChartLine, FaCalculator, FaBell, FaShieldAlt, FaRocket, FaLightbulb, FaHandshake, FaHeart } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', Arial, sans-serif;
    background: #F9FAFB;
    box-sizing: border-box;
    color: #2D3748;
  }
`;

const fade = keyframes`
  0% { opacity: 0; }
  8% { opacity: 1; }
  33% { opacity: 1; }
  41% { opacity: 0; }
  100% { opacity: 0; }
`;

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 100px;
`;

/* ===== HERO SECTION ===== */
const HeroSection = styled.section`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 120px 80px;
  min-height: 90vh;
  background: linear-gradient(135deg, #9bd0fd, #F0F4FF);
`;

const HeroText = styled.div`
  flex: 1 1 500px;
  h1 {
    font-size: 72px;
    color: #1E3A8A;
    margin-bottom: 20px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -2px;
  }
  p {
    font-size: 24px;
    color: #4A5568;
    margin-bottom: 40px;
    line-height: 1.6;
    max-width: 600px;
  }
`;

const HeroStats = styled.div`
  display: flex;
  gap: 40px;
  margin-top: 20px;
  span {
    font-size: 20px;
    color: #2563EB;
    font-weight: 600;
    padding: 10px 20px;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 12px;
  }
`;

const CallToAction = styled.a`
  display: inline-block;
  padding: 16px 40px;
  font-size: 20px;
  background: linear-gradient(135deg, #2563EB, #1E3A8A);
  color: #FFFFFF;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
  }
`;

const SliderContainer = styled.div`
  position: relative;
  flex: 1 1 600px;
  width: 100%;
  max-width: 700px;
  height: 450px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  border: 4px solid #2563EB;
`;

const SlideImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px;
  opacity: 0;
  animation: ${fade} 12s infinite;
  animation-fill-mode: forwards;
`;

const Slide1 = styled(SlideImage)` animation-delay: 0s; `;
const Slide2 = styled(SlideImage)` animation-delay: 4s; `;
const Slide3 = styled(SlideImage)` animation-delay: 8s; `;

/* ===== FEATURES SECTION ===== */
const SectionWrapper = styled.section`
  padding: 120px 80px;
  background: linear-gradient(135deg, #9bd0fd, #F0F4FF);
  text-align: ${props => props.align || 'center'};
`;

const SectionTitle = styled.h2`
  font-size: 48px;
  color: #1E3A8A;
  margin-bottom: 60px;
  font-weight: 800;
  letter-spacing: -1px;
`;

const FeaturesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: center;
`;

const FeatureCard = styled.div`
  background: #FFFFFF;
  border-radius: 16px;
  padding: 40px;
  flex: 1 1 280px;
  max-width: 320px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-top: 4px solid #2563EB;
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
`;

const FeatureIcon = styled.div`
  font-size: 48px;
  color: #2563EB;
  margin-bottom: 25px;
`;

const FeatureTitle = styled.h3`
  font-size: 26px;
  color: #1E3A8A;
  margin-bottom: 15px;
  font-weight: 700;
`;

const FeatureText = styled.p`
  font-size: 18px;
  color: #4A5568;
  line-height: 1.6;
`;

/* ===== CORE VALUES SECTION ===== */
const CoreValuesSection = styled(SectionWrapper)`
 background: linear-gradient(135deg, #9bd0fd, #F0F4FF);
`;

const CoreValuesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: center;
`;

const ValueCard = styled.div`
  background: #FFFFFF;
  border-radius: 16px;
  padding: 40px;
  flex: 1 1 280px;
  max-width: 320px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-align: center;
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
`;

const ValueIcon = styled.div`
  font-size: 48px;
  color: #2563EB;
  margin-bottom: 25px;
`;

const ValueTitle = styled.h3`
  font-size: 26px;
  color: #1E3A8A;
  margin-bottom: 15px;
  font-weight: 700;
`;

const ValueText = styled.p`
  font-size: 18px;
  color: #4A5568;
  line-height: 1.6;
`;

/* ===== FAQ SECTION ===== */
const FAQSection = styled(SectionWrapper)`
  background: linear-gradient(135deg, #9bd0fd, #F0F4FF);
`;

const FAQList = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: left;
`;

const FAQItem = styled.div`
  margin-bottom: 30px;
  h3 {
    font-size: 22px;
    color: #1E3A8A;
    margin-bottom: 10px;
    font-weight: 700;
  }
  p {
    font-size: 18px;
    color: #4A5568;
    line-height: 1.6;
  }
`;

const HomePage = () => {
  useEffect(() => {
    AOS.init({ duration: 1200 });
  }, []);

  return (
    <>
      <GlobalStyle />
      <Navbarr />
      <HomeContainer>
        {/* HERO SECTION */}
        <HeroSection>
          <HeroText data-aos="fade-right">
            <h1>Empower Your Finances with TuniFlow</h1>
            <p>
              Simplify your financial journey with our intuitive platform. Manage your assets, track expenses, and achieve your goals with confidence.
            </p>
            <CallToAction href="#features">Get Started</CallToAction>
            <HeroStats>
              <span>10K+ Users</span>
              <span>99.9% Uptime</span>
              <span>24/7 Support</span>
            </HeroStats>
          </HeroText>
          <SliderContainer data-aos="fade-left">
            <Slide1 src={donation1} alt="Donation 1" />
            <Slide2 src={donation2} alt="Donation 2" />
            <Slide3 src={donation3} alt="Donation 3" />
          </SliderContainer>
        </HeroSection>

        {/* ===== FEATURES SECTION ===== */}
        <SectionWrapper id="features">
          <SectionTitle>Key Features</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <FeatureIcon><FaChartLine /></FeatureIcon>
              <FeatureTitle>Real-Time Analytics</FeatureTitle>
              <FeatureText>Monitor your financial performance with up-to-date dashboards and insightful reports.</FeatureText>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon><FaCalculator /></FeatureIcon>
              <FeatureTitle>Automated Invoicing</FeatureTitle>
              <FeatureText>Generate, send, and track invoices automatically to save time and reduce errors.</FeatureText>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon><FaBell /></FeatureIcon>
              <FeatureTitle>Smart Notifications</FeatureTitle>
              <FeatureText>Stay informed with timely alerts for important deadlines, payments, and updates.</FeatureText>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon><FaShieldAlt /></FeatureIcon>
              <FeatureTitle>Secure Data</FeatureTitle>
              <FeatureText>Your data is protected with industry-leading security and privacy standards.</FeatureText>
            </FeatureCard>
          </FeaturesGrid>
        </SectionWrapper>
        {/* ===== CORE VALUES SECTION ===== */}
        <CoreValuesSection id="core-values">
          <SectionTitle>Our Core Values</SectionTitle>
          <CoreValuesGrid>
            <ValueCard>
              <FeatureIcon><FaLightbulb /></FeatureIcon>
              <FeatureTitle>Innovation</FeatureTitle>
              <FeatureText>We embrace creativity and strive to deliver cutting-edge solutions for our users.</FeatureText>
            </ValueCard>
            <ValueCard>
              <FeatureIcon><FaHandshake /></FeatureIcon>
              <FeatureTitle>Integrity</FeatureTitle>
              <FeatureText>Honesty and transparency guide every decision we make and every interaction we have.</FeatureText>
            </ValueCard>
            <ValueCard>
              <FeatureIcon><FaHeart /></FeatureIcon>
              <FeatureTitle>Customer-Centric</FeatureTitle>
              <FeatureText>Your satisfaction is our top priority. We listen, adapt, and grow with your needs.</FeatureText>
            </ValueCard>
          </CoreValuesGrid>
        </CoreValuesSection>
        {/* ===== FAQ SECTION ===== */}
        <SectionWrapper id="faq" align="left">
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <FeatureTitle>How secure is my data on TuniFlow?</FeatureTitle>
              <FeatureText>We use advanced encryption and strict access controls to ensure your data is always safe and private.</FeatureText>
            </div>
            <div style={{ marginBottom: '32px' }}>
              <FeatureTitle>Can I integrate TuniFlow with other tools?</FeatureTitle>
              <FeatureText>Yes, TuniFlow supports integrations with popular accounting and productivity platforms for seamless workflows.</FeatureText>
            </div>
            <div style={{ marginBottom: '32px' }}>
              <FeatureTitle>Is there customer support available?</FeatureTitle>
              <FeatureText>Our support team is available 24/7 via email and live chat to assist you with any questions or issues.</FeatureText>
            </div>
          </div>
        </SectionWrapper>
      </HomeContainer>
      <Footer />
    </>
  );
};

export default HomePage;