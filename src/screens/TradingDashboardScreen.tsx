import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

type AssetKind = 'Crypto' | 'Stock';
type Action = 'Buy' | 'Sell' | 'Wait';
type IndicatorKey = 'ema' | 'macd' | 'rsi' | 'bollinger' | 'structure' | 'atr';
type BacktestPeriod = '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX';
type CandleSize = '1D' | '2D' | '1W' | '2W' | '1M';
type ChartCount = 1 | 2 | 4 | 6;

type Asset = {
  symbol: string;
  name: string;
  kind: AssetKind;
  yahooSymbol: string;
  binanceSymbol?: string;
  coingeckoId?: string;
  stooqSymbol?: string;
  seed: number;
  basePrice: number;
  bias: number;
  volatility: number;
};

type Candle = {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type IndicatorVerdict = {
  key: IndicatorKey;
  name: string;
  value: string;
  verdict: string;
  score: number;
  color: string;
};

type SignalModel = {
  action: Action;
  confidence: number;
  successRate: number;
  backtestTrades: number;
  enabledCount: number;
  entry: number;
  target: number;
  stop: number;
  riskReward: number;
  riskPercent: number;
  positionRisk: string;
  summary: string;
  indicators: IndicatorVerdict[];
  levels: {
    support: number;
    resistance: number;
    atr: number;
    ema21: number;
    ema55: number;
    rsi: number;
    macd: number;
    macdSignal: number;
    upperBand: number;
    lowerBand: number;
    supertrend: number;
  };
};

type ChartConfig = {
  id: number;
  symbol: string;
  indicators: IndicatorKey[];
};

type MarketStatus = 'loading' | 'live' | 'fallback';

type MarketDataRecord = {
  candles: Candle[];
  status: MarketStatus;
  period: BacktestPeriod;
  source?: string;
  error?: string;
};

const ASSETS: Asset[] = [
  { symbol: 'BTCUSD', yahooSymbol: 'BTC-USD', binanceSymbol: 'BTCUSDT', coingeckoId: 'bitcoin', name: 'Bitcoin', kind: 'Crypto', seed: 11, basePrice: 68200, bias: 0.34, volatility: 0.058 },
  { symbol: 'ETHUSD', yahooSymbol: 'ETH-USD', binanceSymbol: 'ETHUSDT', coingeckoId: 'ethereum', name: 'Ethereum', kind: 'Crypto', seed: 19, basePrice: 3560, bias: 0.26, volatility: 0.064 },
  { symbol: 'SOLUSD', yahooSymbol: 'SOL-USD', binanceSymbol: 'SOLUSDT', coingeckoId: 'solana', name: 'Solana', kind: 'Crypto', seed: 31, basePrice: 156, bias: 0.08, volatility: 0.082 },
  { symbol: 'AAPL', yahooSymbol: 'AAPL', stooqSymbol: 'aapl.us', name: 'Apple', kind: 'Stock', seed: 41, basePrice: 224, bias: 0.16, volatility: 0.024 },
  { symbol: 'NVDA', yahooSymbol: 'NVDA', stooqSymbol: 'nvda.us', name: 'NVIDIA', kind: 'Stock', seed: 53, basePrice: 164, bias: 0.31, volatility: 0.042 },
  { symbol: 'TSLA', yahooSymbol: 'TSLA', stooqSymbol: 'tsla.us', name: 'Tesla', kind: 'Stock', seed: 67, basePrice: 266, bias: -0.03, volatility: 0.052 },
];

const ACTION_COLOR: Record<Action, string> = {
  Buy: '#28C083',
  Sell: '#F05252',
  Wait: '#E5B454',
};

const INDICATORS: Array<{ key: IndicatorKey; label: string; short: string }> = [
  { key: 'ema', label: 'EMA Trend', short: 'EMA' },
  { key: 'macd', label: 'MACD Momentum', short: 'MACD' },
  { key: 'rsi', label: 'RSI Regime', short: 'RSI' },
  { key: 'bollinger', label: 'Bollinger Bands', short: 'BB' },
  { key: 'structure', label: 'Support/Resistance', short: 'S/R' },
  { key: 'atr', label: 'ATR Risk', short: 'ATR' },
];

const PERIODS: Array<{ key: BacktestPeriod; label: string; candles: number }> = [
  { key: '3M', label: '3 month', candles: 66 },
  { key: '6M', label: '6 month', candles: 132 },
  { key: '1Y', label: '1 year', candles: 252 },
  { key: '3Y', label: '3 years', candles: 756 },
  { key: '5Y', label: '5 years', candles: 1260 },
  { key: 'MAX', label: 'Max', candles: 1800 },
];

const CANDLE_SIZES: Array<{ key: CandleSize; label: string; days: number }> = [
  { key: '1D', label: 'Day', days: 1 },
  { key: '2D', label: '2 day', days: 2 },
  { key: '1W', label: 'Week', days: 5 },
  { key: '2W', label: '2 week', days: 10 },
  { key: '1M', label: 'Month', days: 21 },
];

const CHART_COUNTS: ChartCount[] = [1, 2, 4, 6];
const DEFAULT_INDICATORS: IndicatorKey[] = ['ema', 'macd', 'rsi', 'bollinger', 'structure', 'atr'];
const DEFAULT_CHARTS: ChartConfig[] = [
  { id: 1, symbol: 'BTCUSD', indicators: ['ema', 'macd', 'rsi', 'atr'] },
  { id: 2, symbol: 'ETHUSD', indicators: ['ema', 'bollinger', 'structure', 'atr'] },
  { id: 3, symbol: 'AAPL', indicators: ['ema', 'macd', 'structure'] },
  { id: 4, symbol: 'NVDA', indicators: ['ema', 'rsi', 'bollinger', 'atr'] },
  { id: 5, symbol: 'SOLUSD', indicators: ['macd', 'rsi', 'structure', 'atr'] },
  { id: 6, symbol: 'TSLA', indicators: ['ema', 'macd', 'bollinger', 'structure'] },
];

export function TradingDashboardScreen() {
  const { s } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [activeChartId, setActiveChartId] = useState(1);
  const [chartCount, setChartCount] = useState<ChartCount>(2);
  const [period, setPeriod] = useState<BacktestPeriod>('1Y');
  const [candleSize, setCandleSize] = useState<CandleSize>('1D');
  const [charts, setCharts] = useState<ChartConfig[]>(DEFAULT_CHARTS);
  const [marketData, setMarketData] = useState<Record<string, MarketDataRecord>>({});
  const visibleCharts = useMemo(() => charts.slice(0, chartCount), [chartCount, charts]);
  const activeChart = charts.find((chart) => chart.id === activeChartId) ?? charts[0];
  const activeAsset = ASSETS.find((asset) => asset.symbol === activeChart.symbol) ?? ASSETS[0];
  const activeMarketData =
    marketData[activeAsset.symbol]?.period === period
      ? marketData[activeAsset.symbol]
      : fallbackMarketData(activeAsset, period, 'loading');
  const activeCandles = useMemo(
    () => buildCandlesFromDaily(activeAsset, activeMarketData.candles, period, candleSize),
    [activeAsset, activeMarketData.candles, candleSize, period],
  );
  const activeModel = useMemo(
    () => analyzeSignal(activeCandles, activeChart.indicators, period, candleSize),
    [activeCandles, activeChart.indicators, candleSize, period],
  );
  const requestedSymbols = useMemo(
    () => Array.from(new Set([...visibleCharts.map((chart) => chart.symbol), activeAsset.symbol])),
    [activeAsset.symbol, visibleCharts],
  );

  useEffect(() => {
    let cancelled = false;
    requestedSymbols.forEach((symbol) => {
      const asset = ASSETS.find((item) => item.symbol === symbol);
      if (!asset) return;
      setMarketData((current) => {
        const existing = current[symbol];
        if (existing?.period === period && (existing.status === 'live' || existing.status === 'loading')) return current;
        return { ...current, [symbol]: fallbackMarketData(asset, period, 'loading') };
      });
      fetchMarketCandles(asset, period)
        .then((result) => {
          if (cancelled) return;
          setMarketData((current) => ({
            ...current,
            [symbol]: { candles: result.candles, status: 'live', period, source: result.source },
          }));
        })
        .catch((error: Error) => {
          if (cancelled) return;
          setMarketData((current) => ({
            ...current,
            [symbol]: fallbackMarketData(asset, period, 'fallback', error.message),
          }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [period, requestedSymbols]);

  const updateChart = (id: number, patch: Partial<ChartConfig>) => {
    setCharts((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const toggleIndicator = (chartId: number, key: IndicatorKey) => {
    setCharts((items) =>
      items.map((item) => {
        if (item.id !== chartId) return item;
        const next = item.indicators.includes(key)
          ? item.indicators.filter((indicator) => indicator !== key)
          : [...item.indicators, key];
        return { ...item, indicators: next.length ? next : [key] };
      }),
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#05070B' }}>
      <LinearGradient
        colors={['rgba(31,71,96,0.38)', 'rgba(5,7,11,0)', 'rgba(5,7,11,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(230) }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: s(14), paddingBottom: s(28), gap: s(12) }}
      >
        <Header compact={compact} />

        <DashboardControls
          chartCount={chartCount}
          period={period}
          candleSize={candleSize}
          onChartCountChange={setChartCount}
          onPeriodChange={setPeriod}
          onCandleSizeChange={setCandleSize}
          compact={compact}
        />

        <ChartGrid
          charts={visibleCharts}
          activeChartId={activeChartId}
          period={period}
          candleSize={candleSize}
          marketData={marketData}
          compact={compact}
          width={width}
          onActivate={setActiveChartId}
          onAssetChange={(id, symbol) => updateChart(id, { symbol })}
          onToggleIndicator={toggleIndicator}
        />

        <View style={{ flexDirection: compact ? 'column' : 'row', gap: s(12) }}>
          <View style={{ flex: 1.25, gap: s(12) }}>
            <IndicatorMatrix indicators={activeModel.indicators} enabledIndicators={activeChart.indicators} />
            <StrategyBacktestSummary
              model={activeModel}
              period={period}
              candleSize={candleSize}
              marketStatus={activeMarketData.status}
              marketSource={activeMarketData.source}
            />
          </View>
          <View style={{ flex: 1, gap: s(12) }}>
            <SignalPanel
              asset={activeAsset}
              model={activeModel}
              marketStatus={activeMarketData.status}
              marketSource={activeMarketData.source}
            />
            <RiskPanel model={activeModel} />
          </View>
        </View>

        <View style={{ flexDirection: compact ? 'column' : 'row', gap: s(12) }}>
          <ResearchStack />
          <StopLossPlaybook model={activeModel} />
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ compact }: { compact: boolean }) {
  const { s } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(12) }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F5F7FA', fontSize: s(compact ? 24 : 30), fontWeight: '900' }}>
          Signal Dashboard
        </Text>
        <Text style={{ color: '#9AA6B2', marginTop: s(3), fontSize: s(13), fontWeight: '700' }}>
          Entry, exit, confidence and stop-loss planner
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: s(8) }}>
        <IconButton icon="search" />
        <IconButton icon="bell" />
        <IconButton icon="settings" />
      </View>
    </View>
  );
}

function IconButton({ icon }: { icon: keyof typeof Feather.glyphMap }) {
  const { s } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => ({
        width: s(40),
        height: s(40),
        borderRadius: s(8),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? '#1F2937' : '#111827',
        borderWidth: 1,
        borderColor: '#263241',
      })}
    >
      <Feather name={icon} size={s(18)} color="#D6DEE8" />
    </Pressable>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: object }) {
  const { s } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: '#0B1118',
          borderWidth: 1,
          borderColor: '#1C2835',
          borderRadius: s(8),
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function AssetSelector({
  selectedSymbol,
  onSelect,
  compact,
}: {
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  compact: boolean;
}) {
  const { s } = useTheme();
  return (
    <Panel style={{ padding: s(10) }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: s(8), minWidth: compact ? undefined : '100%' }}>
          {ASSETS.map((asset) => {
            const selected = asset.symbol === selectedSymbol;
            return (
              <Pressable
                key={asset.symbol}
                onPress={() => onSelect(asset.symbol)}
                style={({ pressed }) => ({
                  minWidth: s(compact ? 128 : 146),
                  paddingVertical: s(10),
                  paddingHorizontal: s(12),
                  borderRadius: s(8),
                  backgroundColor: selected ? '#132236' : pressed ? '#111B27' : '#070C12',
                  borderWidth: 1,
                  borderColor: selected ? '#6AA8FF' : '#1C2835',
                })}
              >
                <Text style={{ color: '#F3F6FA', fontSize: s(14), fontWeight: '900' }}>{asset.symbol}</Text>
                <Text style={{ color: selected ? '#9CC2FF' : '#8D99A8', marginTop: s(2), fontSize: s(11), fontWeight: '800' }}>
                  {asset.kind} - {asset.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Panel>
  );
}

function DashboardControls({
  chartCount,
  period,
  candleSize,
  onChartCountChange,
  onPeriodChange,
  onCandleSizeChange,
  compact,
}: {
  chartCount: ChartCount;
  period: BacktestPeriod;
  candleSize: CandleSize;
  onChartCountChange: (count: ChartCount) => void;
  onPeriodChange: (period: BacktestPeriod) => void;
  onCandleSizeChange: (size: CandleSize) => void;
  compact: boolean;
}) {
  const { s } = useTheme();
  return (
    <Panel style={{ padding: s(10), gap: s(10) }}>
      <ControlRow title="Charts">
        {CHART_COUNTS.map((count) => (
          <SegmentButton key={count} label={String(count)} selected={chartCount === count} onPress={() => onChartCountChange(count)} />
        ))}
      </ControlRow>
      <ControlRow title="Period">
        {PERIODS.map((item) => (
          <SegmentButton key={item.key} label={compact ? item.key : item.label} selected={period === item.key} onPress={() => onPeriodChange(item.key)} />
        ))}
      </ControlRow>
      <ControlRow title="Candles">
        {CANDLE_SIZES.map((item) => (
          <SegmentButton key={item.key} label={item.label} selected={candleSize === item.key} onPress={() => onCandleSizeChange(item.key)} />
        ))}
      </ControlRow>
    </Panel>
  );
}

function ControlRow({ title, children }: { title: string; children: React.ReactNode }) {
  const { s } = useTheme();
  return (
    <View style={{ gap: s(7) }}>
      <Text style={{ color: '#8D99A8', fontSize: s(11), fontWeight: '900', textTransform: 'uppercase' }}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: s(7) }}>{children}</View>
      </ScrollView>
    </View>
  );
}

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { s } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: s(56),
        height: s(34),
        paddingHorizontal: s(11),
        borderRadius: s(8),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? '#132236' : pressed ? '#111B27' : '#070C12',
        borderWidth: 1,
        borderColor: selected ? '#6AA8FF' : '#1C2835',
      })}
    >
      <Text style={{ color: selected ? '#DCEBFF' : '#9AA6B2', fontSize: s(12), fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

function ChartGrid({
  charts,
  activeChartId,
  period,
  candleSize,
  marketData,
  compact,
  width,
  onActivate,
  onAssetChange,
  onToggleIndicator,
}: {
  charts: ChartConfig[];
  activeChartId: number;
  period: BacktestPeriod;
  candleSize: CandleSize;
  marketData: Record<string, MarketDataRecord>;
  compact: boolean;
  width: number;
  onActivate: (id: number) => void;
  onAssetChange: (id: number, symbol: string) => void;
  onToggleIndicator: (id: number, key: IndicatorKey) => void;
}) {
  const { s } = useTheme();
  const columns = compact ? 1 : charts.length <= 2 ? charts.length : charts.length === 4 ? 2 : 3;
  const gap = s(12);
  const cardWidth = compact ? width - s(28) : Math.max(s(320), (width - s(28) - gap * (columns - 1)) / columns);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {charts.map((chart) => {
        const asset = ASSETS.find((item) => item.symbol === chart.symbol) ?? ASSETS[0];
        const record =
          marketData[asset.symbol]?.period === period
            ? marketData[asset.symbol]
            : fallbackMarketData(asset, period, 'loading');
        const candles = buildCandlesFromDaily(asset, record.candles, period, candleSize);
        const model = analyzeSignal(candles, chart.indicators, period, candleSize);
        return (
          <StrategyChartCard
            key={chart.id}
            chart={chart}
            asset={asset}
            candles={candles}
            model={model}
            marketStatus={record.status}
            marketSource={record.source}
            active={chart.id === activeChartId}
            width={cardWidth}
            compact={compact}
            onActivate={() => onActivate(chart.id)}
            onAssetChange={(symbol) => onAssetChange(chart.id, symbol)}
            onToggleIndicator={(key) => onToggleIndicator(chart.id, key)}
          />
        );
      })}
    </View>
  );
}

function StrategyChartCard({
  chart,
  asset,
  candles,
  model,
  marketStatus,
  marketSource,
  active,
  width,
  compact,
  onActivate,
  onAssetChange,
  onToggleIndicator,
}: {
  chart: ChartConfig;
  asset: Asset;
  candles: Candle[];
  model: SignalModel;
  marketStatus: MarketStatus;
  marketSource?: string;
  active: boolean;
  width: number;
  compact: boolean;
  onActivate: () => void;
  onAssetChange: (symbol: string) => void;
  onToggleIndicator: (key: IndicatorKey) => void;
}) {
  const { s } = useTheme();
  return (
    <Pressable onPress={onActivate} style={{ width }}>
      <Panel style={{ borderColor: active ? '#6AA8FF' : '#1C2835' }}>
        <View style={{ padding: s(10), gap: s(9) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: s(8), alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F3F6FA', fontSize: s(14), fontWeight: '900' }}>
                Chart {chart.id} - {asset.symbol}
              </Text>
              <Text style={{ color: '#8D99A8', marginTop: s(2), fontSize: s(11), fontWeight: '800' }}>
                {statusLabel(marketStatus, marketSource)} - {model.action} {model.successRate}% success - {model.backtestTrades} tests
              </Text>
            </View>
            <Text style={{ color: ACTION_COLOR[model.action], fontSize: s(18), fontWeight: '900' }}>{model.confidence}%</Text>
          </View>
          <AssetMiniSelector selectedSymbol={asset.symbol} onSelect={onAssetChange} />
          <IndicatorToggleStrip enabled={chart.indicators} onToggle={onToggleIndicator} />
        </View>
        <MarketChart asset={asset} candles={candles} model={model} width={width} compactChart={compact || width < 520} />
      </Panel>
    </Pressable>
  );
}

function AssetMiniSelector({ selectedSymbol, onSelect }: { selectedSymbol: string; onSelect: (symbol: string) => void }) {
  const { s } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: s(6) }}>
        {ASSETS.map((asset) => {
          const selected = selectedSymbol === asset.symbol;
          return (
            <Pressable
              key={asset.symbol}
              onPress={() => onSelect(asset.symbol)}
              style={({ pressed }) => ({
                paddingHorizontal: s(9),
                height: s(30),
                borderRadius: s(8),
                justifyContent: 'center',
                backgroundColor: selected ? '#132236' : pressed ? '#111B27' : '#070C12',
                borderWidth: 1,
                borderColor: selected ? '#6AA8FF' : '#1C2835',
              })}
            >
              <Text style={{ color: selected ? '#DCEBFF' : '#9AA6B2', fontSize: s(11), fontWeight: '900' }}>{asset.symbol}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function IndicatorToggleStrip({
  enabled,
  onToggle,
}: {
  enabled: IndicatorKey[];
  onToggle: (key: IndicatorKey) => void;
}) {
  const { s } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: s(6) }}>
        {INDICATORS.map((indicator) => {
          const selected = enabled.includes(indicator.key);
          return (
            <Pressable
              key={indicator.key}
              onPress={() => onToggle(indicator.key)}
              style={({ pressed }) => ({
                minWidth: s(48),
                height: s(30),
                borderRadius: s(8),
                paddingHorizontal: s(8),
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? '#123522' : pressed ? '#111B27' : '#070C12',
                borderWidth: 1,
                borderColor: selected ? '#28C083' : '#1C2835',
              })}
            >
              <Text style={{ color: selected ? '#BFF5D9' : '#8D99A8', fontSize: s(11), fontWeight: '900' }}>{indicator.short}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function MarketChart({
  asset,
  candles,
  model,
  width,
  compactChart,
}: {
  asset: Asset;
  candles: Candle[];
  model: SignalModel;
  width: number;
  compactChart?: boolean;
}) {
  const { s } = useTheme();
  const height = s(compactChart ? 330 : 470);
  const pad = { left: s(44), right: s(60), top: s(18), bottom: s(34) };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const rawMaxHigh = Math.max(...candles.map((item) => item.high));
  const rawMinLow = Math.min(...candles.map((item) => item.low));
  const chartPadding = Math.max((rawMaxHigh - rawMinLow) * 0.12, rawMaxHigh * 0.01);
  const maxHigh = rawMaxHigh + chartPadding;
  const minLow = Math.max(0.0001, rawMinLow - chartPadding);
  const xStep = innerW / (candles.length - 1);
  const candleW = Math.max(4, Math.min(9, xStep * 0.5));
  const yRaw = (price: number) => pad.top + innerH - ((price - minLow) / (maxHigh - minLow)) * innerH;
  const y = (price: number) => clamp(yRaw(price), pad.top + 4, height - pad.bottom - 4);
  const latest = candles[candles.length - 1];
  const closePath = candles
    .map((item, index) => `${index === 0 ? 'M' : 'L'}${(pad.left + index * xStep).toFixed(1)} ${y(item.close).toFixed(1)}`)
    .join(' ');
  const labelIndices = Array.from({ length: 6 }, (_, index) =>
    Math.min(candles.length - 1, Math.round((index / 5) * (candles.length - 1))),
  );
  const ema21 = ema(candles.map((item) => item.close), 21);
  const ema55 = ema(candles.map((item) => item.close), 55);
  const emaPath = (values: number[]) =>
    values
      .map((value, index) => `${index === 0 ? 'M' : 'L'}${(pad.left + index * xStep).toFixed(1)} ${y(value).toFixed(1)}`)
      .join(' ');
  const entryX = pad.left + (candles.length - 5) * xStep;
  const exitX = pad.left + (candles.length - 2) * xStep;
  const entryAction = model.action === 'Sell' ? 'Sell' : 'Buy';
  const exitAction = model.action === 'Sell' ? 'Buy' : 'Sell';

  return (
    <Panel style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: s(12), paddingTop: s(12), paddingBottom: s(8) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: s(8) }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#F3F6FA', fontSize: s(18), fontWeight: '900' }}>
              {asset.name} / U.S. Dollar
            </Text>
            <Text style={{ color: '#8D99A8', fontSize: s(12), marginTop: s(2), fontWeight: '700' }}>
              {asset.symbol} - Daily confluence model
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: ACTION_COLOR[model.action], fontSize: s(15), fontWeight: '900' }}>
              {formatMoney(latest.close)}
            </Text>
            <Text style={{ color: '#8D99A8', fontSize: s(11), fontWeight: '800' }}>last close</Text>
          </View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height }}>
        <Svg width={width} height={height}>
          <Rect x={0} y={0} width={width} height={height} fill="#FAFBFC" />
          {[0, 1, 2, 3, 4].map((line) => (
            <Line
              key={`grid-${line}`}
              x1={pad.left}
              x2={width - pad.right}
              y1={pad.top + (innerH / 4) * line}
              y2={pad.top + (innerH / 4) * line}
              stroke="#E8EDF2"
              strokeWidth={1}
            />
          ))}
          {labelIndices.map((index) => (
            <React.Fragment key={index}>
              <Line
                x1={pad.left + index * xStep}
                x2={pad.left + index * xStep}
                y1={pad.top}
                y2={height - pad.bottom}
                stroke="#EDF1F5"
                strokeWidth={1}
              />
              <SvgText x={pad.left + index * xStep - 15} y={height - 9} fill="#4B5563" fontSize={11} fontWeight="700">
                {candles[index]?.label}
              </SvgText>
            </React.Fragment>
          ))}
          {[
            { label: 'target', price: model.target },
            { label: 'last', price: latest.close },
            { label: 'entry', price: model.entry },
            { label: 'stop', price: model.stop },
          ].map(({ label, price }) => (
            <React.Fragment key={label}>
              <Line
                x1={pad.left}
                x2={width - pad.right}
                y1={y(price)}
                y2={y(price)}
                stroke={price === model.stop ? '#F05252' : price === model.target ? '#28C083' : '#9AA6B2'}
                strokeDasharray="6 6"
                strokeWidth={1.4}
              />
              <SvgText x={width - pad.right + 8} y={y(price) + 4} fill="#374151" fontSize={11} fontWeight="700">
                {formatCompact(price)}
              </SvgText>
            </React.Fragment>
          ))}
          {candles.map((candle, index) => {
            const x = pad.left + index * xStep;
            const up = candle.close >= candle.open;
            const color = up ? '#07866F' : '#E63946';
            const bodyTop = y(Math.max(candle.open, candle.close));
            const bodyH = Math.max(2, Math.abs(y(candle.open) - y(candle.close)));
            return (
              <React.Fragment key={`${asset.symbol}-${index}`}>
                <Line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke="#6B7280" strokeWidth={1.2} />
                <Rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH} fill={color} />
              </React.Fragment>
            );
          })}
          <Path d={closePath} stroke="#1F2937" strokeWidth={1.8} fill="none" opacity={0.45} />
          <Path d={emaPath(ema21)} stroke="#2F80ED" strokeWidth={2} fill="none" />
          <Path d={emaPath(ema55)} stroke="#F2994A" strokeWidth={2} fill="none" />
          <TradeMarker x={entryX} y={y(model.entry)} action={entryAction} />
          <TradeMarker x={exitX} y={y(model.target)} action={exitAction} />
          <Circle cx={pad.left + (candles.length - 1) * xStep} cy={y(latest.close)} r={5} fill={ACTION_COLOR[model.action]} />
          <SvgText x={pad.left + 8} y={pad.top + 18} fill="#465160" fontSize={11} fontWeight="700">
            EMA 21 / EMA 55 - Entry {formatMoney(model.entry)} - Stop {formatMoney(model.stop)}
          </SvgText>
        </Svg>
      </ScrollView>
    </Panel>
  );
}

function TradeMarker({ x, y, action }: { x: number; y: number; action: 'Buy' | 'Sell' }) {
  const color = ACTION_COLOR[action];
  const points =
    action === 'Buy'
      ? `${x},${y - 15} ${x - 9},${y + 3} ${x + 9},${y + 3}`
      : `${x},${y + 15} ${x - 9},${y - 3} ${x + 9},${y - 3}`;
  return (
    <>
      <Polygon points={points} fill={color} />
      <SvgText x={x - 10} y={action === 'Buy' ? y + 19 : y - 10} fill={color} fontSize={11} fontWeight="900">
        {action}
      </SvgText>
    </>
  );
}

function SignalPanel({
  asset,
  model,
  marketStatus,
  marketSource,
}: {
  asset: Asset;
  model: SignalModel;
  marketStatus: MarketStatus;
  marketSource?: string;
}) {
  const { s } = useTheme();
  const icon = model.action === 'Buy' ? 'trending-up' : model.action === 'Sell' ? 'trending-down' : 'activity';
  return (
    <Panel style={{ padding: s(14), gap: s(14) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
        <View
          style={{
            width: s(42),
            height: s(42),
            borderRadius: s(8),
            backgroundColor: `${ACTION_COLOR[model.action]}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name={icon} size={s(22)} color={ACTION_COLOR[model.action]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: ACTION_COLOR[model.action], fontSize: s(22), fontWeight: '900' }}>{model.action}</Text>
          <Text style={{ color: '#8D99A8', fontSize: s(12), fontWeight: '800' }}>
            {asset.symbol} signal confidence - {statusLabel(marketStatus, marketSource)}
          </Text>
        </View>
        <Text style={{ color: '#F3F6FA', fontSize: s(28), fontWeight: '900' }}>{model.confidence}%</Text>
      </View>
      <Text style={{ color: '#D6DEE8', fontSize: s(13), lineHeight: s(19), fontWeight: '700' }}>{model.summary}</Text>
      <View style={{ height: s(9), borderRadius: s(5), backgroundColor: '#1A2430', overflow: 'hidden' }}>
        <View style={{ width: `${model.confidence}%`, height: '100%', backgroundColor: ACTION_COLOR[model.action] }} />
      </View>
      <View style={{ flexDirection: 'row', gap: s(8) }}>
        <Level label="Entry" value={formatMoney(model.entry)} color="#D6DEE8" />
        <Level label="Target" value={formatMoney(model.target)} color="#28C083" />
        <Level label="Stop" value={formatMoney(model.stop)} color="#F05252" />
      </View>
    </Panel>
  );
}

function Level({ label, value, color }: { label: string; value: string; color: string }) {
  const { s } = useTheme();
  return (
    <View style={{ flex: 1, padding: s(9), borderRadius: s(8), backgroundColor: '#071018', borderWidth: 1, borderColor: '#1C2835' }}>
      <Text style={{ color: '#8D99A8', fontSize: s(10), fontWeight: '900' }}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color, marginTop: s(3), fontSize: s(13), fontWeight: '900' }}>
        {value}
      </Text>
    </View>
  );
}

function RiskPanel({ model }: { model: SignalModel }) {
  const { s } = useTheme();
  return (
    <Panel style={{ padding: s(14), gap: s(12) }}>
      <SectionTitle title="Trade Protection" action={`${model.riskReward.toFixed(1)}R`} />
      <Metric label="ATR stop distance" value={`${model.riskPercent.toFixed(2)}%`} color="#F05252" />
      <Metric label="Risk per trade" value={model.positionRisk} color="#E5B454" />
      <Metric label="Volatility ATR" value={formatMoney(model.levels.atr)} color="#6AA8FF" />
      <Text style={{ color: '#9AA6B2', fontSize: s(12), lineHeight: s(18), fontWeight: '700' }}>
        Stop is placed beyond recent structure and at least 1.5x ATR away, then trailed only after price clears the first target zone.
      </Text>
    </Panel>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  const { s } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10) }}>
      <Text style={{ color: '#8D99A8', fontSize: s(12), fontWeight: '800' }}>{label}</Text>
      <Text style={{ color, fontSize: s(13), fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

function IndicatorMatrix({
  indicators,
  enabledIndicators,
}: {
  indicators: IndicatorVerdict[];
  enabledIndicators: IndicatorKey[];
}) {
  const { s } = useTheme();
  return (
    <Panel style={{ flex: 1.25, padding: s(12), gap: s(10) }}>
      <SectionTitle title="Indicator Matrix" action={`${enabledIndicators.length}/${INDICATORS.length} enabled`} />
      {indicators.map((indicator) => (
        <View key={indicator.name} style={{ gap: s(5) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: s(10) }}>
            <Text style={{ flex: 1, color: '#F3F6FA', fontSize: s(13), fontWeight: '900' }}>{indicator.name}</Text>
            <Text style={{ color: indicator.color, fontSize: s(12), fontWeight: '900' }}>{indicator.verdict}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: s(10) }}>
            <Text style={{ color: '#8D99A8', fontSize: s(12), fontWeight: '700' }}>{indicator.value}</Text>
            <Text style={{ color: '#8D99A8', fontSize: s(12), fontWeight: '800' }}>{indicator.score > 0 ? '+' : ''}{indicator.score}</Text>
          </View>
        </View>
      ))}
    </Panel>
  );
}

function StrategyBacktestSummary({
  model,
  period,
  candleSize,
  marketStatus,
  marketSource,
}: {
  model: SignalModel;
  period: BacktestPeriod;
  candleSize: CandleSize;
  marketStatus: MarketStatus;
  marketSource?: string;
}) {
  const { s } = useTheme();
  return (
    <Panel style={{ padding: s(12), gap: s(10) }}>
      <SectionTitle title="Backtest Estimate" action={`${model.successRate}% success`} />
      <Metric label="Window" value={periodLabel(period)} color="#D6DEE8" />
      <Metric label="Candle size" value={candleSizeLabel(candleSize)} color="#D6DEE8" />
      <Metric label="Data source" value={statusLabel(marketStatus, marketSource)} color={marketStatus === 'live' ? '#28C083' : '#E5B454'} />
      <Metric label="Tested signals" value={String(model.backtestTrades)} color="#6AA8FF" />
      <Metric label="Active indicators" value={String(model.enabledCount)} color="#28C083" />
      <Text style={{ color: '#8D99A8', fontSize: s(11), lineHeight: s(16), fontWeight: '700' }}>
        Success is calculated from historical synthetic candles using the selected indicators and period. It updates whenever toggles, timeframe, or candle size changes.
      </Text>
    </Panel>
  );
}

function StopLossPlaybook({ model }: { model: SignalModel }) {
  const { s } = useTheme();
  const steps =
    model.action === 'Sell'
      ? [
          `Initial stop above ${formatMoney(model.stop)}.`,
          `Take partial profit near ${formatMoney(model.target)}.`,
          'Trail stop above EMA 21 after momentum confirms.',
        ]
      : [
          `Initial stop below ${formatMoney(model.stop)}.`,
          `First target near ${formatMoney(model.target)}.`,
          'Trail stop under EMA 21 after price moves in profit.',
        ];
  return (
    <Panel style={{ flex: 1, padding: s(12), gap: s(10) }}>
      <SectionTitle title="Stop-Loss Plan" action="Risk first" />
      {steps.map((step, index) => (
        <View key={step} style={{ flexDirection: 'row', gap: s(9), alignItems: 'flex-start' }}>
          <View
            style={{
              width: s(22),
              height: s(22),
              borderRadius: s(11),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#132236',
            }}
          >
            <Text style={{ color: '#9CC2FF', fontSize: s(11), fontWeight: '900' }}>{index + 1}</Text>
          </View>
          <Text style={{ flex: 1, color: '#D6DEE8', fontSize: s(13), lineHeight: s(19), fontWeight: '700' }}>{step}</Text>
        </View>
      ))}
    </Panel>
  );
}

function ResearchStack() {
  const { s } = useTheme();
  const items = [
    ['Trend', 'EMA 21/55 and Supertrend-style ATR bands'],
    ['Momentum', 'MACD direction plus RSI regime'],
    ['Volatility', 'Bollinger Bands and ATR expansion'],
    ['Risk', 'Structure stop plus ATR buffer'],
  ];
  return (
    <Panel style={{ flex: 1, padding: s(12), gap: s(10) }}>
      <SectionTitle title="Signal Recipe" action="Research-backed" />
      {items.map(([label, value]) => (
        <Metric key={label} label={label} value={value} color="#D6DEE8" />
      ))}
      <Text style={{ color: '#8D99A8', fontSize: s(11), lineHeight: s(16), fontWeight: '700' }}>
        Confidence is a model score from indicator agreement, not a guaranteed win rate.
      </Text>
    </Panel>
  );
}

function SectionTitle({ title, action }: { title: string; action: string }) {
  const { s } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(10) }}>
      <Text style={{ color: '#F3F6FA', fontSize: s(18), fontWeight: '900' }}>{title}</Text>
      <Text style={{ color: '#28C083', fontSize: s(12), fontWeight: '900' }}>{action}</Text>
    </View>
  );
}

function analyzeSignal(
  candles: Candle[],
  enabledIndicators: IndicatorKey[] = DEFAULT_INDICATORS,
  period: BacktestPeriod = '1Y',
  candleSize: CandleSize = '1D',
): SignalModel {
  const computed = scoreCandles(candles);
  const enabledSet = new Set(enabledIndicators);
  const activeScores = computed.indicators.filter((indicator) => enabledSet.has(indicator.key));
  const score = activeScores.reduce((sum, indicator) => sum + indicator.score, 0);
  const maxScore = activeScores.reduce((sum, indicator) => sum + Math.max(1, Math.abs(indicator.score)), 0) || 1;
  const action: Action = score / maxScore >= 0.42 ? 'Buy' : score / maxScore <= -0.42 ? 'Sell' : 'Wait';
  const confidence = clamp(Math.round(46 + Math.abs(score / maxScore) * 42 + activeScores.length * 1.5), 42, 90);
  const backtest = backtestStrategy(candles, enabledIndicators, period, candleSize);
  const entry = computed.latest;
  const longStop = Math.min(computed.support - computed.atrNow * 0.35, entry - computed.atrNow * 1.5);
  const shortStop = Math.max(computed.resistance + computed.atrNow * 0.35, entry + computed.atrNow * 1.5);
  const stop = action === 'Sell' ? shortStop : longStop;
  const risk = Math.abs(entry - stop);
  const target = action === 'Sell' ? entry - risk * 2.1 : entry + risk * 2.1;
  const reward = Math.max(Math.abs(target - entry), 0.01);
  const riskReward = reward / Math.max(risk, 0.01);
  const riskPercent = (risk / entry) * 100;
  const positionRisk = riskPercent > 5 ? '0.5%-1% account' : '1%-2% account';
  const summary =
    action === 'Buy'
      ? 'Enabled indicators agree on a long setup. Entry/exit levels update from the selected candle size and backtest period.'
      : action === 'Sell'
        ? 'Enabled indicators lean defensive. Short or exit levels are recalculated from the current indicator mix.'
        : 'Selected indicators are mixed. Wait for stronger agreement or change the indicator combination.';

  return {
    action,
    confidence,
    successRate: backtest.successRate,
    backtestTrades: backtest.trades,
    enabledCount: enabledIndicators.length,
    entry,
    target,
    stop,
    riskReward,
    riskPercent,
    positionRisk,
    summary,
    indicators: computed.indicators,
    levels: {
      support: computed.support,
      resistance: computed.resistance,
      atr: computed.atrNow,
      ema21: computed.ema21Now,
      ema55: computed.ema55Now,
      rsi: computed.rsiNow,
      macd: computed.macdNow,
      macdSignal: computed.macdSignalNow,
      upperBand: computed.upperBand,
      lowerBand: computed.lowerBand,
      supertrend: computed.supertrend,
    },
  };
}

function scoreCandles(candles: Candle[]) {
  const closes = candles.map((item) => item.close);
  const highs = candles.map((item) => item.high);
  const lows = candles.map((item) => item.low);
  const latest = candles[candles.length - 1].close;
  const ema21 = ema(closes, 21);
  const ema55 = ema(closes, 55);
  const rsiSeries = rsi(closes, 14);
  const macdSeries = macd(closes);
  const atrSeries = atr(candles, 14);
  const bands = bollinger(closes, 20, 2);
  const atrNow = last(atrSeries);
  const support = Math.min(...lows.slice(-20));
  const resistance = Math.max(...highs.slice(-20));
  const ema21Now = last(ema21);
  const ema55Now = last(ema55);
  const rsiNow = last(rsiSeries);
  const macdNow = last(macdSeries.macdLine);
  const macdSignalNow = last(macdSeries.signalLine);
  const upperBand = last(bands.upper);
  const lowerBand = last(bands.lower);
  const supertrend = latest > ema55Now ? latest - atrNow * 3 : latest + atrNow * 3;
  const trendScore = latest > ema21Now && ema21Now > ema55Now ? 2 : latest < ema21Now && ema21Now < ema55Now ? -2 : 0;
  const macdScore = macdNow > macdSignalNow ? 1 : -1;
  const rsiScore = rsiNow > 55 && rsiNow < 72 ? 1 : rsiNow < 45 && rsiNow > 28 ? -1 : rsiNow >= 72 ? -1 : rsiNow <= 28 ? 1 : 0;
  const bandScore = latest <= lowerBand * 1.02 ? 1 : latest >= upperBand * 0.98 ? -1 : 0;
  const structureScore = latest > resistance - atrNow ? 1 : latest < support + atrNow ? -1 : 0;
  const atrScore = (atrNow / latest) * 100 <= 5 ? 1 : -1;
  const indicators: IndicatorVerdict[] = [
    verdict('ema', 'EMA 21/55 Trend', `${formatMoney(ema21Now)} / ${formatMoney(ema55Now)}`, trendScore > 0 ? 'Bullish trend' : trendScore < 0 ? 'Bearish trend' : 'Mixed trend', trendScore),
    verdict('macd', 'MACD Momentum', `${macdNow.toFixed(2)} vs ${macdSignalNow.toFixed(2)}`, macdScore > 0 ? 'Momentum up' : 'Momentum down', macdScore),
    verdict('rsi', 'RSI Regime', rsiNow.toFixed(1), rsiScore > 0 ? 'Constructive' : rsiScore < 0 ? 'Caution' : 'Neutral', rsiScore),
    verdict('bollinger', 'Bollinger Location', `${formatMoney(lowerBand)} - ${formatMoney(upperBand)}`, bandScore > 0 ? 'Near value' : bandScore < 0 ? 'Near exhaustion' : 'Mid range', bandScore),
    verdict('structure', 'Structure', `${formatMoney(support)} / ${formatMoney(resistance)}`, structureScore > 0 ? 'Breakout pressure' : structureScore < 0 ? 'Support test' : 'Inside range', structureScore),
    verdict('atr', 'ATR Risk', formatMoney(atrNow), atrScore > 0 ? 'Manageable' : 'Wide stop', atrScore),
  ];
  return {
    latest,
    indicators,
    support,
    resistance,
    atrNow,
    ema21Now,
    ema55Now,
    rsiNow,
    macdNow,
    macdSignalNow,
    upperBand,
    lowerBand,
    supertrend,
  };
}

function backtestStrategy(
  candles: Candle[],
  enabledIndicators: IndicatorKey[],
  period: BacktestPeriod,
  candleSize: CandleSize,
) {
  const holdBars = candleSize === '1M' ? 2 : candleSize === '2W' ? 3 : candleSize === '1W' ? 4 : 8;
  let wins = 0;
  let trades = 0;
  const startIndex = Math.min(40, Math.max(18, Math.floor(candles.length * 0.35)));
  for (let index = startIndex; index < candles.length - holdBars; index += Math.max(2, Math.floor(holdBars / 2))) {
    const sample = candles.slice(0, index + 1);
    const computed = scoreCandles(sample);
    const enabledSet = new Set(enabledIndicators);
    const activeScores = computed.indicators.filter((indicator) => enabledSet.has(indicator.key));
    const score = activeScores.reduce((sum, indicator) => sum + indicator.score, 0);
    const maxScore = activeScores.reduce((sum, indicator) => sum + Math.max(1, Math.abs(indicator.score)), 0) || 1;
    const ratio = score / maxScore;
    const action: Action = ratio >= 0.25 ? 'Buy' : ratio <= -0.25 ? 'Sell' : 'Wait';
    if (action === 'Wait') continue;
    trades += 1;
    const entry = candles[index].close;
    const exit = candles[index + holdBars].close;
    if ((action === 'Buy' && exit > entry) || (action === 'Sell' && exit < entry)) wins += 1;
  }
  const baseRate = trades ? Math.round((wins / trades) * 100) : 50;
  const periodAdjustment = period === '3M' ? -3 : period === 'MAX' ? 2 : 0;
  return { successRate: clamp(baseRate + periodAdjustment, 35, 88), trades };
}

function verdict(key: IndicatorKey, name: string, value: string, verdictText: string, score: number): IndicatorVerdict {
  return {
    key,
    name,
    value,
    verdict: verdictText,
    score,
    color: score > 0 ? '#28C083' : score < 0 ? '#F05252' : '#E5B454',
  };
}

function buildCandlesFromDaily(
  asset: Asset,
  dailyCandles: Candle[],
  period: BacktestPeriod,
  candleSize: CandleSize,
): Candle[] {
  const periodDays = PERIODS.find((item) => item.key === period)?.candles ?? 252;
  const candleDays = CANDLE_SIZES.find((item) => item.key === candleSize)?.days ?? 1;
  const raw = dailyCandles.length ? dailyCandles : makeCandles(asset, periodDays + 120);
  const aggregated = aggregateCandles(raw, candleDays);
  return aggregated.slice(-Math.max(60, Math.ceil(periodDays / candleDays)));
}

function fallbackMarketData(
  asset: Asset,
  period: BacktestPeriod,
  status: MarketStatus,
  error?: string,
): MarketDataRecord {
  const periodDays = PERIODS.find((item) => item.key === period)?.candles ?? 252;
  return {
    candles: makeCandles(asset, Math.max(220, periodDays + 120)),
    status,
    period,
    error,
  };
}

async function fetchMarketCandles(asset: Asset, period: BacktestPeriod): Promise<{ candles: Candle[]; source: string }> {
  const errors: string[] = [];
  if (asset.kind === 'Crypto' && asset.binanceSymbol) {
    try {
      return { candles: await fetchBinanceCandles(asset, period), source: 'Binance' };
    } catch (error) {
      errors.push(`Binance: ${(error as Error).message}`);
    }
  }
  if (asset.kind === 'Crypto' && asset.coingeckoId) {
    try {
      return { candles: await fetchCoinGeckoCandles(asset, period), source: 'CoinGecko' };
    } catch (error) {
      errors.push(`CoinGecko: ${(error as Error).message}`);
    }
  }
  if (asset.kind === 'Stock' && asset.stooqSymbol) {
    try {
      return { candles: await fetchStooqCandles(asset, period), source: 'Stooq' };
    } catch (error) {
      errors.push(`Stooq: ${(error as Error).message}`);
    }
  }
  try {
    return { candles: await fetchYahooCandles(asset, period), source: 'Yahoo' };
  } catch (error) {
    errors.push(`Yahoo: ${(error as Error).message}`);
  }
  throw new Error(errors.join(' | ') || 'No market data provider returned candles');
}

async function fetchBinanceCandles(asset: Asset, period: BacktestPeriod): Promise<Candle[]> {
  const periodDays = PERIODS.find((item) => item.key === period)?.candles ?? 252;
  const limit = Math.min(1000, Math.max(120, periodDays + 120));
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(asset.binanceSymbol ?? '')}&interval=1d&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Market data response did not include klines');
  const candles = data
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const timestamp = Number(row[0]);
      const open = Number(row[1]);
      const high = Number(row[2]);
      const low = Number(row[3]);
      const close = Number(row[4]);
      const volume = Number(row[5]) || 0;
      if (![timestamp, open, high, low, close].every(Number.isFinite)) return null;
      return {
        label: formatDateLabel(timestamp / 1000),
        open,
        high,
        low,
        close,
        volume,
      };
    })
    .filter((item): item is Candle => item !== null);
  if (candles.length < 45) throw new Error('Not enough Binance candles returned');
  return candles;
}

async function fetchYahooCandles(asset: Asset, period: BacktestPeriod): Promise<Candle[]> {
  const range = yahooRange(period);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.yahooSymbol)}?range=${range}&interval=1d&includePrePost=false&events=history`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const timestamps: number[] | undefined = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];
  if (!timestamps?.length || !quote) throw new Error('Market data response did not include candles');
  const candles: Candle[] = [];
  timestamps.forEach((timestamp, index) => {
    const open = Number(quote.open?.[index]);
    const high = Number(quote.high?.[index]);
    const low = Number(quote.low?.[index]);
    const close = Number(quote.close?.[index]);
    if (![open, high, low, close].every(Number.isFinite)) return;
    candles.push({
      label: formatDateLabel(timestamp),
      open,
      high,
      low,
      close,
      volume: Number(quote.volume?.[index]) || 0,
    });
  });
  if (candles.length < 45) throw new Error('Not enough candles returned for analysis');
  return candles;
}

async function fetchCoinGeckoCandles(asset: Asset, period: BacktestPeriod): Promise<Candle[]> {
  const days = coingeckoDays(period);
  const url = `https://api.coingecko.com/api/v3/coins/${asset.coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
  const data = await response.json();
  const prices: Array<[number, number]> | undefined = data?.prices;
  if (!prices?.length) throw new Error('Market data response did not include prices');
  const candles = prices
    .filter(([, price]) => Number.isFinite(price))
    .map(([timestamp, close], index, rows) => {
      const previous = index > 0 ? rows[index - 1][1] : close;
      const swing = Math.max(Math.abs(close - previous), close * 0.006);
      return {
        label: formatDateLabel(timestamp / 1000),
        open: previous,
        high: Math.max(previous, close) + swing * 0.35,
        low: Math.max(0.0001, Math.min(previous, close) - swing * 0.35),
        close,
        volume: 0,
      };
    });
  if (candles.length < 45) throw new Error('Not enough CoinGecko candles returned');
  return candles;
}

async function fetchStooqCandles(asset: Asset, period: BacktestPeriod): Promise<Candle[]> {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(asset.stooqSymbol ?? asset.symbol.toLowerCase())}&i=d`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
  const csv = await response.text();
  const rows = csv.trim().split(/\r?\n/).slice(1);
  const candles = rows
    .map((row) => {
      const [date, open, high, low, close, volume] = row.split(',');
      const parsedOpen = Number(open);
      const parsedHigh = Number(high);
      const parsedLow = Number(low);
      const parsedClose = Number(close);
      if (![parsedOpen, parsedHigh, parsedLow, parsedClose].every(Number.isFinite)) return null;
      return {
        label: shortDateLabel(date),
        open: parsedOpen,
        high: parsedHigh,
        low: parsedLow,
        close: parsedClose,
        volume: Number(volume) || 0,
      };
    })
    .filter((item): item is Candle => item !== null)
    .slice(-Math.max(240, (PERIODS.find((item) => item.key === period)?.candles ?? 252) + 120));
  if (candles.length < 45) throw new Error('Not enough Stooq candles returned');
  return candles;
}

function yahooRange(period: BacktestPeriod) {
  switch (period) {
    case '3M':
      return '6mo';
    case '6M':
      return '1y';
    case '1Y':
      return '2y';
    case '3Y':
      return '5y';
    case '5Y':
      return '10y';
    case 'MAX':
      return 'max';
    default:
      return '2y';
  }
}

function coingeckoDays(period: BacktestPeriod) {
  switch (period) {
    case '3M':
      return '90';
    case '6M':
      return '180';
    case '1Y':
      return '365';
    case '3Y':
    case '5Y':
    case 'MAX':
      return 'max';
    default:
      return '365';
  }
}

function formatDateLabel(timestampSeconds: number) {
  const date = new Date(timestampSeconds * 1000);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function shortDateLabel(date: string) {
  const [year, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}/${String(year).slice(-2)}`;
}

function makeCandles(asset: Asset, count: number): Candle[] {
  const candles: Candle[] = [];
  let close = asset.basePrice * (0.78 + seeded(asset.seed) * 0.12);
  for (let index = 0; index < count; index += 1) {
    const cycle = Math.sin((index + asset.seed) / 5.4) * asset.volatility;
    const swing = Math.cos((index + asset.seed) / 9.1) * asset.volatility * 0.55;
    const drift = asset.bias / 100;
    const shock = (seeded(asset.seed * 97 + index * 13) - 0.5) * asset.volatility * 1.45;
    const open = close;
    close = Math.max(asset.basePrice * 0.18, open * (1 + drift + cycle * 0.26 + swing * 0.18 + shock));
    const range = Math.max(close * asset.volatility * (0.78 + seeded(asset.seed + index) * 0.85), close * 0.006);
    candles.push({
      label: `D${index + 1}`,
      open,
      close,
      high: Math.max(open, close) + range * 0.55,
      low: Math.min(open, close) - range * 0.55,
      volume: 1000000 * (0.8 + seeded(index + asset.seed) * 1.6),
    });
  }
  return candles;
}

function aggregateCandles(candles: Candle[], size: number) {
  if (size <= 1) return candles;
  const output: Candle[] = [];
  for (let index = 0; index < candles.length; index += size) {
    const group = candles.slice(index, index + size);
    if (!group.length) continue;
    output.push({
      label: group[group.length - 1].label,
      open: group[0].open,
      high: Math.max(...group.map((item) => item.high)),
      low: Math.min(...group.map((item) => item.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, item) => sum + item.volume, 0),
    });
  }
  return output;
}

function ema(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  const output: number[] = [];
  values.forEach((value, index) => {
    output.push(index === 0 ? value : value * multiplier + output[index - 1] * (1 - multiplier));
  });
  return output;
}

function rsi(values: number[], period: number) {
  const output: number[] = [];
  let gain = 0;
  let loss = 0;
  for (let index = 0; index < values.length; index += 1) {
    if (index === 0) {
      output.push(50);
      continue;
    }
    const change = values[index] - values[index - 1];
    const up = Math.max(change, 0);
    const down = Math.max(-change, 0);
    gain = index <= period ? gain + up / period : (gain * (period - 1) + up) / period;
    loss = index <= period ? loss + down / period : (loss * (period - 1) + down) / period;
    const rs = loss === 0 ? 100 : gain / loss;
    output.push(100 - 100 / (1 + rs));
  }
  return output;
}

function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const macdLine = values.map((_, index) => fast[index] - slow[index]);
  const signalLine = ema(macdLine, 9);
  return { macdLine, signalLine };
}

function atr(candles: Candle[], period: number) {
  const trueRanges = candles.map((candle, index) => {
    if (index === 0) return candle.high - candle.low;
    const previousClose = candles[index - 1].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose));
  });
  return ema(trueRanges, period);
}

function bollinger(values: number[], period: number, deviations: number) {
  const middle: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  values.forEach((value, index) => {
    const slice = values.slice(Math.max(0, index - period + 1), index + 1);
    const avg = average(slice);
    const variance = average(slice.map((item) => (item - avg) ** 2));
    const dev = Math.sqrt(variance);
    middle.push(avg);
    upper.push(avg + dev * deviations);
    lower.push(avg - dev * deviations);
  });
  return { middle, upper, lower };
}

function seeded(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function last(values: number[]) {
  return values[values.length - 1] ?? 0;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value: number) {
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (value >= 100) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return value.toFixed(value >= 100 ? 2 : 4);
}

function periodLabel(period: BacktestPeriod) {
  return PERIODS.find((item) => item.key === period)?.label ?? period;
}

function candleSizeLabel(candleSize: CandleSize) {
  return CANDLE_SIZES.find((item) => item.key === candleSize)?.label ?? candleSize;
}

function statusLabel(status: MarketStatus, source?: string) {
  if (status === 'live') return `Live ${source ?? 'market data'}`;
  if (status === 'loading') return 'Loading real data';
  return 'Fallback data';
}
