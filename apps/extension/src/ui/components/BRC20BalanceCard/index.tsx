import { BRC20BalanceCardProps, useBRC20BalanceCardLogic } from '@unisat/wallet-state';

import { BRC20Ticker } from '../BRC20Ticker';
import { Card } from '../Card';
import { Column } from '../Column';
import { Row } from '../Row';
import Tag from '../Tag';
import { Text } from '../Text';
import {
  getTokenBalanceCardStyle,
  TOKEN_BALANCE_CARD_PADDING_Y,
  TokenBalanceCardLayout
} from '../TokenBalanceCardLayout';
import { TokenBalanceIcon } from '../TokenBalanceIcon';

export default function BRC20BalanceCard(props: BRC20BalanceCardProps) {
  const {
    showPrice,
    price,
    ticker,
    iconInfo,
    displayName,
    tag,
    onClick,

    totalBalance,
    inWalletBalance,
    onSwapBalance,
    onProgBalance,

    displayTotalBalance,
    displayInWalletBalance,
    displayOnSwapBalance,
    displayOnProgBalance,

    selfMint,
    hasOutWalletBalance,
    t
  } = useBRC20BalanceCardLogic(props);

  const adaptiveHeight = Boolean(hasOutWalletBalance || tag || selfMint);

  return (
    <Card
      fullX
      onClick={() => {
        onClick && onClick();
      }}
      style={getTokenBalanceCardStyle(adaptiveHeight)}>
      <TokenBalanceCardLayout
        icon={<TokenBalanceIcon iconInfo={iconInfo} />}
        onIconClick={onClick}
        title={<BRC20Ticker tick={ticker} displayName={displayName} truncate />}
        titleExtra={
          tag || selfMint ? (
            <>
              {tag ? <Tag type={tag} /> : null}
              {selfMint ? <Tag type="self-issuance" small /> : null}
            </>
          ) : null
        }
        quantity={<Text text={displayTotalBalance} size="xs" digital />}
        showPrice={showPrice}
        price={price}
        balance={totalBalance}
      />

      {hasOutWalletBalance ? (
        <Column fullX style={{ gap: TOKEN_BALANCE_CARD_PADDING_Y }}>
          <Row style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Row fullY justifyBetween justifyCenter>
            <Column fullY justifyCenter>
              <Text text={t('brc20_in_wallet')} color="textDim" size="xs" />
            </Column>

            <Row itemsCenter fullY gap="zero">
              <Text text={displayInWalletBalance} size="xs" digital />
            </Row>
          </Row>

          {onSwapBalance && onSwapBalance !== '0' ? (
            <Row fullY justifyBetween justifyCenter>
              <Column fullY justifyCenter>
                <Text text={t('brc20_on_swap')} color="textDim" size="xs" />
              </Column>

              <Row itemsCenter fullY gap="zero">
                <Text text={displayOnSwapBalance} size="xs" digital />
              </Row>
            </Row>
          ) : null}

          {onProgBalance && onProgBalance !== '0' ? (
            <Row fullY justifyBetween justifyCenter>
              <Column fullY justifyCenter>
                <Text text={t('brc20_on_prog')} color="textDim" size="xs" />
              </Column>

              <Row itemsCenter fullY gap="zero">
                <Text text={displayOnProgBalance} size="xs" digital />
              </Row>
            </Row>
          ) : null}
        </Column>
      ) : null}
    </Card>
  );
}
