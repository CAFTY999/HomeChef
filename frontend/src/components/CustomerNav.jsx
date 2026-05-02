import "./customerNav.css";

export default function CustomerNav({ type, setType }) {
  return (
    <div style={{ display: "flex", gap: "10px", margin: "20px" }}>
      <button onClick={() => setType("daily")}>Daily</button>
      <button onClick={() => setType("subscription")}>Subscription</button>
      <button onClick={() => setType("ready")}>Ready</button>
    </div>
  );
}