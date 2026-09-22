import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Card, Checkbox, Column, Grid, Icon, Radio, RadioGroup, Row, Text } from '@/ui/components';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { ContextData, TabType, UpdateContextDataParams } from '@/ui/pages/Account/createHDWalletComponents/types';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { WordsType } from '@unisat/wallet-shared';
import { useI18n, useWallet } from '@unisat/wallet-state';

function wordsTypeToStrength(wordsType: WordsType): 128 | 256 {
  return wordsType === WordsType.WORDS_24 ? 256 : 128;
}

export function Step1_Create({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const [checked, setChecked] = useState(false);
  const [generating, setGenerating] = useState(false);
  const generationRequestRef = useRef(0);
  const generationQueueRef = useRef(Promise.resolve());
  const { t } = useI18n();
  const wallet = useWallet();

  const generate = useCallback(
    async (wordsType: WordsType) => {
      const requestId = ++generationRequestRef.current;
      setGenerating(true);
      setChecked(false);
      try {
        const strength = wordsTypeToStrength(wordsType);
        const generation = generationQueueRef.current.then(() => wallet.generatePreMnemonic(strength));
        // Keep the queue usable after a failed generation attempt.
        generationQueueRef.current = generation.then(
          () => undefined,
          () => undefined
        );
        const _mnemonics = await generation;
        if (requestId === generationRequestRef.current) {
          updateContextData({
            mnemonics: _mnemonics,
            wordsType,
            step1CreateWordsCompleted: false,
            mnemonicVerified: false
          });
        }
      } finally {
        if (requestId === generationRequestRef.current) {
          setGenerating(false);
        }
      }
    },
    [updateContextData, wallet]
  );

  useEffect(() => {
    if (!contextData.mnemonics) {
      void generate(contextData.wordsType ?? WordsType.WORDS_24);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial generate only
  }, []);

  const onSelectWordsType = async (wordsType: WordsType) => {
    if (wordsType === contextData.wordsType && contextData.mnemonics) {
      return;
    }
    await generate(wordsType);
  };

  const onChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setChecked(val);
    updateContextData({ step1CreateWordsCompleted: val });
  };

  const btnClick = () => {
    updateContextData({
      tabType: TabType.CONFIRM_WORDS
    });
  };

  const words = contextData.mnemonics ? contextData.mnemonics.split(' ') : [];
  const isTwelveWords = contextData.wordsType === WordsType.WORDS_12;

  return (
    <Column gap="xl">
      <Text text={t('secret_recovery_phrase')} preset="title-bold" textCenter data-testid="mnemonic-title" />

      <Row justifyCenter>
        <RadioGroup
          onChange={(value) => {
            void onSelectWordsType(value as WordsType);
          }}
          value={contextData.wordsType}>
          <Radio value={WordsType.WORDS_24} disabled={generating}>
            {t('mnemonics_24_words')}
          </Radio>
          <Radio value={WordsType.WORDS_12} disabled={generating}>
            {t('mnemonics_12_words')}
          </Radio>
        </RadioGroup>
      </Row>

      <Card
        preset="style2"
        style={{
          alignSelf: 'stretch',
          justifyContent: 'flex-start',
          border: `1px solid ${isTwelveWords ? colors.warning_content : colors.border}`
        }}
        data-testid="mnemonic-security-notice">
        <Icon
          icon={isTwelveWords ? 'warning2' : 'info'}
          size={18}
          color={isTwelveWords ? 'gold' : 'textDim'}
          containerStyle={{ flexShrink: 0, marginTop: 1 }}
        />
        <Column gap="xs">
          <Text text={t('security_notice')} preset="sub-bold" color={isTwelveWords ? 'gold' : 'textWhite'} />
          <Text text={t('this_phrase_is_the_only_way_to_recover_your_wallet')} preset="sub" color="textWhite" />
          {isTwelveWords ? (
            <Text
              text={t('mnemonics_12_words_not_recommended')}
              preset="sub"
              color="gold"
              data-testid="mnemonic-12-words-warning"
            />
          ) : null}
        </Column>
      </Card>

      <Row justifyCenter>
        <Grid columns={2}>
          {words.map((v, index) => {
            return (
              <Row key={index}>
                <Text text={`${index + 1}. `} style={{ width: 40 }} />
                <Card preset="style2" style={{ width: 200 }} data-index={index} data-testid={`mnemonic-word-${index}`}>
                  <Text text={v} selectText disableTranslate />
                </Card>
              </Row>
            );
          })}
        </Grid>
      </Row>

      <Row justifyCenter>
        <Checkbox
          onChange={onChange}
          checked={checked}
          style={{ fontSize: fontSizes.sm }}
          data-testid="mnemonic-saved-checkbox">
          <Text text={t('i_saved_my_secret_recovery_phrase')} />
        </Checkbox>
      </Row>

      <FooterButtonContainer>
        <Button
          disabled={!checked || generating || words.length === 0}
          text={t('continue')}
          preset="primary"
          onClick={btnClick}
          data-testid="mnemonic-continue-button"
        />
      </FooterButtonContainer>
    </Column>
  );
}
