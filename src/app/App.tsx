import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import Intro from "../pages/Intro";
import RuleOfThumb from "../pages/RuleOfThumb";
import Criteria from "../pages/Criteria";
import Calculator from "../pages/Calculator";
import BestPractices from "../pages/BestPractices";
import Quiz from "../pages/Quiz";
import NotFound from "../pages/NotFound";

// HashRouter by default: host-agnostic static deploy. Deep-link refresh on any
// route (e.g. #/calculator) always loads index.html, so it never 404s on a
// static host such as GitHub Pages.
export default function App() {
  return (
    <HashRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/rule-of-thumb" element={<RuleOfThumb />} />
          <Route path="/criteria" element={<Criteria />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/best-practices" element={<BestPractices />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
