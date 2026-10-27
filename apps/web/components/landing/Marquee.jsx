import { Fragment } from 'react';
import { marqueeContent } from '@/data/landing/marqueeContent';

export default function Marquee({ content = marqueeContent }) {
  const data = content || marqueeContent;
  const repeatedItems = [...(data.items || []), ...(data.items || [])];

  return (
    <div className="marquee-section">
      <div className="marquee-track" id="marqueeTrack">
        {repeatedItems.map((item, idx) => (
          <Fragment key={`${item}-${idx}`}>
            <span>{item}</span>
            <span className="dot">{data.dot}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
