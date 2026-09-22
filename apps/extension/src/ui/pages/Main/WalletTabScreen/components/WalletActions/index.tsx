import { useEffect, useMemo, useState } from 'react';

import { Column, Row } from '@/ui/components';
import { Button, ButtonProps } from '@/ui/components/Button';
import { BuyBTCModal } from '@/ui/pages/BuyBTC/BuyBTCModal';
import { TypeChain } from '@unisat/wallet-shared';
import {
  useChainType,
  useCurrentAccountCapabilities,
  useCurrentAddress,
  useI18n,
  useNavigation,
  useResetFeeRateBar,
  useResetUiTxCreateScreen,
  useWalletConfig
} from '@unisat/wallet-state';
import { ChainType } from '@unisat/wallet-types';

interface WalletActionsProps {
  chain: TypeChain;
}

type WalletActionItem = {
  key: string;
  label: string;
  icon: NonNullable<ButtonProps['icon']>;
  onClick: NonNullable<ButtonProps['onClick']>;
  disabled?: boolean;
  priority: number;
  overflowPreset?: ButtonProps['preset'];
  dataTestId: string;
};

const MAX_PRIMARY_ACTIONS = 4;
const ACTION_BUTTON_HEIGHT = 60;
const ACTION_BUTTON_GAP = 12;
const ACTION_ICON_TEXT_GAP = 6;
const actionButtonStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: ACTION_BUTTON_HEIGHT,
  height: ACTION_BUTTON_HEIGHT,
  borderRadius: 12,
  gap: ACTION_ICON_TEXT_GAP - 4,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  boxSizing: 'border-box' as const,
  marginLeft: 0,
  marginRight: 0
};
const actionRowStyle = {
  width: '100%',
  gap: ACTION_BUTTON_GAP
};
const actionButtonTextStyle = {
  fontSize: 10,
  lineHeight: '14px'
};

export const WalletActions = ({ chain }: WalletActionsProps) => {
  const [showOverflowActions, setShowOverflowActions] = useState(false);
  const isFractal = chain.isFractal;
  const nav = useNavigation();
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();
  const resetFeeRateBar = useResetFeeRateBar();
  const chainType = useChainType();
  const [buyBtcModalVisible, setBuyBtcModalVisible] = useState(false);
  const walletConfig = useWalletConfig();
  const address = useCurrentAddress();
  const { t } = useI18n();
  const accountCapabilities = useCurrentAccountCapabilities();

  const handleUtxoClick = () => {
    nav.navToUtxoTools();
  };

  const onReceiveClick = () => {
    nav.navigate('ReceiveScreen');
  };

  const onSendClick = () => {
    resetUiTxCreateScreen();
    resetFeeRateBar();
    nav.navigate('TxCreateScreen');
  };

  const onHistoryClick = () => {
    nav.navToExplorerAddress(address);
  };

  const buyDisabled = chainType !== ChainType.BITCOIN_MAINNET && chainType !== ChainType.FRACTAL_BITCOIN_MAINNET;

  const actionItems = useMemo<WalletActionItem[]>(() => {
    const items: WalletActionItem[] = [
      {
        key: 'receive',
        label: t('receive'),
        icon: 'receive',
        onClick: onReceiveClick,
        priority: 1,
        dataTestId: 'receive-button'
      },
      {
        key: 'send',
        label: t('send'),
        icon: 'send',
        onClick: onSendClick,
        disabled: !accountCapabilities.canCreateSigningRequest,
        priority: 2,
        dataTestId: 'send-button'
      }
    ];

    items.push({
      key: 'history',
      label: t('history'),
      icon: 'history',
      onClick: () => onHistoryClick(),
      priority: 4,
      overflowPreset: 'homeGold',
      dataTestId: 'history-button'
    });

    items.push({
      key: 'buy',
      label: t('buy'),
      icon: isFractal ? 'fb' : 'bitcoin',
      onClick: () => setBuyBtcModalVisible(true),
      disabled: buyDisabled,
      priority: 5,
      overflowPreset: 'homeGold',
      dataTestId: 'buy-button'
    });

    if (!walletConfig.disableUtxoTools) {
      items.push({
        key: 'utxo',
        label: t('utxo').toUpperCase(),
        icon: 'utxo',
        onClick: handleUtxoClick,
        disabled: !accountCapabilities.canCreateSigningRequest,
        priority: 6,
        overflowPreset: 'homeGold',
        dataTestId: 'utxo-button'
      });
    }

    return items;
  }, [accountCapabilities.canCreateSigningRequest, buyDisabled, handleUtxoClick, isFractal, t, walletConfig.disableUtxoTools]);

  const { primaryActions, overflowActions } = useMemo(() => {
    const items = actionItems.sort((a, b) => a.priority - b.priority);
    let primaryActions: WalletActionItem[] = [];
    let overflowActions: WalletActionItem[] = [];
    if (items.length <= MAX_PRIMARY_ACTIONS) {
      primaryActions = items;
    } else {
      primaryActions = items.slice(0, MAX_PRIMARY_ACTIONS - 1);
      overflowActions = items.slice(MAX_PRIMARY_ACTIONS - 1);
    }

    return {
      primaryActions,
      overflowActions
    };
  }, [actionItems]);

  useEffect(() => {
    setShowOverflowActions(false);
  }, [chain.enum, overflowActions.length]);

  const renderActionButton = (action: WalletActionItem, location: 'primary' | 'overflow') => (
    <Button
      key={action.key}
      text={action.label}
      preset={location === 'overflow' ? action.overflowPreset || 'home' : 'home'}
      icon={action.icon}
      onClick={action.onClick}
      disabled={action.disabled}
      full
      style={actionButtonStyle}
      textStyle={actionButtonTextStyle}
      max2Lines
      data-testid={action.dataTestId}
    />
  );

  return (
    <>
      <Column fullX mt="md" style={{ gap: ACTION_BUTTON_GAP }}>
        <Row fullX style={actionRowStyle}>
          {primaryActions.map((action) => renderActionButton(action, 'primary'))}
          {overflowActions.length > 0 && (
            <Button
              text={t('more')}
              preset="home"
              icon="more"
              onClick={() => setShowOverflowActions((prev) => !prev)}
              full
              style={actionButtonStyle}
              textStyle={actionButtonTextStyle}
              max2Lines
              data-testid="more-button"
            />
          )}
        </Row>

        {showOverflowActions && overflowActions.length > 0 && (
          <Row fullX style={actionRowStyle}>
            {/* add empty action place to align the overflow button to the right*/}
            {MAX_PRIMARY_ACTIONS - overflowActions.length > 0 && (
              <Button preset="home" full style={{ ...actionButtonStyle, opacity: 0 }}></Button>
            )}
            {MAX_PRIMARY_ACTIONS - overflowActions.length > 1 && (
              <Button preset="home" full style={{ ...actionButtonStyle, opacity: 0 }}></Button>
            )}
            {MAX_PRIMARY_ACTIONS - overflowActions.length > 2 && (
              <Button preset="home" full style={{ ...actionButtonStyle, opacity: 0 }}></Button>
            )}

            {overflowActions.map((action) => renderActionButton(action, 'overflow'))}
          </Row>
        )}
      </Column>

      {buyBtcModalVisible && (
        <BuyBTCModal
          onClose={() => {
            setBuyBtcModalVisible(false);
          }}
        />
      )}
    </>
  );
};
