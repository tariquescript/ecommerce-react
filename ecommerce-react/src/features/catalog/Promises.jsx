import { ModelSlot } from '../../components/three/ModelSlot.jsx';
import { useReveal } from '../../lib/hooks/index.js';

const PROMISES = [
  {
    model: 'parcel',
    figure: '02',
    unit: 'days',
    title: 'Priority delivery',
    body: 'Free on orders over $40, and tracked from our door to yours.',
  },
  {
    model: 'returns',
    figure: '60',
    unit: 'days',
    title: 'Free returns',
    body: 'Changed your mind? Send it back — we cover the postage.',
  },
  {
    model: 'shield',
    figure: '02',
    unit: 'years',
    title: 'Cover on everything',
    body: 'Appliances and kit repaired or replaced. No forms in triplicate.',
  },
];

function Ticket({ promise, index }) {
  const ref = useReveal();

  return (
    <article
      ref={ref}
      className="ticket reveal"
      data-model-host
      style={{ '--reveal-delay': `${index * 110}ms` }}
    >
      <div className="ticket__stub">
        <ModelSlot model={promise.model} className="ticket__model" />
        <span className="ticket__no tnum">Nº 0{index + 1}</span>
      </div>
      <div className="ticket__main">
        <p className="ticket__figure">
          <span className="tnum">{promise.figure}</span>
          <small>{promise.unit}</small>
        </p>
        <h3 className="ticket__title">{promise.title}</h3>
        <p className="ticket__body">{promise.body}</p>
      </div>
    </article>
  );
}

/** Shipping, returns and cover — printed as admission tickets, the fine print made big. */
export function Promises() {
  return (
    <section className="promises page" id="promises" aria-labelledby="promises-title">
      <header className="section-head">
        <p className="eyebrow">The fine print</p>
        <h2 id="promises-title" className="section-title">
          No small print.
        </h2>
        <p className="section-sub">Three promises on every order, printed big enough to read.</p>
      </header>

      <div className="tickets">
        {PROMISES.map((promise, index) => (
          <Ticket key={promise.title} promise={promise} index={index} />
        ))}
      </div>
    </section>
  );
}
