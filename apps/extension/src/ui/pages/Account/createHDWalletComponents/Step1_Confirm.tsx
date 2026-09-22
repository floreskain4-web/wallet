import { useEffect, useMemo, useState } from 'react';

import { Button, Card, Column, Grid, Row, Text } from '@/ui/components';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { ContextData, TabType, UpdateContextDataParams } from '@/ui/pages/Account/createHDWalletComponents/types';
import { colors } from '@/ui/theme/colors';
import { useI18n } from '@unisat/wallet-state';

function shuffledIndexes(length: number): number[] {
  const indexes = Array.from({ length }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index--) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const swapIndex = random[0]! % (index + 1);
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex]!, indexes[index]!];
  }

  return indexes;
}

const SLOTS_PER_ROW = 3;
const INITIAL_VISIBLE_SLOT_COUNT = SLOTS_PER_ROW * 2;

export function Step1_Confirm({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const { t } = useI18n();
  const words = useMemo(() => contextData.mnemonics.split(' ').filter(Boolean), [contextData.mnemonics]);
  const choices = useMemo(() => shuffledIndexes(words.length), [words.length, contextData.mnemonics]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIndexes([]);
  }, [contextData.mnemonics]);

  const hasIncorrectSelection = selectedIndexes.some((wordIndex, slotIndex) => words[wordIndex] !== words[slotIndex]);
  const isVerified = selectedIndexes.length === words.length && !hasIncorrectSelection;
  const visibleSlotCount = Math.min(
    words.length,
    INITIAL_VISIBLE_SLOT_COUNT + Math.floor(selectedIndexes.length / SLOTS_PER_ROW) * SLOTS_PER_ROW
  );

  const onSelect = (wordIndex: number) => {
    setSelectedIndexes((current) => {
      if (current.includes(wordIndex)) {
        return current.filter((index) => index !== wordIndex);
      }
      if (current.some((selectedWordIndex, slotIndex) => words[selectedWordIndex] !== words[slotIndex])) {
        return current;
      }
      return [...current, wordIndex];
    });
  };

  return (
    <Column gap="lg">
      <Text text={t('verify_recovery_phrase')} preset="title-bold" textCenter />
      <Text
        text={t('click_on_the_words_to_put_them_in_the_correct_orde')}
        preset="sub"
        color="textDim"
        textCenter
        style={{ maxWidth: 420, alignSelf: 'center', lineHeight: '18px' }}
      />

      <Grid columns={3} gap="sm" style={{ width: '100%' }}>
        {words.slice(0, visibleSlotCount).map((_, index) => {
          const selectedWordIndex = selectedIndexes[index];
          const isIncorrect = selectedWordIndex !== undefined && words[selectedWordIndex] !== words[index];
          const isSelected = selectedWordIndex !== undefined;
          const isCurrentSlot = !hasIncorrectSelection && !isSelected && index === selectedIndexes.length;

          return (
            <Card
              key={index}
              preset="style3"
              onClick={isIncorrect && selectedWordIndex !== undefined ? () => onSelect(selectedWordIndex) : undefined}
              style={{
                minHeight: 40,
                justifyContent: 'flex-start',
                padding: '0 10px',
                gap: 6,
                borderWidth: 1,
                borderColor: isIncorrect
                  ? colors.error
                  : isCurrentSlot
                  ? colors.primary
                  : isSelected
                  ? 'rgba(255, 255, 255, 0.3)'
                  : colors.border2,
                boxShadow: isCurrentSlot ? '0 0 0 1px rgba(227, 187, 95, 0.3)' : undefined,
                backgroundColor: isIncorrect
                  ? 'rgba(229, 41, 55, 0.12)'
                  : isSelected
                  ? 'rgba(227, 187, 95, 0.08)'
                  : colors.card
              }}
              data-testid={`mnemonic-confirm-slot-${index}`}>
              <Text text={`${index + 1}.`} size="xs" style={{ width: 20 }} color={isIncorrect ? 'error' : 'textDim'} />
              <Text
                text={selectedWordIndex === undefined ? '' : words[selectedWordIndex]!}
                size="xs"
                ellipsis
                color={isIncorrect ? 'error' : isSelected ? 'primary' : undefined}
                disableTranslate
              />
            </Card>
          );
        })}
      </Grid>

      <Row justifyCenter fullX>
        <Grid columns={3} gap="sm" style={{ width: '100%' }}>
          {choices.map((wordIndex) => {
            const slotIndex = selectedIndexes.indexOf(wordIndex);
            const isIncorrect = slotIndex >= 0 && words[wordIndex] !== words[slotIndex];
            const isSelected = slotIndex >= 0;

            return (
              <Button
                key={wordIndex}
                preset="defaultV2"
                disabled={isSelected && !isIncorrect}
                onClick={isSelected && !isIncorrect ? undefined : () => onSelect(wordIndex)}
                style={{
                  minHeight: 40,
                  borderRadius: 6,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderColor: isIncorrect ? colors.error : isSelected ? 'rgba(227, 187, 95, 0.45)' : colors.border2,
                  backgroundColor: isIncorrect
                    ? 'rgba(229, 41, 55, 0.12)'
                    : isSelected
                    ? 'rgba(227, 187, 95, 0.08)'
                    : '#151313',
                  cursor: isSelected && !isIncorrect ? 'default' : 'pointer'
                }}
                data-testid={`mnemonic-confirm-word-${wordIndex}`}>
                <Text
                  text={words[wordIndex]!}
                  size="sm"
                  color={isIncorrect ? 'error' : isSelected ? 'primary' : undefined}
                  disableTranslate
                  ellipsis
                />
              </Button>
            );
          })}
        </Grid>
      </Row>

      <FooterButtonContainer>
        <Button
          disabled={!isVerified}
          text={t('continue')}
          preset="primary"
          onClick={() =>
            updateContextData({ mnemonics: '', mnemonicVerified: true, tabType: TabType.CHOOSE_ADDRESS_TYPE })
          }
          data-testid="mnemonic-confirm-continue-button"
        />
      </FooterButtonContainer>
    </Column>
  );
}
