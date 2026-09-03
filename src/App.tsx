import { Redirect, Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages & Layouts
import { ShowroomHome } from './components/editorial/ShowroomHome';
import { ProductDetail } from './components/catalogue/ProductDetail';
import { SearchCatalogue } from './components/catalogue/SearchCatalogue';
import { CollectionsPage } from './components/editorial/CollectionsPage';
import { Footer } from './components/editorial/Footer';
import { WhatsAppButton } from './components/editorial/WhatsAppButton';
import { RouteEffects } from './components/RouteEffects';
import { collectionFilterPath } from './lib/collectionRoutes';

// Admin Pages
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminCategories } from './components/admin/AdminCategories';
import { AdminProducts } from './components/admin/AdminProducts';
import { ProductForm } from './components/admin/ProductForm';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <RouteEffects />
        <Switch>
          {/* Specific routes first — home "/" must be last among public routes */}
          <Route path="/collections">
            <>
              <CollectionsPage />
              <Footer />
              <WhatsAppButton />
            </>
          </Route>
          <Route path="/collections/:slug">
            {(params) => <Redirect to={collectionFilterPath(params.slug)} replace />}
          </Route>
          <Route path="/products/:code">
            {(params) => (
              <>
                <ProductDetail params={params} />
                <Footer />
                <WhatsAppButton />
              </>
            )}
          </Route>
          <Route path="/search">
            <>
              <SearchCatalogue />
              <Footer />
              <WhatsAppButton />
            </>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/categories" component={AdminCategories} />
          <Route path="/admin/products/new" component={ProductForm} />
          <Route path="/admin/products/edit/:code" component={ProductForm} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin" component={AdminProducts} />

          {/* Homepage — keep after all other static paths */}
          <Route path="/">
            <>
              <ShowroomHome />
              <Footer />
              <WhatsAppButton />
            </>
          </Route>

          {/* Catch-all Not Found Route */}
          <Route>
            <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center font-sans">
              <h2 className="font-serif text-3xl mb-4">Page Not Found</h2>
              <p className="text-sm text-[#8C8C8C] mb-6">The page you are looking for does not exist.</p>
              <a href="/" className="px-6 py-2 border border-[#C5A880] text-xs uppercase tracking-widest hover:bg-[#C5A880] hover:text-[#FAF9F6] transition-colors">
                Return to Showroom
              </a>
            </div>
          </Route>
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
