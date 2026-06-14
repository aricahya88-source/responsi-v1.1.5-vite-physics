export default function BottomBar({ items, activeId, onChange }) {
  return (
    <nav className="bottom-bar" aria-label="Navigasi praktikum">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-item ${activeId === item.id ? "active" : ""}`}
          onClick={() => onChange(item.id)}
          aria-current={activeId === item.id ? "page" : undefined}
        >
          <span className="bottom-icon" aria-hidden="true">{item.icon}</span>
          <span className="bottom-label">{item.shortTitle ?? item.title}</span>
        </button>
      ))}
    </nav>
  );
}
