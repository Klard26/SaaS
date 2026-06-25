import { useEffect, useMemo, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { deDE } from "@clerk/localizations";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  useGetMyProviderProfile,
  getGetMyProviderProfileQueryKey,
  useGetMyRole,
  getGetMyRoleQueryKey,
  useClaimMyRole,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/Dashboard";
import ProviderOnboarding from "./pages/ProviderOnboarding";
import ProviderProfile from "./pages/ProviderProfile";
import ProviderServices from "./pages/ProviderServices";
import ProviderAvailability from "./pages/ProviderAvailability";
import ProviderRequests from "./pages/ProviderRequests";
import ProviderWallet from "./pages/ProviderWallet";
import Pricing from "./pages/Pricing";
import BeraterWerden from "./pages/BeraterWerden";
import DienstleisterWerden from "./pages/DienstleisterWerden";
import AuthChooser from "./pages/AuthChooser";
import Impressum from "./pages/legal/Impressum";
import AGB from "./pages/legal/AGB";
import Datenschutz from "./pages/legal/Datenschutz";
import Cookies from "./pages/legal/Cookies";
import { CookieBanner } from "./components/CookieBanner";
import { rememberProviderWorld, readRememberedWorld, worldFromSearch } from "./lib/providerWorld";

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
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
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
    colorPrimary: "hsl(192 91% 36%)",
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

function SignInPage() {
  const world = useMemo(
    () => worldFromSearch(window.location.search) ?? readRememberedWorld(),
    [],
  );
  useEffect(() => {
    if (world) rememberProviderWorld(world);
  }, [world]);
  if (!world) return <AuthChooser mode="sign-in" />;
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up?world=${world}`}
        forceRedirectUrl={`${basePath}/`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function SignUpPage() {
  // Capture the provider world from the URL once (?world=alltag|pro), falling
  // back to a value remembered from the landing page so it survives Clerk's
  // internal sign-in -> sign-up transitions which drop the query string.
  const world = useMemo(() => worldFromSearch(window.location.search) ?? readRememberedWorld(), []);
  useEffect(() => {
    if (world) rememberProviderWorld(world);
  }, [world]);
  if (!world) return <AuthChooser mode="sign-up" />;
  const onboardingUrl = `${basePath}/provider/onboarding?world=${world}`;
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in?world=${world}`}
        forceRedirectUrl={onboardingUrl}
        fallbackRedirectUrl={onboardingUrl}
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

// Blocks accounts that already belong to the customer side. One account is
// either Kunde OR Berater — never both (strict role separation in the shared
// Clerk instance).
function RoleBlocked() {
  const { signOut } = useClerk();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl font-semibold mb-3">Dieses Konto ist ein Kundenkonto</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Mit dieser E-Mail-Adresse sind Sie bereits als Kunde bei Klard registriert.
          Ein Konto kann entweder Kunde oder Berater sein — nicht beides. Bitte melden
          Sie sich mit einer anderen Adresse als Berater an, oder nutzen Sie Klard als Kunde.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="rounded-full" onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-roleblock-signout">
            Abmelden
          </Button>
          <a href="/">
            <Button className="rounded-full bg-primary hover:bg-[var(--klard-teal-d)] text-white" data-testid="button-roleblock-customer">
              Zu Klard für Kunden
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

// Ensures the signed-in user holds the `provider` role: claims it if unset,
// blocks if the account is already a customer.
function ProviderRoleGate({ children }: { children: React.ReactNode }) {
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
        { data: { role: "provider" } },
        {
          onSettled: () => {
            qc.invalidateQueries({ queryKey: getGetMyRoleQueryKey() });
          },
        },
      );
    }
  }, [role, isLoading, isError, claim, qc]);

  if (isLoading) return <FullscreenLoader />;
  if (!isError && role?.role === "customer") return <RoleBlocked />;
  if (!isError && role?.role == null) return <FullscreenLoader />;
  return <>{children}</>;
}

// Signed-in landing: providers with a profile go to the dashboard, those who
// claimed the role but haven't built a profile go to onboarding.
function SignedInHome() {
  const { data: profile, isLoading, isError } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey() },
  });
  if (isLoading) return <FullscreenLoader />;
  return <Redirect to={!isError && profile?.id ? "/dashboard" : "/provider/onboarding"} />;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <ProviderRoleGate>
          <SignedInHome />
        </ProviderRoleGate>
      </Show>
      <Show when="signed-out">
        <BeraterWerden />
      </Show>
    </>
  );
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  const redirectTo =
    location && location !== "/"
      ? `/sign-in?redirect=${encodeURIComponent(location)}`
      : "/sign-in";
  return (
    <>
      <Show when="signed-in">
        <ProviderRoleGate>
          <Component />
        </ProviderRoleGate>
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
          <Route path="/dienstleister-werden" component={DienstleisterWerden} />
          <Route path="/pricing">
            {() => <AuthRoute component={Pricing} />}
          </Route>
          <Route path="/impressum" component={Impressum} />
          <Route path="/agb" component={AGB} />
          <Route path="/datenschutz" component={Datenschutz} />
          <Route path="/cookies" component={Cookies} />

          <Route path="/dashboard">
            {() => <AuthRoute component={Dashboard} />}
          </Route>
          <Route path="/provider/onboarding">
            {() => <AuthRoute component={ProviderOnboarding} />}
          </Route>
          <Route path="/provider/profile">
            {() => <AuthRoute component={ProviderProfile} />}
          </Route>
          <Route path="/provider/services">
            {() => <AuthRoute component={ProviderServices} />}
          </Route>
          <Route path="/provider/availability">
            {() => <AuthRoute component={ProviderAvailability} />}
          </Route>
          <Route path="/anfragen">
            {() => <AuthRoute component={ProviderRequests} />}
          </Route>
          <Route path="/wallet">
            {() => <AuthRoute component={ProviderWallet} />}
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
