import { BrowserRouter as Router } from 'react-router-dom';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

function App() {
  return (
    <Router>
      <div className="App">
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </div>
    </Router>
  );
}

export default App;
