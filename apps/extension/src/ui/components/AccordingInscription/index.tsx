import { Inscription } from '@unisat/wallet-shared';
import { useI18n, useNavigation } from '@unisat/wallet-state';

import { Text } from '../Text';

export function AccordingInscription({ inscription }: { inscription: Inscription }) {
  const nav = useNavigation();
  const { t } = useI18n();
  return (
    <Text
      text={`${t('by_inscription')} #${inscription.inscriptionNumber} ${
        inscription.utxoConfirmation == 0 ? t('unconfirmed_inscription') : ''
      }`}
      preset="link"
      onClick={() => {
        nav.navToExplorerInscription(inscription.inscriptionId);
      }}
    />
  );
}
