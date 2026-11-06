import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import type { KeyId, MusicalNote } from '../music';
import { clefFor, type ClefId } from '../voices';
import { intervalFor } from '../intervals';
import { writtenAccidentals } from '../notation';

export function Score({ notes, keyId, current = -1, clefId = 'treble', interval = false, showIntervals = false, explicitAccidentals = false }: { notes: MusicalNote[]; keyId: KeyId; current?: number; clefId?: ClefId; interval?: boolean; showIntervals?: boolean; explicitAccidentals?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = container.current!;
    const draw = () => {
      element.replaceChildren();
      const width = Math.max(540, element.clientWidth);
      const renderer = new Renderer(element, Renderer.Backends.SVG);
      renderer.resize(width, 230);
      const context = renderer.getContext();
      const clef = clefFor(clefId);
      const stave = new Stave(18, 45, width - 36);
      stave.addClef(clef.vex, undefined, clef.annotation).addKeySignature(keyId);
      if (!interval) stave.addTimeSignature('4/4');
      stave.setContext(context).draw();
      const signs = writtenAccidentals(notes, keyId, explicitAccidentals);
      const tickables = notes.map((note, index) => {
        const [letter, octave] = note.key.split('/');
        const writtenKey = `${letter}/${Number(octave) + clef.shift / 12}`;
        const item = new StaveNote({ clef: clef.vex, keys: [writtenKey], duration: 'q' });
        if (signs[index]) item.addModifier(new Accidental(signs[index]!), 0);
        const color = index < current ? '#3b846b' : index === current ? '#b77939' : '#283b35';
        item.setStyle({ fillStyle: color, strokeStyle: color });
        return item;
      });
      const voice = new Voice({ num_beats: notes.length, beat_value: 4 }).addTickables(tickables);
      new Formatter().joinVoices([voice]).format([voice], width - stave.getNoteStartX() - 55);
      voice.draw(context, stave);
      if (showIntervals) {
        const svg = element.querySelector('svg')!;
        for (let i = 1; i < notes.length; i++) {
          const distance = Math.abs(notes[i].midi - notes[i - 1].midi);
          const description = intervalFor(distance);
          if (!description) continue;
          const x1 = tickables[i - 1].getAbsoluteX() + 6;
          const x2 = tickables[i].getAbsoluteX() + 6;
          const bracket = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          bracket.setAttribute('d', `M ${x1} 179 v 7 H ${x2} v -7`);
          bracket.setAttribute('fill', 'none'); bracket.setAttribute('stroke', '#b7c8a6');
          svg.append(bracket);
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', String((x1 + x2) / 2)); label.setAttribute('y', '207');
          label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', '#607e4c');
          label.setAttribute('font-family', 'Segoe UI, sans-serif'); label.setAttribute('font-size', '12');
          label.textContent = `${notes[i].midi > notes[i - 1].midi ? '↗' : '↘'} ${description.short}`;
          const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          title.textContent = `${description.label}, ${notes[i].midi > notes[i - 1].midi ? 'w górę' : 'w dół'}`;
          label.append(title); svg.append(label);
        }
      }
      element.querySelector('svg')?.setAttribute('aria-hidden', 'true');
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => observer.disconnect();
  }, [notes, keyId, current, clefId, interval, showIntervals, explicitAccidentals]);
  const distances = showIntervals ? notes.slice(1).map((note, i) => `${intervalFor(Math.abs(note.midi - notes[i].midi))?.label ?? 'Powtórzenie'}, ${note.midi > notes[i].midi ? 'w górę' : 'w dół'}`).join('; ') : '';
  return <div className="score-scroll"><div className="score" ref={container} role="img" aria-label={`${interval ? 'Interwał' : 'Melodia'}, klucz: ${clefFor(clefId).label}. Nuty brzmiące: ${notes.map(n => n.name).join(', ')}.${interval ? '' : ` Zaliczone: ${Math.max(0, current)} z 4.`}${distances ? ` Interwały: ${distances}.` : ''}`}/></div>;
}
