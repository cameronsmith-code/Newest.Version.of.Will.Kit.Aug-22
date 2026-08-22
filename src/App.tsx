import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QuestionnaireProvider } from './context/QuestionnaireContext';
import { DocumentLocationProvider } from './context/DocumentLocationContext';
import { PeopleRepositoryProvider } from './context/PeopleRepositoryContext';
import { EntityRegistryProvider } from './context/EntityRegistryContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Wizard from './pages/Wizard';
import Completion from './pages/Completion';
import HiddenRiskEngineQAView from './components/HiddenRiskEngineQAView';
import EmployerEquityIntelligenceQAView from './components/EmployerEquityIntelligenceQAView';

function App() {
  return (
    <BrowserRouter>
      <QuestionnaireProvider>
        <DocumentLocationProvider>
          <PeopleRepositoryProvider>
            <EntityRegistryProvider>
              <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/wizard" element={<Wizard />} />
                <Route path="/completion" element={<Completion />} />
                <Route path="/hidden-risk-engine" element={<HiddenRiskEngineQAView />} />
                <Route path="/employer-equity-intelligence" element={<EmployerEquityIntelligenceQAView />} />
              </Routes>
              </Layout>
            </EntityRegistryProvider>
          </PeopleRepositoryProvider>
        </DocumentLocationProvider>
      </QuestionnaireProvider>
    </BrowserRouter>
  );
}

export default App;
