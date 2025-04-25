import { useState } from 'react';
import axios from 'axios';

const PredictObjectiveCompletion = () => {
  const [objective, setObjective] = useState({
    target_amount: 1000,
    minbudget: 100,
    maxbudget: 2000,
    current_progress: 50,
    avg_weekly_progress: 5,
    objectivetype: 'Savings'
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/predict-completion', objective);
      setPrediction(response.data.completed);
    } catch (err) {
      setError('Error predicting completion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Predict Objective Completion</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <label>
          Target Amount:
          <input
            type="number"
            value={objective.target_amount}
            onChange={(e) => setObjective({ ...objective, target_amount: e.target.value })}
          />
        </label>
        <label>
          Min Budget:
          <input
            type="number"
            value={objective.minbudget}
            onChange={(e) => setObjective({ ...objective, minbudget: e.target.value })}
          />
        </label>
        <label>
          Max Budget:
          <input
            type="number"
            value={objective.maxbudget}
            onChange={(e) => setObjective({ ...objective, maxbudget: e.target.value })}
          />
        </label>
        <label>
          Current Progress:
          <input
            type="number"
            value={objective.current_progress}
            onChange={(e) => setObjective({ ...objective, current_progress: e.target.value })}
          />
        </label>
        <label>
          Average Weekly Progress:
          <input
            type="number"
            value={objective.avg_weekly_progress}
            onChange={(e) => setObjective({ ...objective, avg_weekly_progress: e.target.value })}
          />
        </label>
        <label>
          Objective Type:
          <input
            type="text"
            value={objective.objectivetype}
            onChange={(e) => setObjective({ ...objective, objectivetype: e.target.value })}
          />
        </label>
        <button type="submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : 'Predict'}
        </button>
      </form>

      {prediction !== null && (
        <div>
          <h3>Prediction Result:</h3>
          <p>{prediction ? 'Objective is likely to be completed' : 'Objective is unlikely to be completed'}</p>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default PredictObjectiveCompletion;
