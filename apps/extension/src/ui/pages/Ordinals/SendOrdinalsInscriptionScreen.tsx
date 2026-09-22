import { Button, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import InscriptionPreview from '@/ui/components/InscriptionPreview';
import { OutputValueBar } from '@/ui/components/OutputValueBar';
import { RBFBar } from '@/ui/components/RBFBar';
import { useSendOrdinalsInscriptionScreenLogic } from '@unisat/wallet-state';

export default function SendOrdinalsInscriptionScreen() {
  const {
    t,
    toInfo,
    onAddressInputChange,
    setOutputValue,
    minOutputValue,
    defaultOutputValue,
    enableRBF,
    setEnableRBF,
    inscriptions,
    error,
    disabled,
    onClickBack,
    onClickNext
  } = useSendOrdinalsInscriptionScreenLogic();
  return (
    <Layout>
      <Header onBack={onClickBack} title={t('send_inscription2')} />
      <Content>
        <Column>
          <Text text={`${t('ordinals_inscriptions')} (${inscriptions.length})`} preset="regular" />
          <Row justifyBetween>
            <Row overflowX gap="md" pb="md">
              {inscriptions.map((v) => (
                <InscriptionPreview key={v.inscriptionId} data={v} preset="small" />
              ))}
            </Row>
          </Row>

          <Input
            preset="address"
            addressInputData={toInfo}
            autoFocus={true}
            onAddressInputChange={(val) => onAddressInputChange(val)}
            recipientLabel={<Text text={t('recipient')} preset="regular" />}
            data-testid="send-inscription-address-input"
          />

          {toInfo.address ? (
            <Column mt="lg">
              <Text text={t('output_value')} preset="regular" />

              <OutputValueBar
                defaultValue={Math.max(defaultOutputValue, 546)}
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
            data-testid="send-inscription-next-button"
          />
        </Column>
      </Content>
    </Layout>
  );
}
