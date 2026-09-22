import { Text } from '../Text';
import { TruncatedAssetName } from '../TruncatedAssetName';

const $tickerPresets: { sm: { textSize: any }; md: { textSize: any }; lg: { textSize: any } } = {
  sm: {
    textSize: 'xs'
  },
  md: {
    textSize: 'sm'
  },
  lg: {
    textSize: 'md'
  }
};

type Presets = keyof typeof $tickerPresets;

export function RunesTicker({
  tick,
  preset,
  truncate
}: {
  tick: string | undefined;
  preset?: Presets;
  truncate?: boolean;
}) {
  const style = $tickerPresets[preset || 'md'];
  if (!tick) return null;

  if (truncate) {
    return <TruncatedAssetName text={tick} size={style.textSize} />;
  }

  return <Text text={tick} size={style.textSize} color="gold" wrap />;
}
