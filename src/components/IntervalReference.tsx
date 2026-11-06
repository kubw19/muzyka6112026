import { INTERVALS } from '../intervals';

const examples = ['C–C', 'C–Des', 'C–D', 'C–Es', 'C–E', 'C–F', 'C–Fis / C–Ges', 'C–G', 'C–As', 'C–A', 'C–B', 'C–H', 'C–C oktawę wyżej'];
const international = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4 / d5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
const tones = ['0', '½', '1', '1½', '2', '2½', '3', '3½', '4', '4½', '5', '5½', '6'];
const rows = [{ semitones: 0, short: '1cz', label: 'Pryma czysta' }, ...INTERVALS];

export function IntervalReference({ onListen }: { onListen: () => void }) {
  return <>
    <div className="page-heading"><div><div className="eyebrow">POD RĘKĄ · PODSTAWY INTERWAŁÓW</div><h1>Muzyczna ściągawka<span>.</span></h1><p>Odległości, oznaczenia i zasady, do których możesz wrócić w każdej chwili.</p></div></div>
    <section className="reference-card" aria-labelledby="reference-title"><div className="card-heading"><div><span className="eyebrow">OD PRYMY DO OKTAWY</span><h2 id="reference-title">Ile to półtonów?</h2></div><span className="pill">1 ton = 2 półtony</span></div>
      <p className="reference-intro">„Liczba tonów” oznacza tutaj rozmiar odległości: np. tercja mała ma 1½ tonu, czyli 3 półtony. Tabela dotyczy stroju równomiernie temperowanego.</p>
      <div className="reference-table-scroll"><table className="reference-table"><caption>Interwały proste: półtony, całe tony i przykłady od C w górę</caption><thead><tr><th scope="col">Interwał</th><th scope="col">Oznaczenia</th><th scope="col">Półtony</th><th scope="col">Tony</th><th scope="col">Przykład od C ↗</th></tr></thead><tbody>{rows.map(row => <tr key={row.semitones}><th scope="row">{row.label}</th><td><strong>{row.short}</strong><small>{international[row.semitones]}</small></td><td>{row.semitones}</td><td>{tones[row.semitones]}</td><td>{examples[row.semitones]}</td></tr>)}</tbody></table></div>
      <div className="reference-legend"><p><strong>Nasze oznaczenia:</strong> m — mała, w — wielka, cz — czysta, TT — tryton.</p><p><strong>Oznaczenia międzynarodowe:</strong> m — minor (mały), M — major (wielki), P — perfect (czysty), A — augmented (zwiększony), d — diminished (zmniejszony). Wielkość litery ma znaczenie: <strong>m6 = 6m</strong>, a <strong>M6 = 6w</strong>.</p><p><strong>Polskie nazwy:</strong> H to dźwięk naturalny, B to obniżone H. Dlatego C–B jest septymą małą, a C–H wielką.</p></div>
      <button className="button primary" onClick={onListen}>▷ Posłuchaj interwałów w bibliotece</button>
    </section>
    <section className="reference-card" style={{ marginTop: 24 }} aria-labelledby="major-scale-tip"><span className="eyebrow">SPOSÓB ZE SKALĄ DUROWĄ</span><h2 id="major-scale-tip">Mała czy wielka? Porównaj ze skalą.</h2>
      <p className="reference-intro">Weź <strong>niższy z dwóch dźwięków</strong> i zbuduj od niego skalę durową. Nie musi to być tonacja utworu. Od pierwszego stopnia tej skali sekundy, tercje, seksty i septymy są <strong>wielkie</strong>, a pryma, kwarta, kwinta i oktawa — <strong>czyste</strong>.</p>
      <div className="reference-note"><strong>Przykład: seksta od C.</strong> Skala C-dur: C–D–E–F–G–A–H–C. Szóstym stopniem jest A, więc <strong>C–A = seksta wielka (6w)</strong>. Gdy górny dźwięk obniżysz o półton, dostaniesz <strong>C–As = seksta mała (6m)</strong>.</div>
      <p className="reference-intro"><strong>Przykład z krzyżykami: seksta od D.</strong> Skala D-dur: D–E–Fis–G–A–H–Cis–D. Dlatego <strong>D–H = 6w</strong>, a <strong>D–B = 6m</strong> — B oznacza tu obniżone H. Zawsze uwzględnij znaki przy kluczu i znaki przygodne w badanych nutach.</p>
      <p className="reference-intro"><strong>Skrót do zapamiętania:</strong> dla interwałów 2, 3, 6 i 7: taki sam górny dźwięk jak w skali durowej → wielki; półton niżej, przy tej samej nazwie literowej → mały. Przy interwałach czystych obniżenie górnego dźwięku daje interwał zmniejszony. Jeśli dźwięki czytasz w dół, najpierw uporządkuj je od niższego do wyższego.</p>
    </section>
    <div className="reference-notes">
      <section className="reference-card"><span className="eyebrow">CZYTANIE Z PIĘCIOLINII</span><h2>Najpierw numer, potem rozmiar.</h2><ol><li><strong>Policz nazwy literowe wraz z oboma końcami.</strong> C–D to sekunda (C, D), C–E to tercja (C, D, E), a C–A to seksta.</li><li><strong>Policz półtony, uwzględniając znaki.</strong> C–E ma 4 półtony, więc jest tercją wielką. C–Es ma 3 — tercją małą.</li><li><strong>Sprawdź pisownię.</strong> C–Dis i C–Es brzmią tak samo w stroju równomiernym, ale C–Dis jest sekundą zwiększoną, a C–Es tercją małą.</li></ol><p className="reference-note">Na klawiaturze półton to przejście do sąsiedniego klawisza, białego lub czarnego. Między E–F i H–C jest półton, mimo że oba klawisze są białe.</p></section>
      <section className="reference-card"><span className="eyebrow">CO WARTO ZAPAMIĘTAĆ</span><h2>Trzy przydatne zasady.</h2><ul><li><strong>Czyste:</strong> pryma, kwarta, kwinta i oktawa. <strong>Małe lub wielkie:</strong> sekunda, tercja, seksta i septyma. Istnieją też interwały zwiększone i zmniejszone.</li><li><strong>Wielki jest o półton większy od małego</strong> o tym samym numerze: np. 6m = 8 półtonów, 6w = 9 półtonów.</li><li><strong>Odwrócenie dopełnia do oktawy:</strong> 2m + 7w = 12 półtonów, 3w + 6m = 12, 4cz + 5cz = 12. Numery odwróconych interwałów sumują się do 9.</li></ul><p className="reference-note">Kierunek nie zmienia rozmiaru: C–E w górę i E–C w dół to tercje wielkie. Na początek ćwicz je osobno — skojarzenie z piosenką zależy od kierunku.</p></section>
    </div>
  </>;
}
