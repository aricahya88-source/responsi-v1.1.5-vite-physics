export default function ControlsPanel({ controls, values, onChange }) {
  return (
    <section className="panel controls-panel" aria-labelledby="controls-title">
      <div className="panel-heading">
        <p className="eyebrow">Parameter Praktikum</p>
        <h2 id="controls-title">Kontrol Simulasi</h2>
      </div>

      <div className="control-list">
        {controls.map((control) => {
          const value = values[control.id];
          if (control.type === "select") {
            return (
              <label className="control-item" key={control.id}>
                <span className="control-topline">
                  <span>{control.label}</span>
                  <strong>{control.options.find((option) => option.value === value)?.label ?? value}</strong>
                </span>
                <select value={value} onChange={(event) => onChange(control.id, event.target.value)}>
                  {control.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label className="control-item" key={control.id}>
              <span className="control-topline">
                <span>{control.label}</span>
                <strong>{value} {control.unit}</strong>
              </span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={value}
                onChange={(event) => onChange(control.id, Number(event.target.value))}
              />
              <span className="control-scale">
                <small>{control.min} {control.unit}</small>
                <small>{control.max} {control.unit}</small>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
