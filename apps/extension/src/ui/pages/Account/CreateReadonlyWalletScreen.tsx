import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { AddressTypeCard } from '@/ui/components/AddressTypeCard';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { TabBar } from '@/ui/components/TabBar';
import { satoshisToAmount } from '@/ui/utils';
import { ADDRESS_TYPES } from '@unisat/wallet-shared';
import { useI18n, useTools, useWallet } from '@unisat/wallet-state';
import { AddressType } from '@unisat/wallet-types';

import { useNavigate } from '../MainRoute';
import { TabType } from './createHDWalletComponents/types';

const isHexString = (value: string) => /^[0-9a-fA-F]+$/.test(value);

const isValidReadonlyPublicKeyInput = (value: string) => {
  const byteLength = value.length / 2;
  return value.length % 2 === 0 && isHexString(value) && byteLength >= 32 && byteLength <= 65;
};

function Step1({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const [pubkey, setPubkey] = useState('');
  const [disabled, setDisabled] = useState(true);
  const wallet = useWallet();
  const tools = useTools();
  const { t } = useI18n();

  useEffect(() => {
    setDisabled(!isValidReadonlyPublicKeyInput(pubkey));
  }, [pubkey]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setPubkey(val);
    updateContextData({ step1Completed: isValidReadonlyPublicKeyInput(val) });
  };

  const btnClick = async () => {
    if (!isValidReadonlyPublicKeyInput(pubkey)) {
      tools.toastError(t('invalid_public_key'));
      return;
    }

    try {
      const keyring = await wallet.createTmpKeyringWithPublicKey(pubkey, AddressType.P2TR);
      if (keyring.accounts.length == 0) {
        throw new Error(t('invalid_public_key'));
      }
    } catch (e) {
      tools.toastError(t('invalid_public_key'));
      return;
    }

    updateContextData({
      pubkey,
      tabType: TabType.CHOOSE_ADDRESS_TYPE
    });
  };

  return (
    <Column gap="lg">
      <Text text={t('public_key')} textCenter preset="bold" />

      <Input
        placeholder={t('public_key')}
        onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            btnClick();
          }
        }}
        onChange={onChange}
        autoFocus={true}
        data-testid="readonly-public-key-input"
      />
      <FooterButtonContainer>
        <Button
          disabled={disabled}
          text={t('continue')}
          preset="primary"
          onClick={btnClick}
          data-testid="readonly-public-key-continue-button"
        />
      </FooterButtonContainer>
    </Column>
  );
}

function Step2({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const wallet = useWallet();
  const tools = useTools();
  const { t } = useI18n();

  const hdPathOptions = useMemo(() => {
    return ADDRESS_TYPES.filter((v) => v.displayIndex >= 0 && !v.isUnisatLegacy)
      .sort((a, b) => a.displayIndex - b.displayIndex)
      .map((v) => {
        return {
          label: v.name,
          hdPath: v.hdPath,
          addressType: v.value,
          isUnisatLegacy: v.isUnisatLegacy
        };
      });
  }, []);

  const [previewAddresses, setPreviewAddresses] = useState<string[]>(hdPathOptions.map(() => ''));

  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: { total_btc: string; satoshis: number; total_inscription: number };
  }>({});

  const selfRef = useRef({
    maxSatoshis: 0,
    recommended: 0,
    addressBalances: {} as {
      [key: string]: { total_btc: string; satoshis: number; total_inscription: number };
    }
  });
  const self = selfRef.current;

  const run = async () => {
    try {
      const addresses: string[] = [];
      for (let i = 0; i < hdPathOptions.length; i++) {
        const options = hdPathOptions[i];
        const keyring = await wallet.createTmpKeyringWithPublicKey(contextData.pubkey, options.addressType);
        const address = keyring.accounts[0].address;
        addresses.push(address);
      }

      const balances = await wallet.getMultiAddressAssets(addresses.join(','));
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const balance = balances[i];
        const satoshis = balance.totalSatoshis;
        self.addressBalances[address] = {
          total_btc: satoshisToAmount(balance.totalSatoshis),
          satoshis,
          total_inscription: balance.inscriptionCount
        };
        if (satoshis > self.maxSatoshis) {
          self.maxSatoshis = satoshis;
          self.recommended = i;
        }
      }

      updateContextData({ addressType: hdPathOptions[self.recommended].addressType });
      setAddressAssets({ ...self.addressBalances });
      setPreviewAddresses(addresses);
    } catch (e) {
      tools.toastError((e as Error).message);
    }
  };

  useEffect(() => {
    run();
  }, [contextData.pubkey]);

  const pathIndex = useMemo(() => {
    return hdPathOptions.findIndex((v) => v.addressType === contextData.addressType);
  }, [hdPathOptions, contextData.addressType]);

  const navigate = useNavigate();

  const onNext = async () => {
    try {
      await wallet.createKeyringWithPublicKey(contextData.pubkey, contextData.addressType);
      navigate('MainScreen');
    } catch (e) {
      tools.toastError((e as Error).message);
    }
  };

  return (
    <Column gap="lg">
      <Text text={t('address_type')} preset="bold" />
      {hdPathOptions.map((item, index) => {
        const address = previewAddresses[index];
        const assets = addressAssets[address] || {
          total_btc: '--',
          satoshis: 0,
          total_inscription: 0
        };
        const hasVault = assets.satoshis > 0;
        if (item.isUnisatLegacy && !hasVault) {
          return null;
        }

        return (
          <AddressTypeCard
            key={index}
            label={item.label}
            address={address}
            assets={assets}
            checked={index == pathIndex}
            onClick={() => {
              updateContextData({ addressType: item.addressType });
            }}
            data-testid={`readonly-address-type-card-${index}`}
          />
        );
      })}

      <FooterButtonContainer>
        <Button
          text={t('continue')}
          preset="primary"
          onClick={onNext}
          data-testid="readonly-address-type-continue-button"
        />
      </FooterButtonContainer>
    </Column>
  );
}

interface ContextData {
  pubkey: string;
  addressType: AddressType;
  step1Completed: boolean;
  tabType: TabType;
}

interface UpdateContextDataParams {
  pubkey?: string;
  addressType?: AddressType;
  step1Completed?: boolean;
  tabType?: TabType;
}

export default function CreateReadonlyWalletScreen() {
  const [contextData, setContextData] = useState<ContextData>({
    pubkey: '',
    addressType: AddressType.P2WPKH,
    step1Completed: false,
    tabType: TabType.IMPORT_WORDS
  });
  const { t } = useI18n();

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      setContextData((prev) => Object.assign({}, prev, params));
    },
    [setContextData]
  );

  const items = [
    {
      key: TabType.IMPORT_WORDS,
      label: t('step_1'),
      children: <Step1 contextData={contextData} updateContextData={updateContextData} />
    },
    {
      key: TabType.CHOOSE_ADDRESS_TYPE,
      label: t('step_2'),
      children: <Step2 contextData={contextData} updateContextData={updateContextData} />
    }
  ];

  const renderChildren = items.find((v) => v.key == contextData.tabType)?.children;

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('create_readonly_wallet')}
      />
      <Content>
        <Row justifyCenter>
          <TabBar
            progressEnabled
            defaultActiveKey={TabType.IMPORT_WORDS}
            items={items}
            activeKey={contextData.tabType}
            onTabClick={(key) => {
              const toTabType = key as TabType;
              if (toTabType === TabType.CHOOSE_ADDRESS_TYPE) {
                if (!contextData.step1Completed) {
                  setTimeout(() => {
                    updateContextData({ tabType: contextData.tabType });
                  }, 200);
                  return;
                }
              }
              updateContextData({ tabType: toTabType });
            }}
          />
        </Row>

        {renderChildren}
      </Content>
    </Layout>
  );
}
