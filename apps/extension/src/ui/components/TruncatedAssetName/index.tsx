import { CSSProperties, useLayoutEffect, useRef, useState } from 'react';

import { ColorTypes, colors } from '@/ui/theme/colors';

import { $sizeStyles, Sizes } from '../Text';
import { Tooltip } from '../Tooltip';

const truncatedNameStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
  display: 'block'
};

export function TruncatedAssetName({
  text,
  size = 'sm',
  color = 'ticker_color'
}: {
  text: string;
  size?: Sizes;
  color?: ColorTypes;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkTruncation = () => {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    };

    checkTruncation();

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [text, size]);

  return (
    <Tooltip title={isTruncated ? text : undefined} placement="top" block>
      <div ref={textRef} style={{ ...truncatedNameStyle, ...$sizeStyles[size], color: colors[color] }}>
        {text}
      </div>
    </Tooltip>
  );
}
