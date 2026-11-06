export type Interval = { semitones: number; short: string; label: string; tip: string; up: string; down: string };
// Song associations checked against the EarMaster Interval Song Chart.
// Only titles / identification hints are used; playback synthesizes two notes, not recordings.
export const INTERVALS: Interval[] = [
  { semitones: 1, short: '2m', label: 'Sekunda mała', tip: 'Najmniejszy krok w stroju równomiernym. Porównaj ze znanym przejściem mi–fa.', up: '„Szczęki” — motyw filmowy', down: '„Dla Elizy” — początkowe zejście' },
  { semitones: 2, short: '2w', label: 'Sekunda wielka', tip: 'Cały ton: dwa półtony. Zaśpiewaj do–re, a potem odwróć kierunek.', up: '„Panie Janie” / „Frère Jacques” — początek', down: '„Yesterday” — początek melodii' },
  { semitones: 3, short: '3m', label: 'Tercja mała', tip: 'Skojarz ją z pierwszą tercją trójdźwięku molowego. Porównaj z tercją wielką z tego samego dźwięku.', up: '„Greensleeves” — początek melodii', down: '„Hey Jude” — początek melodii' },
  { semitones: 4, short: '3w', label: 'Tercja wielka', tip: 'To odległość do–mi i pierwsza tercja trójdźwięku durowego. Pomiń re w śpiewanej skali.', up: '„When the Saints Go Marching In” — początek', down: '„Swing Low, Sweet Chariot” — początek' },
  { semitones: 5, short: '4cz', label: 'Kwarta czysta', tip: 'Pomyśl o sol–do. Najpierw znajdź dźwięk docelowy w głowie, potem zaśpiewaj sam skok.', up: '„Amazing Grace” — początek', down: '„Eine kleine Nachtmusik” — początkowy skok w dół' },
  { semitones: 6, short: 'TT', label: 'Tryton', tip: 'Sześć półtonów, dokładnie połowa oktawy. W zapisie może być kwartą zwiększoną albo kwintą zmniejszoną.', up: '„The Simpsons” — początek tematu', down: '„Black Sabbath” — charakterystyczny motyw' },
  { semitones: 7, short: '5cz', label: 'Kwinta czysta', tip: 'Zaśpiewaj do–sol. Pomocne jest wyobrażenie sobie skrajnych dźwięków trójdźwięku durowego.', up: '„Star Wars” — główny temat', down: '„The Flintstones” — początek tematu' },
  { semitones: 8, short: '6m', label: 'Seksta mała', tip: 'Osiem półtonów. Znajdź oktawę, a następnie obniż górny dźwięk o tercję wielką.', up: '„The Entertainer” — charakterystyczny skok tematu', down: '„Love Story” — początek tematu' },
  { semitones: 9, short: '6w', label: 'Seksta wielka', tip: 'To do–la. Możesz najpierw przejść przez do–mi–sol–la, a później pominąć środkowe dźwięki.', up: '„My Bonnie Lies over the Ocean” — początek', down: '„Nobody Knows the Trouble I’ve Seen” — początek' },
  { semitones: 10, short: '7m', label: 'Septyma mała', tip: 'O dwa półtony mniej niż oktawa. Najpierw zaśpiewaj oktawę i zejdź od górnego dźwięku o cały ton.', up: '„Somewhere” z West Side Story — początek', down: '„Watermelon Man” — charakterystyczny skok tematu' },
  { semitones: 11, short: '7w', label: 'Septyma wielka', tip: 'Półton poniżej oktawy. Porównuj ją bezpośrednio z oktawą: dźwięk docelowy jest tuż pod nią.', up: '„Over the Rainbow” — pierwszy i trzeci różny dźwięk', down: '„I Love You” Cole’a Portera — początek' },
  { semitones: 12, short: '8cz', label: 'Oktawa czysta', tip: 'Ta sama nazwa dźwięku, inny rejestr. W ćwiczeniu śpiewu wymaga włączonej dokładnej oktawy.', up: '„Over the Rainbow” — pierwszy skok melodii', down: '„The Lonely Goatherd” — początkowy skok w dół' },
];
export const DEFAULT_INTERVALS = [1, 2, 3, 4, 5, 7];
export const intervalFor = (semitones: number) => INTERVALS.find(interval => interval.semitones === semitones)!;
export const INTERVAL_SOURCE = 'https://www.earmaster.com/products/free-tools/interval-song-chart-generator.html';
export const VOICE_SOURCE = 'https://yalelibrary.atlassian.net/wiki/spaces/YMD/pages/202030334';
