import { lazy, Suspense } from "react";
import "./App.css";
import ErrorBoundary from "./components/ErrorBoundary";
import MainContainer from "./components/MainContainer";
import { LoadingProvider } from "./context/LoadingProvider";

const CharacterModel = lazy(() => import("./components/Character"));

const App = () => {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <a className="skip-link" href="#main">
        تجاوز إلى المحتوى
      </a>

      <LoadingProvider>
        <MainContainer>
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <CharacterModel />
            </Suspense>
          </ErrorBoundary>
        </MainContainer>
      </LoadingProvider>
    </>
  );
};

export default App;
