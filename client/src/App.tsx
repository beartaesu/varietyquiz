import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainHomePage from "@/pages/main-home";
import SitemapPage from "@/pages/sitemap";
import QuizGamePage from "@/pages/quiz-game";
import CategoryInfoPage from "@/pages/category-info";
import BracketCategoriesPage from "@/pages/bracket-categories";
import BadmintonMatcherPage from "@/pages/badminton-matcher";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainHomePage} />
      <Route path="/sitemap" component={SitemapPage} />
      <Route path="/bracket" component={BracketCategoriesPage} />
      <Route path="/bracket/badminton" component={BadmintonMatcherPage} />
      <Route path="/quiz" component={QuizGamePage} />
      <Route path="/category/:category">
        {(params) => <CategoryInfoPage category={params.category} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
