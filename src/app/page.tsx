import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import About from '@/components/About';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased font-sans">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <About />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}