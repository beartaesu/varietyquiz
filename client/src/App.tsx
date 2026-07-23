import { Switch, Route, useLocation, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainHomePage from "@/pages/main-home";
import SitemapPage from "@/pages/sitemap";
import QuizGamePage from "@/pages/quiz-game";
import CategoryInfoPage from "@/pages/category-info";
import BadmintonMatcherPage from "@/pages/badminton-matcher";
import BadmintonBoardPage from "@/pages/badminton-board";
import WorldCupCreatePage from "@/pages/worldcup-create";
import WorldCupPlayPage from "@/pages/worldcup-play";
import WorldCupGalleryPage from "@/pages/worldcup-gallery";
import MatchingChoicePage from "@/pages/matching-choice";
import FreeMatcherPage from "@/pages/free-matcher";
import { Home } from "lucide-react";

function CategoryRoute() {
  const { category } = useParams<{ category: string }>();
  return <CategoryInfoPage category={category} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainHomePage} />
      <Route path="/sitemap" component={SitemapPage} />
      <Route path="/matching" component={MatchingChoicePage} />
      <Route path="/matching/free" component={FreeMatcherPage} />
      <Route path="/bracket" component={MainHomePage} />
      <Route path="/bracket/badminton" component={BadmintonMatcherPage} />
      <Route path="/bracket/badminton/board" component={BadmintonBoardPage} />
      <Route path="/bracket/worldcup" component={WorldCupGalleryPage} />
      <Route path="/bracket/worldcup/create" component={WorldCupCreatePage} />
      <Route path="/bracket/worldcup/play" component={WorldCupPlayPage} />
      <Route path="/quiz" component={QuizGamePage} />
      <Route path="/category/:category" component={CategoryRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalHomeButton() {
  const [location, setLocation] = useLocation();
  if (location === "/") return null;
  return <button className="global-home-button" onClick={() => setLocation("/")}><Home /> 홈으로</button>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <GlobalHomeButton />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
