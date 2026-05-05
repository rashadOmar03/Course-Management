export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="card center muted">
      {text}
    </div>
  );
}
