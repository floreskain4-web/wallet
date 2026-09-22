import BigNumber from 'bignumber.js';

import { bnUtils } from '@unisat/base-utils';
import { useI18n } from '@unisat/wallet-state';

import { DecodedPsbt } from '@unisat/wallet-shared';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';
import { RiskDetailPopover, riskAssetCardStyle } from './RiskDetailPopover';

export const RunesBurningList = ({ decodedPsbt, onClose }: { decodedPsbt: DecodedPsbt; onClose: () => void }) => {
  const inputTokenMap: {
    [ticker: string]: {
      amount: string;
      symbol: string;
      divisibility: number;
      spacedRune: string;
    };
  } = {};

  const { t } = useI18n();

  decodedPsbt.inputInfos.forEach((inputInfo) => {
    (inputInfo.runes || []).forEach((balance) => {
      const runeid = balance.runeid || '';
      inputTokenMap[runeid] = inputTokenMap[runeid] || {
        amount: '0',
        symbol: balance.symbol,
        divisibility: balance.divisibility,
        spacedRune: balance.spacedRune
      };
      inputTokenMap[runeid].amount = BigNumber(inputTokenMap[runeid].amount).plus(balance.amount).toString();
    });
  });

  const outputTokenMap: {
    [ticker: string]: {
      amount: string;
      symbol: string;
      divisibility: number;
      spacedRune: string;
    };
  } = {};
  decodedPsbt.outputInfos.forEach((outputInfo) => {
    (outputInfo.runes || []).forEach((balance) => {
      const runeid = balance.runeid || '';
      outputTokenMap[runeid] = outputTokenMap[runeid] || {
        amount: '0',
        symbol: balance.symbol,
        divisibility: balance.divisibility,
        spacedRune: balance.spacedRune
      };
      outputTokenMap[runeid] = outputTokenMap[runeid] || 0;
      outputTokenMap[runeid].amount = BigNumber(outputTokenMap[runeid].amount).plus(balance.amount).toString();
    });
  });

  const burnList: {
    amount: string;
    symbol: string;
    divisibility: number;
    spacedRune: string;
  }[] = [];
  Object.keys(inputTokenMap).forEach((ticker) => {
    if (outputTokenMap[ticker]) {
      const inputAmount = BigNumber(inputTokenMap[ticker].amount);
      const outputAmount = BigNumber(outputTokenMap[ticker].amount);
      if (inputAmount.isGreaterThan(outputAmount)) {
        burnList.push({
          amount: inputAmount.minus(outputAmount).toString(),
          symbol: inputTokenMap[ticker].symbol,
          divisibility: inputTokenMap[ticker].divisibility,
          spacedRune: inputTokenMap[ticker].spacedRune
        });
      }
    } else {
      burnList.push({
        amount: inputTokenMap[ticker].amount,
        symbol: inputTokenMap[ticker].symbol,
        divisibility: inputTokenMap[ticker].divisibility,
        spacedRune: inputTokenMap[ticker].spacedRune
      });
    }
  });

  return (
    <RiskDetailPopover title={t('runes_burn_risk_list')} onClose={onClose}>
      {burnList.map((burn, index) => {
        return (
          <Row
            key={'runes_burn_' + index}
            justifyBetween
            fullX
            px="md"
            py="xl"
            style={riskAssetCardStyle}>
            <Row>
              <Icon icon="burn" color="red" />
              <Text text={burn.spacedRune} />
            </Row>

            <Text text={`${bnUtils.toDecimalAmount(burn.amount, burn.divisibility)} ${burn.symbol}`} />
          </Row>
        );
      })}
    </RiskDetailPopover>
  );
};
