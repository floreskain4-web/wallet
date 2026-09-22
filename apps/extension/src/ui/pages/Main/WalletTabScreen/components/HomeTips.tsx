import { Column, Text } from '@/ui/components';
import { useWalletConfig } from '@unisat/wallet-state';

export function HomeTips() {
  const walletConfig = useWalletConfig();
  if (walletConfig.chainTip || walletConfig.statusMessage) {
    return (
      <Column
        py={'lg'}
        px={'md'}
        gap={'lg'}
        style={{
          borderRadius: 12,
          border: '1px solid rgba(245, 84, 84, 0.35)',
          background: 'rgba(245, 84, 84, 0.08)'
        }}>
        {walletConfig.chainTip && <Text text={walletConfig.chainTip} color="text" textCenter />}
        {walletConfig.statusMessage && <Text text={walletConfig.statusMessage} color="danger" textCenter />}
      </Column>
    );
  }
  return undefined;
}
