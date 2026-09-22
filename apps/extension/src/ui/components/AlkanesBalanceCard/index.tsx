import { AlkanesBalanceCardProps, useAlkanesBalanceCardLogic } from '@unisat/wallet-state';
import { Card } from '../Card';
import { Row } from '../Row';
import { RunesTicker } from '../RunesTicker';
import { Text } from '../Text';
import { getTokenBalanceCardStyle, TokenBalanceCardLayout } from '../TokenBalanceCardLayout';
import { TokenBalanceIcon } from '../TokenBalanceIcon';

export default function AlkanesBalanceCard(props: AlkanesBalanceCardProps) {
  const { tokenBalance, onClick, showPrice, price, iconInfo, balance, balanceStr } = useAlkanesBalanceCardLogic(props);

  return (
    <Card
      fullX
      onClick={() => {
        onClick && onClick();
      }}
      style={getTokenBalanceCardStyle()}>
      <TokenBalanceCardLayout
        icon={<TokenBalanceIcon iconInfo={iconInfo} />}
        onIconClick={onClick}
        title={<RunesTicker tick={tokenBalance.name} truncate />}
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
