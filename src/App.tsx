import { HeroSection } from './components/HeroSection';
import { PainPoints } from './components/PainPoints';
import { AgenteEstelar } from './components/AgenteEstelar';
import { DigitalArchitecture } from './components/DigitalArchitecture';
import { SocialProof } from './components/SocialProof';
import { FinalCTA } from './components/FinalCTA';
import { Navigation } from './components/Navigation';
import { Route, Routes } from 'react-router-dom';
import { ContactChat } from './pages/ContactChat';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navigation />
      <HeroSection />
      <PainPoints />
      <AgenteEstelar />
      <DigitalArchitecture />
      <SocialProof />
      <FinalCTA />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/contactar/chatear" element={<ContactChat />} />
    </Routes>
  );
}

export default App;
