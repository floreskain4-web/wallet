import { RuneBalance, TickPriceItem } from '@unisat/wallet-shared';

import { useRunesBalanceCardLogic } from '@unisat/wallet-state';
import { Card } from '../Card';
import { Row } from '../Row';
import { RunesTicker } from '../RunesTicker';
import { Text } from '../Text';
import { getTokenBalanceCardStyle, TokenBalanceCardLayout } from '../TokenBalanceCardLayout';
import { TokenBalanceIcon } from '../TokenBalanceIcon';

export interface RunesBalanceCardProps {
  tokenBalance: RuneBalance;
  onClick?: () => void;
  showPrice?: boolean;
  price?: TickPriceItem;
  'data-testid'?: string;
}

export default function RunesBalanceCard(props: RunesBalanceCardProps) {
  const { tokenBalance, onClick, showPrice, price, iconInfo, balance, balanceStr } = useRunesBalanceCardLogic(props);
  return (
    <Card fullX onClick={onClick} data-testid={props['data-testid']} style={getTokenBalanceCardStyle()}>
      <TokenBalanceCardLayout
        icon={<TokenBalanceIcon iconInfo={iconInfo} />}
        onIconClick={onClick}
        title={<RunesTicker tick={tokenBalance.spacedRune} truncate />}
        quantity={
          <Row itemsCenter gap="zero">
            <Text text={balanceStr} size="xs" />
            <Text text={tokenBalance.symbol} size="xs" mx="sm" />
          </Row>
        }
        showPrice={showPrice}
        price={price}
        balance={balance.toString()}
      />
    </Card>
  );
}
