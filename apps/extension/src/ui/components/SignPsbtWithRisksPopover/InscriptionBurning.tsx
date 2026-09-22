import { useI18n } from '@unisat/wallet-state';

import { DecodedPsbt } from '@unisat/wallet-shared';
import InscriptionPreview from '../InscriptionPreview';
import { Row } from '../Row';
import { RiskDetailPopover, riskAssetCardStyle } from './RiskDetailPopover';

export const InscriptionBurning = ({ decodedPsbt, onClose }: { decodedPsbt: DecodedPsbt; onClose: () => void }) => {
  const inputInscriptionMap = {};
  const { t } = useI18n();
  decodedPsbt.inputInfos.forEach((inputInfo) => {
    inputInfo.inscriptions.forEach((ins) => {
      inputInscriptionMap[ins.inscriptionId] = true;
    });
  });

  const outputInscriptionMap = {};
  decodedPsbt.outputInfos.forEach((outputInfo) => {
    outputInfo.inscriptions.forEach((ins) => {
      outputInscriptionMap[ins.inscriptionId] = true;
    });
  });

  const burnList: string[] = [];
  Object.keys(inputInscriptionMap).forEach((insId) => {
    if (!outputInscriptionMap[insId]) {
      burnList.push(insId);
    }
  });

  return (
    <RiskDetailPopover title={t('inscription_burn_risk_list')} onClose={onClose}>
      <Row
        justifyBetween
        fullX
        px="md"
        py="xl"
        style={riskAssetCardStyle}
        overflowX>
        {burnList.map((burn, index) => {
          return (
            <InscriptionPreview
              key={'inscription_burn_' + index}
              data={decodedPsbt.inscriptions[burn]}
              preset="small"
              infoBgColor="#292929"
            />
          );
        })}
      </Row>
    </RiskDetailPopover>
  );
};
