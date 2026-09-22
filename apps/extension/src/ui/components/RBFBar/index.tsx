import { fontSizes } from '@/ui/theme/font';
import { useI18n } from '@unisat/wallet-state';

import { Checkbox } from '../Checkbox';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';
import { Tooltip } from '../Tooltip';

export function RBFBar({ value, onChange }: { value: boolean; onChange: (val: boolean) => void }) {
  const { t } = useI18n();

  return (
    <Row justifyBetween>
      <Tooltip
        title={t('rbf_tip')}
        overlayStyle={{
          fontSize: fontSizes.xs
        }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Row itemsCenter>
            <Text text={t('rbf')} />
            <Icon icon="circle-question" color="textDim" />
          </Row>
        </div>
      </Tooltip>
      <Checkbox
        onChange={() => {
          onChange(!value);
        }}
        checked={value}></Checkbox>
    </Row>
  );
}
