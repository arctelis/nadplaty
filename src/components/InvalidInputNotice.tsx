function InvalidInputNotice() {
  return (
    <aside className="card result-panel invalid-notice" role="status">
      <p className="eyebrow">Brak wyniku</p>
      <p className="invalid-title">Popraw zaznaczone pola</p>
      <p className="result-meta">Pod każdym błędnym polem jest podpowiedź, co wpisać.</p>
    </aside>
  )
}

export default InvalidInputNotice
