import { HeroSection } from './components/HeroSection';
import { PainPoints } from './components/PainPoints';
import { AgenteEstelar } from './components/AgenteEstelar';
import { DigitalArchitecture } from './components/DigitalArchitecture';
import { SocialProof } from './components/SocialProof';
import { FinalCTA } from './components/FinalCTA';
import { Navigation } from './components/Navigation';

function App() {
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

export default App;
