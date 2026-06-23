import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { deDE } from '@clerk/localizations';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  useGetMyRole,
  getGetMyRoleQueryKey,
  useClaimMyRole,
  useGetMyCustomerProfile,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "./pages/Home";
import Search from "./pages/Search";
import ProviderDetail from "./pages/ProviderDetail";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import Admin from "./pages/Admin";
import ImmobilienKundeOnboarding from "./pages/ImmobilienKundeOnboarding";
import CustomerOnboarding from "./pages/CustomerOnboarding";
import AnfrageStellen from "./pages/AnfrageStellen";
import MeineAnfragen from "./pages/MeineAnfragen";
import Impressum from "./pages/legal/Impressum";
import AGB from "./pages/legal/AGB";
import Datenschutz from "./pages/legal/Datenschutz";
import Cookies from "./pages/legal/Cookies";
import { CookieBanner } from "./components/CookieBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/favicon.svg`,
  },
  variables: {
    colorPrimary: "hsl(210 25% 25%)",
    colorForeground: "hsl(220 30% 15%)",
    colorMutedForeground: "hsl(220 15% 45%)",
    colorDanger: "hsl(0 70% 50%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(40 10% 88%)",
    colorInputForeground: "hsl(220 30% 15%)",
    colorNeutral: "hsl(40 10% 88%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-medium hover:text-primary/80",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground bg-white px-2",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-destructive",
    logoBox: "flex justify-center",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "border border-input hover:bg-muted/50",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium",
    formFieldInput: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    footerAction: "mt-4 border-t pt-4 border-border",
    dividerLine: "bg-border h-[1px]",
    alert: "bg-destructive/10 border border-destructive/20 rounded-md p-3",
    otpCodeFieldInput: "border-input",
    formFieldRow: "space-y-2",
    main: "p-6",
  },
};

// Only allow same-origin internal redirect targets (must start with a single "/").
function readRedirectParam(): string | null {
  const r = new URLSearchParams(window.location.search).get("redirect");
  if (!r || !r.startsWith("/") || r.startsWith("//")) return null;
  return r;
}

function SignInPage() {
  const [cfg] = useState(() => {
    const redirect = readRedirectParam();
    return {
      redirectUrl: redirect ? `${basePath}${redirect}` : undefined,
      signUpUrl: `${basePath}/sign-up${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
    };
  });
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={cfg.signUpUrl}
        forceRedirectUrl={cfg.redirectUrl}
        fallbackRedirectUrl={cfg.redirectUrl}
      />
    </div>
  );
}

function SignUpPage() {
  // Klard is customer-only. Berater register in the dedicated provider app
  // (/berater/). New customers are sent to the required /willkommen onboarding,
  // carrying any booking deep-link (?redirect=) through to resume afterwards.
  const [cfg] = useState(() => {
    const redirect = readRedirectParam();
    // New customers always pass through the required onboarding (/willkommen),
    // which collects the postal address before resuming any booking deep-link.
    const redirectUrl = `${basePath}/willkommen${
      redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""
    }`;
    return {
      redirectUrl,
      signInUrl: `${basePath}/sign-in${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
    };
  });
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={cfg.signInUrl}
        forceRedirectUrl={cfg.redirectUrl}
        fallbackRedirectUrl={cfg.redirectUrl}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function FullscreenLoader() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Sends Berater accounts to their own app. One account is either Kunde OR
// Berater — never both (strict role separation in the shared Clerk instance).
function RoleBlocked() {
  const { signOut } = useClerk();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-3">Dieses Konto ist ein Beraterkonto</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Mit dieser E-Mail-Adresse sind Sie als Berater registriert. Ein Konto kann
          entweder Kunde oder Berater sein — nicht beides. Bitte nutzen Sie den
          Beraterbereich, oder melden Sie sich mit einer anderen Adresse als Kunde an.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="rounded-full" onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-roleblock-signout">
            Abmelden
          </Button>
          <a href="/berater/">
            <Button className="rounded-full bg-primary hover:bg-[var(--klard-teal-d)] text-white" data-testid="button-roleblock-berater">
              Zum Beraterbereich
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

// Ensures the signed-in user holds the `customer` role: claims it if unset,
// blocks if the account is already a provider.
function CustomerRoleGate({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: role, isLoading, isError } = useGetMyRole({
    query: { queryKey: getGetMyRoleQueryKey() },
  });
  const claim = useClaimMyRole();
  const attempted = useRef(false);

  useEffect(() => {
    if (isLoading || isError || attempted.current) return;
    if (role?.role == null) {
      attempted.current = true;
      claim.mutate(
        { data: { role: "customer" } },
        {
          onSettled: () => {
            qc.invalidateQueries({ queryKey: getGetMyRoleQueryKey() });
          },
        },
      );
    }
  }, [role, isLoading, isError, claim, qc]);

  if (isLoading) return <FullscreenLoader />;
  if (!isError && role?.role === "provider") return <RoleBlocked />;
  if (!isError && role?.role == null) return <FullscreenLoader />;
  return <>{children}</>;
}

// Ensures the signed-in customer has completed the required registration
// profile (postal address). If not, bounces to the /willkommen onboarding,
// preserving the intended destination so booking deep-links resume afterwards.
function CustomerProfileGate({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: profile, isLoading, isError, refetch, isFetching } =
    useGetMyCustomerProfile();

  if (isLoading) return <FullscreenLoader />;
  // Fail CLOSED: the profile is required, so an API error must block access (with
  // a retry) rather than silently letting the user through without one.
  if (isError) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Ihr Profil konnte nicht geladen werden. Bitte versuchen Sie es erneut.
        </p>
        <Button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Wird geladen…" : "Erneut versuchen"}
        </Button>
      </div>
    );
  }
  if (profile == null) {
    const redirectTo =
      location && location !== "/"
        ? `/willkommen?redirect=${encodeURIComponent(location)}`
        : "/willkommen";
    return <Redirect to={redirectTo} />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <CustomerRoleGate>
          <CustomerProfileGate>
            <Redirect to="/search" />
          </CustomerProfileGate>
        </CustomerRoleGate>
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  // Preserve the intended destination so a deep-linked booking returns the
  // customer exactly where they were after signing in.
  const redirectTo =
    location && location !== "/"
      ? `/sign-in?redirect=${encodeURIComponent(location)}`
      : "/sign-in";
  return (
    <>
      <Show when="signed-in">
        <CustomerRoleGate>
          <CustomerProfileGate>
            <Component />
          </CustomerProfileGate>
        </CustomerRoleGate>
      </Show>
      <Show when="signed-out">
        <Redirect to={redirectTo} />
      </Show>
    </>
  );
}

// Like AuthRoute but WITHOUT the profile gate — used by /willkommen itself so
// the onboarding page never redirects to itself.
function ProfilelessAuthRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  const redirectTo =
    location && location !== "/"
      ? `/sign-in?redirect=${encodeURIComponent(location)}`
      : "/sign-in";
  return (
    <>
      <Show when="signed-in">
        <CustomerRoleGate>
          <Component />
        </CustomerRoleGate>
      </Show>
      <Show when="signed-out">
        <Redirect to={redirectTo} />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={deDE}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/search" component={Search} />
          <Route path="/impressum" component={Impressum} />
          <Route path="/agb" component={AGB} />
          <Route path="/datenschutz" component={Datenschutz} />
          <Route path="/cookies" component={Cookies} />
          <Route path="/providers/:id" component={ProviderDetail} />
          <Route path="/anfrage" component={AnfrageStellen} />
          <Route path="/meine-anfragen" component={MeineAnfragen} />
          
          <Route path="/booking/:providerId/:serviceId/:slotId">
            {() => <AuthRoute component={BookingConfirmation} />}
          </Route>
          <Route path="/bookings">
            {() => <AuthRoute component={MyBookings} />}
          </Route>
          <Route path="/admin">
            {() => <AuthRoute component={Admin} />}
          </Route>
          <Route path="/willkommen">
            {() => <ProfilelessAuthRoute component={CustomerOnboarding} />}
          </Route>
          <Route path="/immobilien/onboarding">
            {() => <AuthRoute component={ImmobilienKundeOnboarding} />}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <CookieBanner />
        <Toaster />
      </TooltipProvider>
    </WouterRouter>
  );
}

export default App;
