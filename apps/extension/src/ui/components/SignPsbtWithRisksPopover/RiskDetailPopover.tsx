import React from 'react';

import { colors } from '@/ui/theme/colors';

import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';
import './RiskDetailPopover.less';

const riskDetailPopoverStyle: React.CSSProperties = {
  maxHeight: 'min(560px, calc(100vh - 40px))',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

export const riskAssetCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 10,
  borderWidth: 0
};

export function RiskDetailPopover({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Popover onClose={onClose} contentStyle={riskDetailPopoverStyle}>
      <Column fullX style={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
        <Text text={title} preset="bold" textCenter style={{ flexShrink: 0, marginBottom: 8, paddingRight: 16 }} />
        <Row fullX style={{ borderBottomWidth: 1, borderColor: colors.border, flexShrink: 0 }} mb="sm" />
        <Column
          fullX
          gap="sm"
          classname="risk-detail-scroll"
          style={{
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            WebkitOverflowScrolling: 'touch'
          }}>
          {children}
        </Column>
      </Column>
    </Popover>
  );
}
