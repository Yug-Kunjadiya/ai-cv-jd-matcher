export interface EvalPair {
  cv_id: string;
  cv_name?: string;
  jd_id: string;
  jd_title?: string;
  actual: 'hire' | 'reject' | null; // null = pending label (not yet set by human)
  predicted: 'hire' | 'reject' | '';
  fitScore?: number;
}

export interface EvalMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number; // True Positive (Actual Hire, Predicted Hire)
    fp: number; // False Positive (Actual Reject, Predicted Hire)
    fn: number; // False Negative (Actual Hire, Predicted Reject)
    tn: number; // True Negative (Actual Reject, Predicted Reject)
  };
}

/**
 * Computes performance metrics for the model predictions against ground truth
 */
export function calculateMetrics(pairs: EvalPair[]): EvalMetrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;

  const validPairs = pairs.filter(p => {
    const act = p.actual?.toLowerCase();
    const pred = p.predicted?.toLowerCase();
    return act && (pred === 'hire' || pred === 'reject');
  });

  for (const pair of validPairs) {
    const act = pair.actual!.toLowerCase();
    const pred = pair.predicted.toLowerCase();
    if (act === 'hire' && pred === 'hire') {
      tp++;
    } else if (act === 'reject' && pred === 'hire') {
      fp++;
    } else if (act === 'hire' && pred === 'reject') {
      fn++;
    } else if (act === 'reject' && pred === 'reject') {
      tn++;
    }
  }

  const total = tp + fp + fn + tn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    precision: Math.round(precision * 100) / 100,
    recall: Math.round(recall * 100) / 100,
    f1Score: Math.round(f1Score * 100) / 100,
    confusionMatrix: {
      tp,
      fp,
      fn,
      tn
    }
  };
}
