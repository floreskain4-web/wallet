import { CSSProperties, ReactNode } from 'react';

import { Row } from '../Row';
import { Text } from '../Text';

export interface AssetTagProps {
  type: string;
  small?: boolean;
  fractal?: boolean;
}

const TAG_HEIGHT = 16;

const tagContainerStyle: CSSProperties = {
  height: TAG_HEIGHT,
  boxSizing: 'border-box',
  padding: '0 4px',
  borderRadius: 4,
  flexShrink: 0
};

const tagTextStyle: CSSProperties = {
  fontSize: 10,
  lineHeight: '12px'
};

const filledTagStyle: CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.12)'
};

const filledTagTextStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.55)',
  ...tagTextStyle
};

const selfIssuanceTagStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 123, 33, 0.15)'
};

const selfIssuanceTagTextStyle: CSSProperties = {
  color: 'rgba(255, 123, 33, 0.65)',
  ...tagTextStyle
};

function TagContainer({
  children,
  style
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Row style={{ ...tagContainerStyle, ...style }} itemsCenter justifyCenter>
      {children}
    </Row>
  );
}

function FilledTag({ text }: { text: string }) {
  return (
    <TagContainer style={filledTagStyle}>
      <Text text={text} size="xxs" style={filledTagTextStyle} />
    </TagContainer>
  );
}

export default function Tag(props: AssetTagProps) {
  const { type } = props;

  if (type === 'bool-bridge') {
    return <FilledTag text="Bool Bridge" />;
  }

  if (type === 'simple-bridge') {
    return <FilledTag text="Simple Bridge" />;
  }

  if (type === 'self-issuance') {
    return (
      <TagContainer style={selfIssuanceTagStyle}>
        <Text text="self-issuance" size="xxs" style={selfIssuanceTagTextStyle} />
      </TagContainer>
    );
  }

  return <FilledTag text={type} />;
}
