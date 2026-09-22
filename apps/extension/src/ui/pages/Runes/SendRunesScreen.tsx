import { Button, Column, Content, Header, Input, Layout, Row, Text, TransferAmountCard, TransferAmountSection } from '@/ui/components';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { OutputValueBar } from '@/ui/components/OutputValueBar';
import { RBFBar } from '@/ui/components/RBFBar';
import { TickUsdWithoutPrice, TokenType } from '@/ui/components/TickUsd';
import { showLongNumber } from '@/ui/utils';
import { useSendRunesScreenLogic } from '@unisat/wallet-state';

export default function SendRunesScreen() {
  const {
    runeInfo,
    inputAmount,
    totalBalanceStr,
    availableBalanceStr,

    setInputAmount,
    disabled,
    toInfo,
    setToInfo,
    error,
    defaultOutputValue,
    minOutputValue,
    setOutputValue,
    enableRBF,
    setEnableRBF,
    t,
    onClickBack,
    onClickNext
  } = useSendRunesScreenLogic();

  return (
    <Layout>
      <Header onBack={onClickBack} title={t('send_runes')} />
      <Content>
        <Column>
          <Row justifyCenter>
            <Text
              text={`${showLongNumber(totalBalanceStr)} ${runeInfo.symbol}`}
              preset="bold"
              textCenter
              size="xxl"
              wrap
            />
          </Row>
          <Row justifyCenter fullX style={{ marginTop: -12, marginBottom: -12 }}>
            <TickUsdWithoutPrice
              tick={runeInfo.spacedRune}
              balance={totalBalanceStr}
              type={TokenType.RUNES}
              size={'md'}
            />
          </Row>

          <Column mt="lg">
            <Input
              preset="address"
              addressInputData={toInfo}
              onAddressInputChange={(val) => {
                setToInfo(val);
              }}
              recipientLabel={<Text text={t('recipient')} preset="regular" />}
              autoFocus={true}
              data-testid="send-runes-address-input"
            />
          </Column>

          <Column mt="lg">
            <TransferAmountSection>
              <TransferAmountCard
                amount={inputAmount.toString()}
                onAmountChange={setInputAmount}
                showMax
                onMaxClick={() => {
                  setInputAmount(availableBalanceStr);
                }}
                availableAmount={showLongNumber(availableBalanceStr)}
                unit={runeInfo.symbol}
                runesDecimal={runeInfo.divisibility}
                inputTestId="send-runes-amount-input"
              />
            </TransferAmountSection>
          </Column>

          {toInfo.address ? (
            <Column mt="lg">
              <Text text={t('output_value')} preset="regular" />

              <OutputValueBar
                defaultValue={defaultOutputValue}
                minValue={minOutputValue}
                onChange={(val) => {
                  setOutputValue(val);
                }}
              />
            </Column>
          ) : null}

          <Column mt="lg">
            <FeeRateBar />
          </Column>
          <Column mt="lg">
            <RBFBar value={enableRBF} onChange={setEnableRBF} />
          </Column>

          {error && <Text text={error} color="error" />}

          <Button
            disabled={disabled}
            preset="primary"
            text={t('next')}
            onClick={onClickNext}
            data-testid="send-runes-next-button"></Button>
        </Column>
      </Content>
    </Layout>
  );
}
