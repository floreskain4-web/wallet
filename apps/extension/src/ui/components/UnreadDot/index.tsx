import { CSSProperties } from 'react';

import { BaseView } from '../BaseView';

export const unreadDotStyle: CSSProperties = {
  width: 7,
  height: 7,
  backgroundColor: '#F55454',
  borderRadius: '50%',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'white'
};

export function UnreadDot({ top, right }: { top: number; right: number }) {
  return (
    <BaseView
      style={{
        position: 'absolute',
        top,
        right,
        ...unreadDotStyle
      }}
    />
  );
}
