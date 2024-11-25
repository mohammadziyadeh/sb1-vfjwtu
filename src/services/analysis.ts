import { fetchTechnicalAnalysis } from './technicalAnalysis';
import { fetchSocialSentiment } from './sentimentAnalysis';
import { fetchNewsFromSources } from './fundamentalAnalysis';
import { analyzeChart } from './chartAnalysis';

export type Signal = 'Buy' | 'Sell' | 'Hold' | 'Neutral';

interface AnalysisResult {
  technical: Signal;
  fundamental: Signal;
  sentiment: Signal;
  chart: Signal;
  final: Signal;
}

export async function aggregateSignals(
  symbol: string,
  timeframe: string,
  newsSources: any[]
): Promise<AnalysisResult> {
  try {
    // Fetch all analyses with the same timeframe
    const [technical, sentiment, fundamental, chart] = await Promise.all([
      fetchTechnicalAnalysis(symbol, timeframe),
      fetchSocialSentiment(symbol),
      fetchNewsFromSources(symbol, newsSources),
      analyzeChart(symbol, timeframe)
    ]);

    // Convert sentiment signals
    const sentimentSignal: Signal = 
      sentiment.overall.signal === 'Bullish' ? 'Buy' :
      sentiment.overall.signal === 'Bearish' ? 'Sell' : 'Hold';

    // Convert fundamental signals
    const fundamentalSignal: Signal = 
      fundamental.overallSentiment >= 60 ? 'Buy' :
      fundamental.overallSentiment <= 40 ? 'Sell' : 'Hold';

    // Get signals
    const signals: Signal[] = [
      technical.current.decision,
      sentimentSignal,
      fundamentalSignal,
      chart.signal
    ];

    // Calculate final signal with weighted decision
    const finalSignal = determineAggregateSignal(signals, {
      technical: 0.35,    // 35% weight
      fundamental: 0.25,  // 25% weight
      sentiment: 0.20,    // 20% weight
      chart: 0.20        // 20% weight
    });

    return {
      technical: technical.current.decision,
      fundamental: fundamentalSignal,
      sentiment: sentimentSignal,
      chart: chart.signal,
      final: finalSignal
    };
  } catch (error) {
    console.error('Error aggregating signals:', error);
    return {
      technical: 'Neutral',
      fundamental: 'Neutral',
      sentiment: 'Neutral',
      chart: 'Neutral',
      final: 'Neutral'
    };
  }
}

interface SignalWeights {
  technical: number;
  fundamental: number;
  sentiment: number;
  chart: number;
}

function determineAggregateSignal(signals: Signal[], weights: SignalWeights): Signal {
  const scores = {
    Buy: 0,
    Sell: 0,
    Hold: 0,
    Neutral: 0
  };

  // Calculate weighted scores
  signals.forEach((signal, index) => {
    const weight = Object.values(weights)[index];
    scores[signal] += weight;
  });

  // Get the highest weighted signal
  const maxScore = Math.max(...Object.values(scores));
  const dominantSignal = Object.keys(scores).find(
    key => scores[key as Signal] === maxScore
  ) as Signal;

  // Strong signal requirements
  if (scores.Buy > 0.6) return 'Buy';
  if (scores.Sell > 0.6) return 'Sell';
  
  // If no strong signal, return the dominant signal or Hold
  return dominantSignal || 'Hold';
}