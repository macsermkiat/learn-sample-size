import Lesson from "../components/Lesson";

export default function Intro() {
  return (
    <Lesson path="/">
      <header className="hero">
        <p className="eyebrow">Riley et al. 2020 · BMJ 368:m441</p>
        <h1 className="hero__title">
          Is <strong>10 events per variable</strong> enough? <em>Usually not.</em>
        </h1>
        <p className="lede">Scaffold in place. Content lands in Phase 4.</p>
      </header>
    </Lesson>
  );
}
